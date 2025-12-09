"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Loader2, GripVertical, Sparkles, Wand2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface OutlineItem { id: string; title: string; isImage?: boolean; sectionImage?: boolean; sub?: OutlineItem[] }

const newId = () => Math.random().toString(36).slice(2);

export default function OutlineStepPage() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const blogId = useMemo(() => Number(Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id), [params]);
  const [loading, setLoading] = useState(true);
  const [regeneratingOutline, setRegeneratingOutline] = useState(false);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [regeneratingSubId, setRegeneratingSubId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [featuredImage, setFeaturedImage] = useState(true);

  const ctx = useMemo(() => ({
    title: search.get("title") || "",
    primary: search.get("primary") || "",
    secondary: search.get("secondary") || "",
    wordCount: Number(search.get("wordCount") || "1000"),
    companyProfileId: search.get("companyProfileId") || "self",
  }), [search]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/blogs/generate-outline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blogId,
            title: ctx.title,
            primaryKeyword: ctx.primary,
            secondaryKeywords: ctx.secondary?.split(",").map(s => s.trim()).filter(Boolean) || [],
            targetWordCount: ctx.wordCount,
            companyProfileId: ctx.companyProfileId === "self" ? null : Number(ctx.companyProfileId),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        
        if (!res.ok) {
          console.error("Outline generation failed:", data?.error);
          toast.error(data?.error || "Failed to generate outline. Try Regenerate.");
        }
        
        const mapped: OutlineItem[] = (data.outline || []).map((sec: any) => ({
          id: newId(),
          title: sec.title,
          sectionImage: false,
          sub: (sec.items || []).map((s: any) => ({ id: newId(), title: s.title })),
        }));
        setOutline(mapped);
      } catch (e: any) {
        console.error("Outline generation error:", e);
        toast.error(e?.message || "Couldn't generate outline. Try Regenerate.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [blogId, ctx.title, ctx.primary, ctx.secondary, ctx.wordCount, ctx.companyProfileId]);

  const addSection = () => setOutline([...outline, { id: newId(), title: "New Section", sectionImage: false, sub: [] }]);
  const removeSection = (id: string) => setOutline(outline.filter(s => s.id !== id));
  const addSub = (sid: string) =>
    setOutline(outline.map(s =>
      s.id === sid
        ? { ...s, sub: [...(s.sub || []), { id: newId(), title: "New Subsection", isImage: false }] }
        : s
    ));
  const removeSub = (sid: string, id: string) => setOutline(outline.map(s => s.id===sid ? { ...s, sub: (s.sub||[]).filter(x=>x.id!==id) } : s));

  const regenerate = async () => {
    setRegeneratingOutline(true);
    try {
      const res = await fetch("/api/blogs/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          title: ctx.title,
          primaryKeyword: ctx.primary,
          secondaryKeywords: ctx.secondary?.split(",").map(s => s.trim()).filter(Boolean) || [],
          targetWordCount: ctx.wordCount,
          companyProfileId: ctx.companyProfileId === "self" ? null : Number(ctx.companyProfileId),
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data?.error || "Regeneration failed");
        return;
      }
      
      const mapped: OutlineItem[] = (data.outline || []).map((sec: any) => ({
        id: newId(),
        title: sec.title,
        sectionImage: false,
        sub: (sec.items || []).map((s: any) => ({ id: newId(), title: s.title, isImage: false })),
      }));
      setOutline(mapped);
      
      if (mapped.length > 0) {
        toast.success("Outline regenerated successfully!");
      }
    } catch (e: any) {
      toast.error(e?.message || "Regeneration failed");
    } finally {
      setRegeneratingOutline(false);
    }
  };

  const generateBlog = async () => {
    if (!outline.length) {
      toast.error("Add at least one section to outline");
      return;
    }
    
    setGenerating(true);
    
    // Prepare outline data
    const wire = {
      featuredImage,
      sections: outline.map(sec => ({
        title: sec.title,
        sectionImage: sec.sectionImage !== false,
        items: (sec.sub || []).map(s => ({ title: s.title })),
      }))
    };
    
    try {
      // Update blog status to processing
      await fetch(`/api/blogs/${blogId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' }),
      });
      
      // Store outline in sessionStorage for background generation
      window.sessionStorage.setItem(`outline:${blogId}`, JSON.stringify(wire));
      
      // Redirect to My Blogs immediately
      toast.success("Blog generation started! You'll see progress in My Blogs.");
      router.push('/dashboard/blogs');
      
      // Trigger generation in background (fire and forget)
      fetch("/api/blogs/generate-from-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          title: ctx.title,
          primaryKeyword: ctx.primary,
          secondaryKeywords: ctx.secondary.split(",").map(s=>s.trim()).filter(Boolean),
          targetWordCount: ctx.wordCount,
          outline: wire.sections,
          featuredImage: wire.featuredImage,
          companyProfileId: ctx.companyProfileId === "self" ? null : Number(ctx.companyProfileId),
        }),
      }).catch(err => console.error("Background generation error:", err));
      
    } catch (error) {
      console.error("Failed to start generation:", error);
      toast.error("Failed to start blog generation");
      setGenerating(false);
    }
  };

  return (
    <TooltipProvider>
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground"><ArrowLeft className="h-4 w-4 mr-1"/>Back</Button>
        <h1 className="text-3xl font-bold">Review & Edit Outline</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary"/>
            AI-Generated Outline
          </CardTitle>
          <CardDescription>
            Drag to reorder, click to edit. Add/remove sections as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"/>
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10"/>
              </div>
              <p className="mt-4 text-muted-foreground">Crafting a smart outline…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">Title</Badge>
                  <span className="truncate max-w-[48ch]">{ctx.title}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={()=>setFeaturedImage(!featuredImage)}
                    className="gap-2"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={featuredImage}
                      onChange={e=>setFeaturedImage(e.target.checked)}
                      onClick={e=>e.stopPropagation()}
                    />
                    Featured Image
                  </Button>
                  <Button variant="outline" onClick={regenerate} disabled={regeneratingOutline}>
                    {regeneratingOutline ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Regenerating…</> : <><Wand2 className="h-4 w-4 mr-2"/>Regenerate</>}
                  </Button>
                  <Button onClick={addSection} variant="secondary"><Plus className="h-4 w-4 mr-1"/>Add Section</Button>
                </div>
              </div>

              <Reorder.Group axis="y" values={outline} onReorder={setOutline} className="space-y-3">
                {outline.map((sec) => (
                  <Reorder.Item key={sec.id} value={sec} className="rounded-xl border bg-card">
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing"/>
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <div className="relative flex-1 max-w-[720px]">
                            <Input
                              value={sec.title}
                              onChange={(e)=>setOutline(outline.map(s=>s.id===sec.id?{...s,title:e.target.value}:s))}
                              className="pr-12"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  aria-label="Regenerate section"
                                  onClick={async()=>{
                          if(regeneratingSectionId || regeneratingOutline) return;
                          setRegeneratingSectionId(sec.id);
                          try{
                            const res=await fetch('/api/blogs/generate-outline/section',{
                              method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                                title: ctx.title, primaryKeyword: ctx.primary, secondaryKeywords: ctx.secondary?.split(',').map(s=>s.trim()).filter(Boolean)||[],
                                targetWordCount: ctx.wordCount, currentSectionTitle: sec.title
                              })});
                            if(!res.ok) throw new Error('Failed');
                            const data=await res.json();
                            setOutline(outline.map(s=>s.id===sec.id?{...s,title:data.section?.title||s.title,sub:(data.section?.items||[]).map((x:any)=>({id: newId(), title:x.title}))}:s));
                          }catch{ /* ignore */ }
                          finally{ setRegeneratingSectionId(null); }
                            }}
                                  className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                  {regeneratingSectionId===sec.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Regenerate section
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-2 pl-1">
                            <label className="flex items-center gap-2 h-10 rounded-md bg-background/80 px-3 text-sm text-muted-foreground border border-border whitespace-nowrap cursor-pointer hover:bg-accent/50 transition-colors">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={sec.sectionImage !== false}
                                onChange={e=>{
                                  const checked = e.target.checked;
                                  const sectionId = sec.id;
                                  setOutline(prev => prev.map(s=>s.id===sectionId?{...s,sectionImage:checked}:s));
                                }}
                              />
                              Image
                            </label>
                            <Button variant="ghost" size="icon" onClick={()=>removeSection(sec.id)}><Trash2 className="h-4 w-4"/></Button>
                          </div>
                        </div>
                      </div>
                      <div className="pl-7 mt-3 space-y-2">
                        {(sec.sub||[]).map((sub) => (
                          <div key={sub.id} className="flex items-center gap-3">
                            <span className="text-muted-foreground">•</span>
                            <div className="flex flex-1 items-center justify-between gap-2">
                              <div className="relative flex-1 max-w-[800px]">
                                <Input
                                  value={sub.title}
                                  onChange={(e)=>setOutline(outline.map(s=>s.id===sec.id?{...s,sub:(s.sub||[]).map(x=>x.id===sub.id?{...x,title:e.target.value}:x)}:s))}
                                  className="pr-12"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      aria-label="Regenerate subsection"
                                      onClick={async()=>{
                              if(regeneratingSubId || regeneratingOutline) return;
                              setRegeneratingSubId(sub.id);
                              try{
                                const res=await fetch('/api/blogs/generate-outline/subsection',{
                                  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                                    title: ctx.title, primaryKeyword: ctx.primary, secondaryKeywords: ctx.secondary?.split(',').map(s=>s.trim()).filter(Boolean)||[],
                                    targetWordCount: ctx.wordCount, sectionTitle: sec.title, currentSubTitle: sub.title
                                  })});
                                if(!res.ok) throw new Error('Failed');
                                const data=await res.json();
                                setOutline(outline.map(s=>s.id===sec.id?{...s,sub:(s.sub||[]).map(x=>x.id===sub.id?{...x,title:data.subsection?.title||x.title}:x)}:s));
                              }catch{ /* ignore */ }
                              finally{ setRegeneratingSubId(null); }
                                }}
                                      className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary/20"
                                    >
                                      {regeneratingSubId===sub.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Sparkles className="h-4 w-4" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Regenerate subsection
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex items-center gap-2 pl-1">
                                <Button variant="ghost" size="icon" onClick={()=>removeSub(sec.id, sub.id)}><Trash2 className="h-4 w-4"/></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={()=>addSub(sec.id)} className="mt-1"><Plus className="h-3 w-3 mr-1"/>Add Subsection</Button>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              <div className="pt-4">
                <Button onClick={generateBlog} disabled={generating} className="w-full h-12 text-lg">
                  {generating ? <><Loader2 className="h-5 w-5 animate-spin mr-2"/>AI is crafting your blog…</> : <><Sparkles className="h-5 w-5 mr-2"/>Generate Blog (with Images)</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
