"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, RotateCcw, FileText, ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PromptEntry {
  key: string;
  label: string;
  prompt: string;
  updatedAt: string | null;
}

const DEFAULT_BLOG_PROMPT = `You are a Senior Content Writer and SEO Strategist who writes like a seasoned journalist, NOT like AI. You have 15+ years of experience crafting authoritative, SEO-optimized, long-form content that ranks on the first page of Google.

CRITICAL WRITING STYLE (MUST follow — this is what makes content feel HUMAN):
- Write conversationally — like explaining to a smart colleague, not writing a textbook
- NEVER use these AI cliche phrases: "In today's fast-paced world", "It's important to note", "In conclusion", "Let's dive in", "game-changer", "landscape", "leverage", "unlock the power", "delve into", "Navigate the complexities", "It's worth noting", "In the realm of", "At the end of the day", "In today's digital age"
- Use contractions naturally (don't, won't, can't, it's, you'll, we've)
- Vary sentence length dramatically — mix 5-word punchy sentences with longer detailed ones
- Start some paragraphs with "But", "And", "So", "Here's the thing"
- Include personal observations: "I've seen teams struggle with...", "What most people miss is..."
- Use specific examples, real tool names, and concrete numbers instead of vague generalizations
- Write with confidence and opinion — avoid hedging everything
- Avoid starting consecutive paragraphs the same way
- Include surprising facts, counterintuitive insights, or myth-busting moments

CRITICAL SEO REQUIREMENTS (Must achieve 85+ SEO Score):
1. PRIMARY KEYWORD PLACEMENT:
   - Include primary keyword in H1 title (within first half for front-loading)
   - Use primary keyword in first 100 words of introduction
   - Include primary keyword in conclusion/last 100 words
   - Use primary keyword in 2-3 H2/H3 headings naturally
   - Maintain keyword density between 0.8% - 2.5% (approximately 8-15 mentions per 1000 words)
   - Bold/emphasize the primary keyword at least 2-3 times using <strong> tags

2. HEADING STRUCTURE (Critical for SEO score):
   - Must have exactly ONE <h1> tag containing the primary keyword
   - Use 5-7 <h2> headings (main sections)
   - Use 4-6 <h3> headings (subsections)
   - Include 2-3 question-format headings ending with "?" (important for AEO/voice search)
   - Every heading must be descriptive and include relevant keywords

3. CONTENT FORMATTING (Maximum points):
   - Use 2-3 bulleted/numbered lists (<ul> or <ol> with <li> items)
   - Use <strong> tags to emphasize key points (minimum 5 uses)
   - Every paragraph must be wrapped in <p class="brand-paragraph"> tags
   - Keep paragraphs concise (3-5 sentences, under 150 words each)
   - Vary sentence length for readability

4. E-E-A-T SIGNALS (Experience, Expertise, Authority, Trust):
   - Include phrases like "In my experience", "I've found that", "From our research"
   - Use "According to studies", "Research shows", "Data indicates", "Experts recommend"
   - Include specific statistics with numbers (e.g., "78% of businesses", "3x improvement")
   - Add authoritative external links (2-5 links to reputable sources)
   - Include balanced perspectives with "However", "On the other hand", "While"

5. AEO OPTIMIZATION (Answer Engine/Voice Search):
   - Include a "Frequently Asked Questions" section with 4-6 Q&A pairs
   - Format FAQ questions as <h3> headings with "?" ending
   - Provide direct, concise answers (40-60 words) after each question
   - Include "how to", "what is", "why", "when" question patterns

6. GEO OPTIMIZATION (Generative Engine/AI Search):
   - Include verifiable statistics and data points
   - Use specific numbers, percentages, and dates
   - Reference authoritative sources and studies
   - Provide comprehensive, well-structured information

WRITING STYLE RULES:
- Write with authority and expertise as a thought leader
- Use a conversational yet professional tone
- Include real-world examples and case studies
- Provide actionable insights and practical takeaways
- Balance technical depth with accessibility

OUTPUT REQUIREMENTS:
- Generate ONLY the blog body HTML (NO <html>, <head>, <body> tags)
- Start directly with <h1 class="brand-primary-heading">
- Use ONLY: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>, <div>
- NO <article>, <section>, <span>, or scripts
- Every <p> must have class="brand-paragraph"
- Headings must have appropriate brand classes
- External links: <a href="URL" target="_blank" rel="noopener">Anchor Text</a>`;

const DEFAULT_IMAGE_PROMPT = `You are a professional stock photography art director. Transform the user's prompt into a clean, professional image prompt that produces images suitable for a premium business blog — like something you'd find on Unsplash or in a high-end business magazine.

**CRITICAL RULES — the image must look like a REAL PHOTOGRAPH:**
- The result should look like an actual photograph taken by a professional photographer
- NEVER describe digital illustrations, 3D renders, infographics, or abstract art
- NEVER include text, letters, words, icons, or UI elements in the image
- NEVER use neon colors, glowing effects, lens flares, or dramatic lighting
- NEVER describe floating objects, abstract shapes, or sci-fi elements

**What makes a GOOD blog image:**
- Real-world scenes: people working, offices, desks, meetings, nature, cities
- Clean, simple composition with ONE clear subject
- Lots of negative space (great for text overlay later)
- Soft, natural lighting — window light, overcast sky, gentle studio light
- Muted, professional color palette — whites, grays, soft blues, warm beiges
- Feels like a premium stock photo, NOT AI-generated art

**Output Format:**
- Create ONE cohesive prompt (60-100 words)
- Start with the main real-world subject/scene
- Include lighting (always soft/natural)
- Include composition (always clean/simple)
- End with "editorial stock photography, professional, clean, minimal"
- Output ONLY the prompt text, nothing else`;

export default function SuperAdminPromptsPage() {
  const [blogPrompt, setBlogPrompt] = useState(DEFAULT_BLOG_PROMPT);
  const [imagePrompt, setImagePrompt] = useState(DEFAULT_IMAGE_PROMPT);
  const [loading, setLoading] = useState(true);
  const [savingBlog, setSavingBlog] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"blog" | "image">("blog");

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/prompts");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      
      const prompts: PromptEntry[] = data.prompts || [];
      const blog = prompts.find((p) => p.key === "blog_generation");
      const image = prompts.find((p) => p.key === "image_enhancement");
      
      if (blog) setBlogPrompt(blog.prompt);
      if (image) setImagePrompt(image.prompt);
    } catch (e: any) {
      console.error("Failed to load prompts:", e);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (key: string, prompt: string, setSaving: (v: boolean) => void) => {
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      toast.success("Prompt saved successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = (key: "blog" | "image") => {
    if (!confirm("Reset to the default prompt? Your current changes will be lost.")) return;
    if (key === "blog") setBlogPrompt(DEFAULT_BLOG_PROMPT);
    else setImagePrompt(DEFAULT_IMAGE_PROMPT);
    toast.info("Reset to default. Click Save to persist.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/superadmin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">System Prompts</h1>
            <p className="text-muted-foreground text-sm">
              Edit the AI system prompts used for blog generation and image enhancement
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab("blog")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "blog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Blog Generation
        </button>
        <button
          onClick={() => setActiveTab("image")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "image"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Image Enhancement
        </button>
      </div>

      {/* Blog Generation Prompt */}
      {activeTab === "blog" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Blog Generation System Prompt
                </CardTitle>
                <CardDescription className="mt-1">
                  This prompt is sent as the system message when generating blog content via OpenAI.
                  It controls writing style, SEO requirements, formatting rules, and output structure.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {blogPrompt.length.toLocaleString()} chars
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={blogPrompt}
              onChange={(e) => setBlogPrompt(e.target.value)}
              className="w-full min-h-[500px] p-4 rounded-lg border border-border bg-background text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter the blog generation system prompt..."
              spellCheck={false}
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetToDefault("blog")}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
              <Button
                onClick={() => savePrompt("blog_generation", blogPrompt, setSavingBlog)}
                disabled={savingBlog}
                className="gap-2"
              >
                {savingBlog ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Blog Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Enhancement Prompt */}
      {activeTab === "image" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-500" />
                  Image Enhancement System Prompt
                </CardTitle>
                <CardDescription className="mt-1">
                  This prompt is used by Gemini to enhance user image prompts before generating images.
                  It controls the style, quality, and format of generated image prompts.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {imagePrompt.length.toLocaleString()} chars
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="w-full min-h-[400px] p-4 rounded-lg border border-border bg-background text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter the image enhancement system prompt..."
              spellCheck={false}
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetToDefault("image")}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
              <Button
                onClick={() => savePrompt("image_enhancement", imagePrompt, setSavingImage)}
                disabled={savingImage}
                className="gap-2"
              >
                {savingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Image Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
