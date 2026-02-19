"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, ArrowLeft, Lightbulb, ImagePlus, Target, Brain, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
  type: "chat" | "image";
  contextWindow?: number;
}

export default function EmployeeCreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  
  // Model selection state
  const [chatModels, setChatModels] = useState<ModelOption[]>([]);
  const [imageModels, setImageModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedChatModel, setSelectedChatModel] = useState("openai/gpt-4o");
  const [selectedImageModel, setSelectedImageModel] = useState("dall-e-3");
  
  const [formData, setFormData] = useState({
    title: "",
    primaryKeyword: "",
    secondaryKeywords: "",
    wordCount: "1000",
  });

  useEffect(() => {
    // Verify employee session
    const run = async () => {
      try {
        const response = await fetch("/api/employee/verify");
        if (!response.ok) {
          router.push("/employee/login");
          return;
        }
        const data = await response.json();
        setEmployeeName(data.employee?.fullName || "");
        // Check if has create_blog permission
        if (!data.permissions.includes("create_blog")) {
          toast.error("You don't have permission to create blogs");
          router.push("/employee/dashboard");
        }
      } catch (error) {
        router.push("/employee/login");
      }
    };
    void run();
    
    // Fetch available models
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/openrouter/models");
        if (response.ok) {
          const data = await response.json();
          setChatModels(data.chatModels || []);
          setImageModels(data.imageModels || []);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, [router]);

  const verifySession = async () => {
    try {
      const response = await fetch("/api/employee/verify");
      if (!response.ok) {
        router.push("/employee/login");
        return;
      }
      const data = await response.json();
      setEmployeeName(data.employee?.fullName || "");
      
      // Check if has create_blog permission
      if (!data.permissions.includes("create_blog")) {
        toast.error("You don't have permission to create blogs");
        router.push("/employee/dashboard");
      }
    } catch (error) {
      router.push("/employee/login");
    }
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.primaryKeyword) {
      toast.error("Please fill in at least the title and primary keyword");
      return;
    }

    setLoading(true);
    try {
      // Create blog entry via employee API
      const response = await fetch("/api/employee/blogs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          primaryKeyword: formData.primaryKeyword,
          secondaryKeywords: formData.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean),
          targetWordCount: parseInt(formData.wordCount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create blog");
      }

      const { blogId } = await response.json();
      
      // Navigate to employee editor with streaming
      router.push(`/employee/blogs/${blogId}/edit`);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/employee/dashboard")}
            className="text-foreground hover:text-[hsl(var(--primary))] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Create New Blog
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Let AI help you create amazing, SEO-optimized content
          </p>
          {employeeName && (
            <p className="text-[hsl(var(--muted-foreground))] mt-2">Logged in as {employeeName}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="glass border-2 border-[hsl(var(--border))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                Blog Configuration
              </CardTitle>
              <CardDescription className="text-[hsl(var(--muted-foreground))]">
                Provide details about your blog and let AI do the magic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base text-foreground">
                  Blog Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="10 Best Practices for Modern Web Development"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 bg-[hsl(var(--card))] border-[hsl(var(--border))] text-foreground placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:ring-[hsl(var(--ring))] text-lg"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryKeyword" className="text-base text-foreground">
                    Primary Keyword <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="primaryKeyword"
                    placeholder="web development"
                    value={formData.primaryKeyword}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryKeyword: e.target.value })
                    }
                    className="h-11 bg-[hsl(var(--card))] border-[hsl(var(--border))] text-foreground placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:ring-[hsl(var(--ring))]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordCount" className="text-base text-foreground">
                    Target Word Count
                  </Label>
                  <Input
                    id="wordCount"
                    type="number"
                    min="500"
                    max="5000"
                    step="100"
                    value={formData.wordCount}
                    onChange={(e) =>
                      setFormData({ ...formData, wordCount: e.target.value })
                    }
                    className="h-11 bg-[hsl(var(--card))] border-[hsl(var(--border))] text-foreground placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryKeywords" className="text-base text-foreground">
                  Secondary Keywords
                  <span className="text-sm text-[hsl(var(--muted-foreground))] ml-2">
                    (comma-separated)
                  </span>
                </Label>
                <Input
                  id="secondaryKeywords"
                  placeholder="javascript, react, best practices"
                  value={formData.secondaryKeywords}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryKeywords: e.target.value })
                  }
                  className="h-11 bg-[hsl(var(--card))] border-[hsl(var(--border))] text-foreground placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:ring-[hsl(var(--ring))]"
                />
              </div>

              {/* AI Model Selection */}
              <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg border border-primary/20 p-4 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-[hsl(var(--primary))]">
                  <Brain className="h-4 w-4" />
                  AI Model Selection
                  <span className="text-xs font-normal text-[hsl(var(--muted-foreground))] ml-2">(via OpenRouter)</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                      Blog Generation LLM
                    </Label>
                    <select
                      value={selectedChatModel}
                      onChange={(e) => setSelectedChatModel(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[hsl(var(--card))] border-2 border-[hsl(var(--border))] text-foreground text-sm focus:outline-none focus:border-[hsl(var(--ring))] cursor-pointer"
                      disabled={loadingModels}
                    >
                      {loadingModels ? (
                        <option>Loading models...</option>
                      ) : (
                        Object.entries(
                          chatModels.reduce((acc, m) => {
                            if (!acc[m.providerLabel]) acc[m.providerLabel] = [];
                            acc[m.providerLabel].push(m);
                            return acc;
                          }, {} as Record<string, ModelOption[]>)
                        ).map(([provider, models]) => (
                          <optgroup key={provider} label={provider}>
                            {models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}{m.contextWindow ? ` (${Math.round(m.contextWindow / 1000)}k ctx)` : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-orange-500" />
                      Image Generation Model
                    </Label>
                    <select
                      value={selectedImageModel}
                      onChange={(e) => setSelectedImageModel(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[hsl(var(--card))] border-2 border-[hsl(var(--border))] text-foreground text-sm focus:outline-none focus:border-[hsl(var(--ring))] cursor-pointer"
                      disabled={loadingModels}
                    >
                      {loadingModels ? (
                        <option>Loading models...</option>
                      ) : (
                        Object.entries(
                          imageModels.reduce((acc, m) => {
                            if (!acc[m.providerLabel]) acc[m.providerLabel] = [];
                            acc[m.providerLabel].push(m);
                            return acc;
                          }, {} as Record<string, ModelOption[]>)
                        ).map(([provider, models]) => (
                          <optgroup key={provider} label={provider}>
                            {models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !formData.title || !formData.primaryKeyword}
                  size="lg"
                  className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-[#00FA9A] via-[#00B2FF] to-[#1E90FF] text-white hover:from-[#00FA9A]/90 hover:to-[#1E90FF]/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Generate Blog with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass p-5 rounded-xl border-2 border-[hsl(var(--primary))]/20"
          >
            <Lightbulb className="h-6 w-6 text-[hsl(var(--primary))] mb-2" />
            <h3 className="font-semibold text-[hsl(var(--primary))] mb-1">
              Best Practices
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Watch your blog being written in real-time with smooth animations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass p-5 rounded-xl border-2 border-[hsl(var(--secondary))]/20"
          >
            <ImagePlus className="h-6 w-6 text-[hsl(var(--secondary))] mb-2" />
            <h3 className="font-semibold text-[hsl(var(--secondary))] mb-1">
              Auto Images
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              AI will automatically generate and place relevant images
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass p-5 rounded-xl border-2 border-[hsl(var(--accent))]/20"
          >
            <Target className="h-6 w-6 text-[hsl(var(--accent))] mb-2" />
            <h3 className="font-semibold text-[hsl(var(--accent))] mb-1">
              SEO Optimized
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Get comprehensive SEO metrics and optimization suggestions
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
