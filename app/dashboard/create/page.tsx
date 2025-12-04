"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyProfile {
  id: number;
  companyName: string;
  companyWebsite: string | null;
}

export default function CreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [blogId, setBlogId] = useState<number | null>(null);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    primaryKeyword: "",
    secondaryKeywords: "",
    wordCount: "1000",
    companyProfileId: "self" as string | "self",
  });

  useEffect(() => {
    fetchCompanyProfiles();
  }, []);

  const fetchCompanyProfiles = async () => {
    try {
      const response = await fetch("/api/company-profiles/list");
      if (response.ok) {
        const profiles = await response.json();
        setCompanyProfiles(profiles);
      }
    } catch (error) {
      console.error("Failed to fetch company profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.primaryKeyword) {
      toast.error("Please fill in at least the title and primary keyword");
      return;
    }

    setLoading(true);
    try {
      // Create blog entry
      const response = await fetch("/api/blogs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          primaryKeyword: formData.primaryKeyword,
          secondaryKeywords: formData.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean),
          targetWordCount: parseInt(formData.wordCount),
          companyProfileId: formData.companyProfileId === "self" ? null : parseInt(formData.companyProfileId),
        }),
      });

      if (!response.ok) throw new Error("Failed to create blog");

      const { blogId: newBlogId } = await response.json();
      setBlogId(newBlogId);
      setGenerating(true);
      // Route to Outline step with context in query params
      const params = new URLSearchParams({
        title: formData.title,
        primary: formData.primaryKeyword,
        secondary: formData.secondaryKeywords,
        wordCount: formData.wordCount,
        companyProfileId: String(formData.companyProfileId || "self"),
      });
      router.push(`/dashboard/create/outline/${newBlogId}?${params.toString()}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-primary">
          Create New Blog
        </h1>
        <p className="text-muted-foreground">
          Let AI help you create amazing, SEO-optimized content
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Blog Configuration
            </CardTitle>
            <CardDescription>
              Provide details about your blog and let AI do the magic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Profile Selection */}
            <div className="space-y-2">
              <Label className="text-base text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Company Profile
              </Label>
              <select
                value={formData.companyProfileId}
                onChange={(e) => setFormData({ ...formData, companyProfileId: e.target.value })}
                className="w-full h-12 px-4 rounded-lg bg-white border-2 border-border text-foreground focus:outline-none focus:border-primary cursor-pointer"
                disabled={loadingProfiles}
              >
                <option value="self">Self (Your Company)</option>
                {companyProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id.toString()}>
                    {profile.companyName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {formData.companyProfileId === "self" 
                  ? "Creating blog for your own company" 
                  : "Creating blog for a client company"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base text-foreground">
                Blog Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="10 Best Practices for Modern Web Development"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary text-lg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryKeyword" className="text-base text-foreground">
                  Primary Keyword <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primaryKeyword"
                  placeholder="web development"
                  value={formData.primaryKeyword}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryKeyword: e.target.value })
                  }
                  className="h-11 bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
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
                  className="h-11 bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryKeywords" className="text-base text-foreground">
                Secondary Keywords
                <span className="text-sm text-muted-foreground ml-2">
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
                className="h-11 bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleGenerate}
                disabled={loading || !formData.title || !formData.primaryKeyword}
                size="lg"
                className="w-full h-12 text-lg gap-2"
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
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-primary mb-1">
            AI Generation
          </h3>
          <p className="text-sm text-muted-foreground">
            Watch your blog being written in real-time with smooth animations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-orange-500 mb-1">
            Auto Images
          </h3>
          <p className="text-sm text-muted-foreground">
            AI will automatically generate and place relevant images
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-primary mb-1">
            SEO Optimized
          </h3>
          <p className="text-sm text-muted-foreground">
            Get comprehensive SEO metrics and optimization suggestions
          </p>
        </motion.div>
      </div>
    </div>
  );
}
