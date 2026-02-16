"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Newspaper, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  Tag, 
  ExternalLink,
  TrendingUp,
  Loader2,
  AlertCircle,
  PenSquare
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  keywords: string[];
  relevance: string;
  publishedDate: string;
  source: string;
}

const categoryColors: Record<string, string> = {
  "Industry Trends": "bg-blue-100 text-blue-700 border-blue-200",
  "Market Analysis": "bg-green-100 text-green-700 border-green-200",
  "Technology": "bg-purple-100 text-purple-700 border-purple-200",
  "Best Practices": "bg-orange-100 text-orange-700 border-orange-200",
  "Case Study": "bg-pink-100 text-pink-700 border-pink-200",
  "How-To Guide": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Opinion": "bg-red-100 text-red-700 border-red-200",
  "Research": "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function ResearchPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/research/news");
      if (!response.ok) throw new Error("Failed to fetch news");
      
      const data = await response.json();
      setNews(data.news || []);
      setCompanyName(data.companyName || "Your Company");
      
      if (isRefresh) {
        toast.success("News refreshed with latest trends!");
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load news. Please try again.");
      toast.error("Failed to fetch news");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateBlog = (newsItem: NewsItem) => {
    // Navigate to create page with pre-filled data
    const params = new URLSearchParams({
      title: newsItem.title,
      primaryKeyword: newsItem.keywords[0] || "",
      secondaryKeywords: newsItem.keywords.slice(1).join(", "),
    });
    router.push(`/dashboard/create?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">Researching latest trends for your company...</p>
        <p className="text-sm text-muted-foreground">This may take a few seconds</p>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground text-lg">{error}</p>
        <Button onClick={() => fetchNews()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-primary" />
            Research & Trends
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-curated news and topics relevant to <span className="font-medium text-primary">{companyName}</span>
          </p>
        </div>
        <Button 
          onClick={() => fetchNews(true)} 
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? "Refreshing..." : "Refresh News"}
        </Button>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3"
      >
        <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-medium">Pro Tip:</span> Click on any news item to instantly create a blog post with pre-filled title and keywords.
        </p>
      </motion.div>

      {/* News Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 group">
              <CardContent className="p-5 flex flex-col h-full">
                {/* Category & Source */}
                <div className="flex items-center justify-between mb-3">
                  <Badge 
                    variant="outline" 
                    className={`${categoryColors[item.category] || 'bg-gray-100 text-gray-700'} font-medium`}
                  >
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.publishedDate}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3 flex-grow">
                  {item.summary}
                </p>

                {/* Relevance */}
                <div className="bg-muted/50 rounded-lg p-2.5 mb-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Why it matters:</span> {item.relevance}
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.keywords.map((keyword, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs text-muted-foreground"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {keyword}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {item.source}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleCreateBlog(item)}
                    className="gap-1.5 h-8"
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                    Create Blog
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {news.length === 0 && !loading && (
        <div className="text-center py-12">
          <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No news available</h3>
          <p className="text-muted-foreground mb-4">
            We couldn&apos;t find any relevant news at the moment.
          </p>
          <Button onClick={() => fetchNews(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
