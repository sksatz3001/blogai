"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
// Lazy load heavy editor to speed up route transitions
const TiptapEditor = dynamic(() => import("@/components/tiptap-editor").then(m => ({ default: m.TiptapEditor })), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-border p-6 text-center text-muted-foreground">
      Loading editor...
    </div>
  ),
});
import { BlogToc } from "@/components/blog-toc";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Wand2, Sparkles, Download, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmployeeBlogEditorProps {
  blogId: number;
  employeeId: number;
  employeeName: string;
}

export default function EmployeeBlogEditor({
  blogId,
  employeeId,
  employeeName,
}: EmployeeBlogEditorProps) {
  const router = useRouter();

  const [blog, setBlog] = useState<any>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [showMagicWand, setShowMagicWand] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const streamCompletedRef = useRef(false);

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  const fetchBlog = async (autoGenerate = true) => {
    if (!blogId) return;
    
    try {
      const response = await fetch(`/api/employee/blogs/${blogId}`);
      if (!response.ok) throw new Error("Failed to fetch blog");
      
      const data = await response.json();
      setBlog(data);
      const newContent = data.htmlContent || data.content || "";
      setContent(newContent);
      
      // If blog has no content and autoGenerate is true, start generation automatically
      if (autoGenerate && !data.content && !data.htmlContent) {
        setTimeout(() => startGenerationWithBlog(data), 100);
      }
    } catch (error) {
      console.error("Fetch blog error:", error);
      toast.error("Failed to load blog");
      router.push("/employee/blogs");
    } finally {
      setLoading(false);
    }
  };

  const startGenerationWithBlog = async (blogData: any) => {
    setGenerating(true);
    setStreaming(true);
    setContent("");
    streamCompletedRef.current = false;
    // timer used across try/catch/finally for throttled UI flushes
    let flushTimer: number | null = null;

    try {
      const response = await fetch("/api/employee/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: blogData.id,
          title: blogData.title,
          primaryKeyword: blogData.primaryKeyword,
          secondaryKeywords: blogData.secondaryKeywords,
          targetWordCount: blogData.targetWordCount,
        }),
      });

      if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = "";
  const UPDATE_INTERVAL = 180; // throttle cadence to reduce flicker

      const formatStreaming = (raw: string) => {
        let out = raw
          .replace(/<h1(?![^>]*brand-primary-heading)[^>]*>/gi, '<h1 class="brand-primary-heading">')
          .replace(/<h2(?![^>]*brand-secondary-heading)[^>]*>/gi, '<h2 class="brand-secondary-heading">')
          .replace(/<h3(?![^>]*brand-accent-heading)[^>]*>/gi, '<h3 class="brand-accent-heading">');
        const lines = out.split(/\n+/).map(l => l.trim());
        out = lines.map(l => {
          if (!l) return '';
          if (/^<h[1-3]|^<p|^<ul|^<ol|^<blockquote|^<li|^<strong|^<em|^<a /i.test(l)) return l;
          return `<p class="brand-paragraph">${l}</p>`;
        }).join('\n');
        out = out.replace(/<p(?![^>]*brand-paragraph)[^>]*>/gi, '<p class="brand-paragraph">');
        out = out.replace(/<p class="brand-paragraph">([^<]+)<\/p>/g, (m, text) => {
          const t = String(text).trim();
          const wordCount = t.split(/\s+/).length;
          const isQuestion = /\?$/.test(t);
          const endsWithPunct = /[\.!]$/.test(t);
          const hasColon = /:\s*$/.test(t);
          const known = ['Why This Topic Matters','Benefits vs. Challenges Analysis','Step-by-Step Implementation Guide','Expert Tips & Best Practices','Real-World Examples & Case Studies','Conclusion & Next Steps','Frequently Asked Questions','FAQ'];
          if (known.includes(t.replace(/:$/, ''))) {
            return `<h2 class="brand-secondary-heading">${t.replace(/:$/, '')}</h2>`;
          }
          if (isQuestion && wordCount <= 18) return `<h3 class="brand-accent-heading">${t}</h3>`;
          if ((hasColon || (!endsWithPunct && wordCount <= 12 && /^[A-Z][A-Za-z0-9 &()\-\/,:]+$/.test(t)))) {
            return `<h2 class="brand-secondary-heading">${t.replace(/:$/, '')}</h2>`;
          }
          return m;
        });
        return out;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulatedContent += chunk;
        // schedule a throttled flush
        if (flushTimer === null) {
          flushTimer = window.setTimeout(() => {
            setContent(formatStreaming(accumulatedContent));
            if (editorRef.current) {
              // RAF smooth scroll
              requestAnimationFrame(() => {
                if (editorRef.current) {
                  editorRef.current.scrollTop = editorRef.current.scrollHeight;
                }
              });
            }
            flushTimer = null;
          }, UPDATE_INTERVAL);
        }
      }
      // Final update with formatting
      setContent(formatStreaming(accumulatedContent));
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer);
        flushTimer = null;
      }
      setStreaming(false);
      toast.success("Blog generated successfully!");
      
      setShowMagicWand(true);
      setTimeout(() => setShowMagicWand(false), 2000);
      
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate blog");
      setStreaming(false);
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer);
        flushTimer = null;
      }
    } finally {
      setGenerating(false);
    }
  };

  const startGeneration = async () => {
    if (!blog) {
      toast.error("Blog data not loaded");
      return;
    }
    await startGenerationWithBlog(blog);
  };

  const generateImages = async (blogContent: string) => {
    if (!blogId) return;
    
    try {
      const response = await fetch(`/api/employee/blogs/${blogId}/generate-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: blogContent }),
      });

      if (!response.ok) throw new Error("Failed to generate images");
      
      const data = await response.json();
      
      if (data.images.length > 0) {
        toast.success(`Generated ${data.images.length} images!`);
        // Reload to show images
        fetchBlog(false);
      } else {
        toast.info("No image placeholders found in content");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate images");
    }
  };

  const calculateSEO = async () => {
    if (!blogId) return;
    
    try {
      toast.info("Calculating SEO metrics...");
      const response = await fetch(`/api/employee/blogs/${blogId}/calculate-seo`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to calculate SEO");
      
      const data = await response.json();
      toast.success("SEO metrics calculated successfully!");
      
      // Reload to show updated metrics
      fetchBlog(false);
    } catch (error) {
      console.error("SEO calculation error:", error);
      toast.error("Failed to calculate SEO metrics");
    }
  };

  const exportHTML = () => {
    const htmlContent = content || blog?.htmlContent || "";
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blog?.title || "blog"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML exported successfully!");
  };

  const handleSave = async (newContent: string) => {
    if (!blogId) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/employee/blogs/${blogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newContent, 
          htmlContent: newContent,
          // Mark as saved when user explicitly saves
          status: "published",
          publishedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      toast.success("Blog saved!");
  setContent(newContent);
  // Refresh to pick updated status
  await fetchBlog(false);
    } catch (error) {
      toast.error("Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: "draft" | "published") => {
    if (!blogId) return;
    setPublishing(true);
    try {
      const response = await fetch(`/api/employee/blogs/${blogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          publishedAt: newStatus === "published" ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to update status");
  toast.success(newStatus === "published" ? "Blog saved" : "Blog set to draft");
      // Refresh blog data to reflect status change
      await fetchBlog(false);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/employee/blogs")}
              className="text-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{blog?.title}</h1>
            <p className="text-muted-foreground mt-2">Logged in as {employeeName}</p>
          </div>

          <div className="flex gap-3">
            {!streaming && (
              <>
                <Button onClick={calculateSEO} variant="outline" className="border-primary/30">
                  📊 Calculate SEO
                </Button>
                <Button onClick={exportHTML} variant="outline" className="border-foreground/30">
                  <Download className="h-4 w-4 mr-2" />
                  Export HTML
                </Button>
              </>
            )}
            
            {!generating && content && (
              <Button
                onClick={() => handleSave(content)}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            )}

            {/* Publish/Unpublish controls */}
            {!streaming && !generating && blog?.status === "draft" && (
              <Button
                onClick={() => updateStatus("published")}
                disabled={publishing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            )}
            {!streaming && !generating && blog?.status === "published" && (
              <Button
                onClick={() => updateStatus("draft")}
                disabled={publishing}
                variant="outline"
                className="border-destructive/50 text-destructive"
              >
                {publishing ? "Updating..." : "Unpublish"}
              </Button>
            )}

            {!generating && !streaming && (
              <Button
                onClick={startGeneration}
                className="bg-gradient-to-r from-primary via-secondary to-accent text-foreground"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {content ? "Regenerate" : "Generate"}
              </Button>
            )}
          </div>
        </div>

        {/* SEO Metrics Display */}
        {blog?.seoScore !== null && blog?.seoScore !== undefined && (
          <div className="grid grid-cols-5 gap-4">
            <div className="glass text-center p-5 rounded-xl border border-primary/30">
              <div className="text-3xl font-bold text-primary">
                {blog.seoScore}
              </div>
              <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                SEO Score
                <span title="Overall SEO quality (0–100). Good: 70–100."><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
              </div>
            </div>
            {blog.aeoScore !== null && blog.aeoScore !== undefined && (
              <div className="glass text-center p-5 rounded-xl border border-secondary/30">
                <div className="text-3xl font-bold text-secondary">
                  {blog.aeoScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  AEO Score
                  <span title="Answer Engine Optimization (0–100). Good: 70–100. Focus on FAQs and concise answers."><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
                </div>
              </div>
            )}
            {blog.geoScore !== null && blog.geoScore !== undefined && (
              <div className="glass text-center p-5 rounded-xl border border-secondary/30">
                <div className="text-3xl font-bold text-secondary">
                  {blog.geoScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  GEO Score
                  <span title="Geo/Entity Optimization (0–100). Good: 70–100. Local relevance and entities."><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
                </div>
              </div>
            )}
            {blog.eeatScore !== null && blog.eeatScore !== undefined && (
              <div className="glass text-center p-5 rounded-xl border border-primary/30">
                <div className="text-3xl font-bold text-primary">
                  {blog.eeatScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  E-E-A-T
                  <span title="Expertise, Experience, Authoritativeness, Trust (0–100). Good: 70–100."><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
                </div>
              </div>
            )}
            {blog.keywordDensity && typeof blog.keywordDensity === 'object' && Object.keys(blog.keywordDensity).length > 0 && (
              <div className="glass text-center p-5 rounded-xl border border-accent/30">
                <div className="text-3xl font-bold text-accent">
                  {((Object.values(blog.keywordDensity)[0] as number) || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  Keyword Density
                  <span title="Primary keyword usage as % of total words. Target 0.8%–2.5%."><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Magic Wand Animation */}
        <AnimatePresence>
          {showMagicWand && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className="bg-card p-8 rounded-xl border border-primary shadow-2xl">
                <Sparkles className="h-16 w-16 text-primary animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generating State */}
        {streaming && (
          <div className="bg-primary/10 border border-primary rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-primary font-medium">
                Generating your blog... Watch the magic happen!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9" ref={editorRef}>
            <TiptapEditor
              content={content}
              onChange={setContent}
              editable={!streaming}
              blogId={blogId}
              blogTitle={blog?.title}
            />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="glass border border-border rounded-xl p-4 sticky top-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">Structure</span>
                <Button variant="ghost" size="sm" onClick={()=>setShowToc(!showToc)}>{showToc?"Hide":"Show"}</Button>
              </div>
              {showToc ? <BlogToc html={content} /> : <p className="text-xs text-muted-foreground">TOC hidden</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
