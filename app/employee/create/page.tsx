"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, ArrowLeft, Lightbulb, ImagePlus, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function EmployeeCreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  
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
