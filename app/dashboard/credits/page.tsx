"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  TrendingUp, 
  FileText, 
  Image as ImageIcon, 
  Wand2, 
  ArrowLeft,
  Calendar,
  BarChart3,
  Loader2,
  Info,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Transaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  metadata: {
    blogId?: number;
    blogTitle?: string;
    imageId?: number;
    imagePrompt?: string;
    adminNote?: string;
  } | null;
  createdAt: string;
}

interface UsageStat {
  type: string;
  totalAmount: number;
  count: number;
}

interface DailyUsage {
  date: string;
  totalUsed: number;
}

interface CreditsData {
  credits: number;
  totalCreditsUsed: number;
  userName: string;
  companyName: string;
  transactions: Transaction[];
  usageStats: UsageStat[];
  dailyUsage: DailyUsage[];
  creditCosts: {
    BLOG_GENERATION: number;
    IMAGE_GENERATION: number;
    IMAGE_EDIT: number;
  };
}

const typeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  blog_generation: { 
    label: "Blog Generation", 
    icon: FileText, 
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  image_generation: { 
    label: "Image Generation", 
    icon: ImageIcon, 
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  image_edit: { 
    label: "AI Image Edit", 
    icon: Wand2, 
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  admin_add: { 
    label: "Credits Added", 
    icon: Coins, 
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  admin_deduct: { 
    label: "Credits Deducted", 
    icon: Coins, 
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
};

export default function CreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/credits");
      if (response.ok) {
        const creditsData = await response.json();
        setData(creditsData);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Calculate max for graph scaling
  const maxDailyUsage = data?.dailyUsage?.length 
    ? Math.max(...data.dailyUsage.map(d => d.totalUsed), 1) 
    : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Failed to load credits data</p>
        <Button onClick={fetchCredits}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Coins className="h-8 w-8 text-primary" />
              Credit Usage
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your credit consumption and usage history
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchCredits} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Credits</p>
                  <p className="text-4xl font-bold text-primary">{data.credits.toFixed(1)}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Coins className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Used</p>
                  <p className="text-4xl font-bold text-foreground">{data.totalCreditsUsed.toFixed(1)}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-4xl font-bold text-foreground">{data.transactions.length}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Credit Costs Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              Credit Rates
            </CardTitle>
            <CardDescription>How credits are consumed for each action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400">Blog Generation <span className="font-normal text-sm">(text only)</span></p>
                  <p className="text-2xl font-bold text-blue-600">{data.creditCosts.BLOG_GENERATION} credits</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-purple-700 dark:text-purple-400">Image Generation</p>
                  <p className="text-2xl font-bold text-purple-600">{data.creditCosts.IMAGE_GENERATION} credit</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Wand2 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-700 dark:text-orange-400">AI Image Edit</p>
                  <p className="text-2xl font-bold text-orange-600">{data.creditCosts.IMAGE_EDIT} credits</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Graph */}
      {data.dailyUsage.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Usage Last 14 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {data.dailyUsage.map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.totalUsed / maxDailyUsage) * 100}%` }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md min-h-[4px]"
                        title={`${day.totalUsed.toFixed(2)} credits`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(day.date)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Usage Breakdown */}
      {data.usageStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Usage Breakdown (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.usageStats.map((stat) => {
                  const config = typeConfig[stat.type] || { 
                    label: stat.type, 
                    icon: Coins, 
                    color: "text-gray-600",
                    bgColor: "bg-gray-100"
                  };
                  const IconComponent = config.icon;
                  
                  return (
                    <div 
                      key={stat.type}
                      className={`p-4 rounded-xl ${config.bgColor} border`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className={`h-5 w-5 ${config.color}`} />
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className={`text-2xl font-bold ${config.color}`}>
                          {stat.totalAmount.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {stat.count} {stat.count === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>Your recent credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {data.transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.transactions.map((transaction) => {
                  const config = typeConfig[transaction.type] || { 
                    label: transaction.type, 
                    icon: Coins, 
                    color: "text-gray-600",
                    bgColor: "bg-gray-100"
                  };
                  const IconComponent = config.icon;
                  const isPositive = transaction.amount > 0;

                  return (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                          <IconComponent className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.description}
                            {transaction.metadata?.blogTitle && (
                              <span className="ml-1">- {transaction.metadata.blogTitle}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
