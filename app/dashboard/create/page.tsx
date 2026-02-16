"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, Building2, Search, TrendingUp, HelpCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyProfile {
  id: number;
  companyName: string;
  companyWebsite: string | null;
}

function CreateBlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [blogId, setBlogId] = useState<number | null>(null);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  
  // Keyword research state
  const [keywordResearch, setKeywordResearch] = useState<any>(null);
  const [researchingKeywords, setResearchingKeywords] = useState(false);
  const [showKeywordResults, setShowKeywordResults] = useState(false);
  const [keywordSearchInput, setKeywordSearchInput] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    primaryKeyword: "",
    secondaryKeywords: "",
    wordCount: "1000",
    companyProfileId: "self" as string | "self",
  });

  // Auto-fill from URL params (from Research page)
  useEffect(() => {
    const title = searchParams.get("title");
    const primaryKeyword = searchParams.get("primaryKeyword");
    const secondaryKeywords = searchParams.get("secondaryKeywords");
    
    if (title || primaryKeyword || secondaryKeywords) {
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        primaryKeyword: primaryKeyword || prev.primaryKeyword,
        secondaryKeywords: secondaryKeywords || prev.secondaryKeywords,
      }));
    }
  }, [searchParams]);

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

  const handleKeywordResearch = async () => {
    const searchTerm = keywordSearchInput || formData.primaryKeyword;
    if (!searchTerm) {
      toast.error("Enter a keyword to research");
      return;
    }

    setResearchingKeywords(true);
    try {
      const response = await fetch("/api/research/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedKeyword: searchTerm,
          companyName: formData.companyProfileId === "self" ? undefined : companyProfiles.find(p => p.id.toString() === formData.companyProfileId)?.companyName,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch keyword research");
      
      const data = await response.json();
      setKeywordResearch(data);
      setShowKeywordResults(true);
      toast.success("Keyword research complete!");
    } catch (error) {
      console.error("Keyword research error:", error);
      toast.error("Failed to get keyword suggestions");
    } finally {
      setResearchingKeywords(false);
    }
  };

  const applyKeywordSuggestion = (keyword: string, asSecondary = false) => {
    if (asSecondary) {
      const current = formData.secondaryKeywords;
      const updated = current ? `${current}, ${keyword}` : keyword;
      setFormData({ ...formData, secondaryKeywords: updated });
      toast.success(`Added "${keyword}" as secondary keyword`);
    } else {
      setFormData({ ...formData, primaryKeyword: keyword });
      toast.success(`Set "${keyword}" as primary keyword`);
    }
  };

  const applyContentIdea = (idea: any) => {
    setFormData({
      ...formData,
      title: idea.title,
      primaryKeyword: idea.primaryKeyword,
      secondaryKeywords: idea.secondaryKeywords?.join(", ") || "",
    });
    toast.success("Content idea applied!");
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

            {/* Keyword Research Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Keyword Research
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeywordResults(!showKeywordResults)}
                  className="text-xs"
                  disabled={!keywordResearch}
                >
                  {showKeywordResults ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {keywordResearch ? (showKeywordResults ? "Hide" : "Show") + " Results" : "No Results"}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a topic or keyword to research..."
                  value={keywordSearchInput}
                  onChange={(e) => setKeywordSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleKeywordResearch()}
                  className="h-10 bg-white border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
                <Button
                  type="button"
                  onClick={handleKeywordResearch}
                  disabled={researchingKeywords}
                  variant="secondary"
                  className="gap-1.5 whitespace-nowrap"
                >
                  {researchingKeywords ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Researching...</>
                  ) : (
                    <><TrendingUp className="h-4 w-4" /> Research</>
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {showKeywordResults && keywordResearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Primary Keyword Analysis */}
                    {keywordResearch.primaryKeyword && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          Primary Keyword Analysis
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="bg-white">
                            Volume: {keywordResearch.primaryKeyword.searchVolume}
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            Difficulty: {keywordResearch.primaryKeyword.difficulty}
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            CPC: {keywordResearch.primaryKeyword.cpc}
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            Intent: {keywordResearch.primaryKeyword.intent}
                          </Badge>
                          <Badge variant="outline" className={
                            keywordResearch.primaryKeyword.trend === "Rising" ? "bg-green-50 text-green-700 border-green-200" :
                            keywordResearch.primaryKeyword.trend === "Declining" ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-white"
                          }>
                            {keywordResearch.primaryKeyword.trend === "Rising" ? "📈" : keywordResearch.primaryKeyword.trend === "Declining" ? "📉" : "➡️"} {keywordResearch.primaryKeyword.trend}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Related Keywords */}
                    {keywordResearch.relatedKeywords?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Related Keywords</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1.5">
                          {keywordResearch.relatedKeywords.map((kw: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2 text-sm hover:border-primary/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{kw.keyword}</span>
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {kw.searchVolume}
                                </Badge>
                                <Badge variant="outline" className={`text-[10px] h-5 ${
                                  kw.trend === "Rising" ? "text-green-600" : ""
                                }`}>
                                  {kw.trend === "Rising" ? "↑" : kw.trend === "Declining" ? "↓" : "→"} {kw.difficulty}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => applyKeywordSuggestion(kw.keyword, false)}
                                >
                                  Primary
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => applyKeywordSuggestion(kw.keyword, true)}
                                >
                                  + Secondary
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* People Also Ask */}
                    {keywordResearch.topQuestions?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5" />
                          People Also Ask
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {keywordResearch.topQuestions.map((q: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                              onClick={() => setFormData({ ...formData, title: q.replace(/\?$/, '') })}
                            >
                              {q}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Ideas */}
                    {keywordResearch.contentIdeas?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                          Blog Ideas (Click to use)
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {keywordResearch.contentIdeas.map((idea: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => applyContentIdea(idea)}
                              className="flex items-center justify-between bg-white border rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            >
                              <div>
                                <span className="font-medium">{idea.title}</span>
                                <div className="flex gap-1 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] h-4">
                                    {idea.contentType}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] h-4">
                                    Traffic: {idea.estimatedTraffic}
                                  </Badge>
                                </div>
                              </div>
                              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending Topics */}
                    {keywordResearch.trendingTopics?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                          Trending Right Now
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {keywordResearch.trendingTopics.map((topic: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                            >
                              🔥 {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-primary mb-1">
            🔍 Keyword Research
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered keyword suggestions with volume & difficulty estimates
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-primary mb-1">
            ✨ AI Generation
          </h3>
          <p className="text-sm text-muted-foreground">
            Natural, human-like content with facts, key takeaways & trending data
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-orange-500 mb-1">
            🖼️ Auto Images
          </h3>
          <p className="text-sm text-muted-foreground">
            AI generates and places relevant images throughout your blog
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-white p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-primary mb-1">
            📊 SEO Optimized
          </h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive SEO scoring with E-E-A-T and AEO optimization
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function CreateBlogPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CreateBlogContent />
    </Suspense>
  );
}
