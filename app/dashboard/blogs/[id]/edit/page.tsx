"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
// Lazy load heavy editor to reduce route payload and speed up navigation
const TiptapEditor = dynamic(() => import("@/components/tiptap-editor").then(m => ({ default: m.TiptapEditor })), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
      Loading editor...
    </div>
  ),
});
import { BlogToc } from "@/components/blog-toc";
import { ImagePromptModal } from "@/components/image-prompt-modal";
import { ProfessionalImageEditor } from "@/components/professional-image-editor";
import { ArrowLeft, Save, Eye, Download, BarChart3, Sparkles, Loader2, List, Info, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;
  const blogId: string | null = idParam ? String(idParam) : null;

  const [blog, setBlog] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState(""); // kept for saving API compatibility
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculatingSEO, setCalculatingSEO] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [showImagePromptModal, setShowImagePromptModal] = useState(false);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [featuredImageEditSrc, setFeaturedImageEditSrc] = useState<string | null>(null);
  const showMagicWandRef = useRef(false);
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
      const response = await fetch(`/api/blogs/${blogId}`);
      if (!response.ok) throw new Error("Failed to fetch blog");
      const data = await response.json();
      setBlog(data);
      setTitle(data.title || "");
      setMetaDescription(data.metaDescription || "");
      const newContent = data.htmlContent || data.content || "";
      setContent(newContent);
      
      // Extract featured image if present
      const featuredImgMatch = newContent.match(/<div class="featured-image-wrapper"[^>]*><img src="([^"]+)"/i);
      if (featuredImgMatch) {
        setFeaturedImageUrl(featuredImgMatch[1]);
      }
      
      if (autoGenerate && !data.content && !data.htmlContent) {
        setTimeout(() => startGenerationWithBlog(data), 100);
      }
    } catch (error) {
      console.error("Fetch blog error:", error);
      toast.error("Failed to load blog");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const startGenerationWithBlog = async (blogData: any) => {
    setGenerating(true);
    setStreaming(true);
    setContent("");
    streamCompletedRef.current = false;
    let accumulated = "";
    let flushTimer: number | null = null;
    const FLUSH_INTERVAL = 160; // ms cadence to reduce flicker
    const flush = () => {
      try {
        const formatted = formatStreaming(accumulated);
        setContent(formatted);
      } catch {}
    };
    const scheduleFlush = () => {
      if (flushTimer !== null) return;
      flushTimer = window.setTimeout(() => {
        flush();
        flushTimer = null;
      }, FLUSH_INTERVAL);
    };
    const formatStreaming = (raw: string) => {
      // Lightweight formatter: ensure paragraphs wrapped and heading classes injected progressively
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
      // Promote headings heuristically
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
    try {
      const response = await fetch("/api/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: blogData.id,
          title: blogData.title,
          primaryKeyword: blogData.primaryKeyword,
          secondaryKeywords: blogData.secondaryKeywords,
          targetWordCount: blogData.targetWordCount,
          companyProfile: blogData.companyProfile || null,
        }),
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.done) {
              if (streamCompletedRef.current) continue;
              streamCompletedRef.current = true;
              setStreaming(false);
              setGenerating(false);
              if (flushTimer !== null) {
                window.clearTimeout(flushTimer);
                flushTimer = null;
              }
              // One final flush to ensure latest content is rendered
              flush();
              // Final refresh to pull persisted version (already formatted server-side)
              await fetchBlog(false);
              toast.success('Blog generated successfully!');
            } else if (payload.content) {
              accumulated += payload.content;
              // Schedule a throttled flush to reduce re-render frequency
              scheduleFlush();
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate blog");
      setStreaming(false);
      setGenerating(false);
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer);
        flushTimer = null;
      }
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
        const response = await fetch(`/api/blogs/${blogId}/generate-images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: blogContent }),
        });
        if (!response.ok) throw new Error("Failed to generate images");
        const data = await response.json();
        if (data.images?.length > 0) {
          toast.success(`Generated ${data.images.length} images!`);
          await fetchBlog(false);
        } else {
          toast.info("No image placeholders found in content");
        }
      } catch (error) {
        console.error("Image generation error:", error);
        toast.error("Failed to generate images");
      }
    };
    void generateImages;

    const saveBlog = async () => {
      if (!blogId) return;
      setSaving(true);
      try {
        const response = await fetch(`/api/blogs/${blogId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, metaDescription, content, htmlContent: content }),
        });
        if (!response.ok) throw new Error("Failed to save blog");
        toast.success("Blog saved successfully!");
      } catch (error) {
        console.error("Save error:", error);
        toast.error("Failed to save blog");
      } finally {
        setSaving(false);
      }
    };

  const handleGenerateFeaturedImage = async (prompt: string) => {
    if (!blogId) return;
    setGeneratingImage(true);
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, blogId }),
      });
      if (!response.ok) throw new Error("Image generation failed");
      const data = await response.json();
      const imageUrl = data.imageUrl || data.url;
      
      if (imageUrl) {
        setFeaturedImageUrl(imageUrl);
        const featuredImgHtml = `<div class="featured-image-wrapper" style="margin: 2rem 0;"><img src="${imageUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px;" /></div>`;
        let updatedContent = content.replace(/<div class="featured-image-wrapper"[^>]*>.*?<\/div>/i, '');
        setContent(featuredImgHtml + updatedContent);
        toast.success("Featured image generated!");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate image");
    } finally {
      setGeneratingImage(false);
      setShowImagePromptModal(false);
    }
  };

  const handleSaveFeaturedImage = async (editedImageUrl: string) => {
    setFeaturedImageUrl(editedImageUrl);
    const featuredImgHtml = `<div class="featured-image-wrapper" style="margin: 2rem 0;"><img src="${editedImageUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px;" /></div>`;
    let updatedContent = content.replace(/<div class="featured-image-wrapper"[^>]*>.*?<\/div>/i, '');
    setContent(featuredImgHtml + updatedContent);
    setShowImageEditorModal(false);
    toast.success("Featured image updated!");
    
    // Trigger auto-save after featured image update
    setTimeout(() => {
      saveBlog();
    }, 500);
  };

  const handleEditFeaturedImage = () => {
    if (!featuredImageUrl) return;
    const storageBase = (process.env.NEXT_PUBLIC_IMAGE_STORAGE_BASE || '').replace(/\/$/, '');
    const isAbs = /^https?:\/\//i.test(featuredImageUrl);
    const isStorage = storageBase && isAbs && featuredImageUrl.startsWith(storageBase);
    // Proxy storage images for editing to avoid CORS canvas taint if bucket lacks CORS headers
    const editingSrc = isStorage ? `/api/images/proxy?url=${encodeURIComponent(featuredImageUrl)}` : featuredImageUrl;
    setFeaturedImageEditSrc(editingSrc);
    setShowImageEditorModal(true);
  };

    const calculateSEO = async () => {
      if (!blogId) return;
      setCalculatingSEO(true);
      try {
        const response = await fetch(`/api/blogs/${blogId}/calculate-seo`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to calculate SEO");
        await response.json();
        toast.success("SEO metrics calculated successfully!");
        await fetchBlog(false);
      } catch (error) {
        console.error("SEO calculation error:", error);
        toast.error("Failed to calculate SEO metrics");
      } finally {
        setCalculatingSEO(false);
      }
    };

    const exportHTML = () => {
      const htmlContent = content || blog?.htmlContent || "";
      if (!htmlContent) {
        toast.error("No content to export");
        return;
      }
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || blog?.title || "blog"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("HTML exported successfully!");
    };

    void editorRef.current;

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading blog...</p>
          </div>
        </div>
      );
    }

    if (!blog) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">Blog not found</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/blogs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blogs
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-6 px-2 max-w-[1800px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/blogs">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Blog</h1>
              <p className="text-muted-foreground">Make changes to your blog post</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportHTML} disabled={!content || generating}>
              <Download className="h-4 w-4 mr-2" />
              Export HTML
            </Button>
            <Button variant="outline" onClick={calculateSEO} disabled={!content || calculatingSEO || generating}>
              {calculatingSEO ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Calculate SEO
                </>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/blogs/${blog.id}/preview`} prefetch={true}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button onClick={saveBlog} disabled={saving || generating}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* SEO Metrics Display (parity with employee UI) */}
        {blog?.seoScore !== null && blog?.seoScore !== undefined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 px-2">
            <div className="text-center p-5 rounded-xl border bg-card">
              <div className="text-3xl font-bold text-[hsl(var(--primary))]">{blog.seoScore}</div>
              <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                SEO Score
                <span title="Overall SEO quality (0–100). Good: 70–100."><Info className="h-3.5 w-3.5" /></span>
              </div>
            </div>
            {blog.aeoScore !== null && blog.aeoScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-[hsl(var(--secondary))]">{blog.aeoScore}</div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  AEO Score
                  <span title="Answer Engine Optimization (0–100). Good: 70–100. Focus on FAQs and concise answers."><Info className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            )}
            {blog.geoScore !== null && blog.geoScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-[hsl(var(--secondary))]">{blog.geoScore}</div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  GEO Score
                  <span title="Geo/Entity Optimization (0–100). Good: 70–100. Local relevance and entities."><Info className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            )}
            {blog.eeatScore !== null && blog.eeatScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-[hsl(var(--primary))]">{blog.eeatScore}</div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  E-E-A-T
                  <span title="Expertise, Experience, Authoritativeness, Trust (0–100). Good: 70–100."><Info className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            )}
            {blog.keywordDensity && typeof blog.keywordDensity === 'object' && Object.keys(blog.keywordDensity).length > 0 && (
              <div className="text-center p-5 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-[#A3E635]">
                  {((Object.values(blog.keywordDensity)[0] as number) || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  Keyword Density
                  <span title="Primary keyword usage as % of total words. Target 0.8%–2.5%."><Info className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Magic wand overlay removed per request */}

        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TOC Panel - Left Side */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-3">
                <div className="flex items-center gap-2"><List className="h-4 w-4" /><span className="font-semibold">Structure</span></div>
                <Button variant="ghost" size="sm" onClick={()=>setShowToc(!showToc)}>{showToc?"Hide":"Show"}</Button>
              </CardHeader>
              <CardContent className="pt-0 px-2">
                {/* Table of Contents */}
                {showToc ? <BlogToc html={content} /> : <p className="text-xs text-muted-foreground">TOC hidden</p>}
              </CardContent>
            </Card>
          </div>
          
          {/* Editor + Controls - Right Side */}
          <Card className="lg:col-span-9">
          <CardHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog title..."
                  disabled={generating}
                  className="text-xl font-semibold"
                />
              </div>
              {/* Meta Description field hidden per request; value still kept in state for save */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Content</label>
                {streaming && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </Badge>
                )}
              </div>
              <TiptapEditor content={content} onChange={setContent} editable={!generating} blogId={blog.id} onAutoSave={saveBlog} />
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        {!content && (
          <Button onClick={startGeneration} size="lg" className="w-full mt-6" disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
        )}
        {content && (
          <Button onClick={startGeneration} variant="outline" size="lg" className="w-full mt-6" disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            Regenerate Content
          </Button>
        )}
        
        {/* Image Modals */}
        {showImagePromptModal && (
          <ImagePromptModal
            onClose={() => setShowImagePromptModal(false)}
            onSubmit={handleGenerateFeaturedImage}
            isGenerating={generatingImage}
          />
        )}
        {showImageEditorModal && featuredImageEditSrc && featuredImageUrl && (
          <ProfessionalImageEditor
            imageSrc={featuredImageEditSrc}
            originalImageUrl={featuredImageUrl}
            blogId={blogId || ""}
            onClose={() => {
              setShowImageEditorModal(false);
              setFeaturedImageEditSrc(null);
            }}
            onSave={handleSaveFeaturedImage}
          />
        )}
      </div>
    );
  }
 
