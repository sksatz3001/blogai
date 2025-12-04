"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  PenTool, 
  BarChart3,
  Target,
  Award,
  Calendar,
  Eye,
  Edit,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BookOpen,
  CheckCircle2
} from "lucide-react";

interface Blog {
  id: number;
  title: string;
  status: string | null;
  wordCount: number | null;
  seoScore: number | null;
  createdAt: Date | null;
}

interface DashboardStats {
  totalBlogs: number;
  savedBlogs: number;
  draftBlogs: number;
  totalWords: number;
  avgWordsPerBlog: number;
  avgSeoScore: number;
  highSeoBlogs: number;
  // Employee metrics
  totalEmployees: number;
  activeEmployees: number;
  totalEmployeeBlogs: number;
  employeeSavedBlogs: number;
  employeeDraftBlogs: number;
  adminBlogs: number;
}

interface MonthlyData {
  month: string;
  saved: number;
  drafts: number;
  date: Date;
}

interface WeeklyData {
  week: string;
  saved: number;
  drafts: number;
}

interface DailyData {
  day: string;
  saved: number;
  drafts: number;
}

type ChartPeriod = 'daily' | 'weekly' | 'monthly';

interface DashboardClientProps {
  userName: string;
  stats: DashboardStats;
  recentBlogs: Blog[];
  monthlyData: MonthlyData[];
}

export function DashboardClient({ userName, stats, recentBlogs, monthlyData }: DashboardClientProps) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('monthly');
  
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
  const lastMonthSaved = monthlyData[monthlyData.length - 1]?.saved || 0;
  const prevMonthSaved = monthlyData[monthlyData.length - 2]?.saved || 0;
  const savedChange = prevMonthSaved > 0 
    ? Math.round(((lastMonthSaved - prevMonthSaved) / prevMonthSaved) * 100)
    : lastMonthSaved > 0 ? 100 : 0;

  // Generate weekly data (last 7 weeks)
  const weeklyData = useMemo(() => {
    const weeks: WeeklyData[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekLabel = `W${Math.ceil(weekStart.getDate() / 7)}`;
      
      // This is simplified - in real implementation, you'd filter recentBlogs by week
      const weekBlogs = recentBlogs.filter(blog => {
        const blogDate = new Date(blog.createdAt || '');
        return blogDate >= weekStart && blogDate <= weekEnd;
      });
      
      weeks.push({
        week: weekLabel,
        saved: weekBlogs.filter(b => b.status === 'published').length,
        drafts: weekBlogs.filter(b => b.status === 'draft').length,
      });
    }
    return weeks;
  }, [recentBlogs]);

  // Generate daily data (last 7 days)
  const dailyData = useMemo(() => {
    const days: DailyData[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Filter blogs created on this day
      const dayBlogs = recentBlogs.filter(blog => {
        const blogDate = new Date(blog.createdAt || '');
        return blogDate.toDateString() === day.toDateString();
      });
      
      days.push({
        day: dayLabel,
        saved: dayBlogs.filter(b => b.status === 'published').length,
        drafts: dayBlogs.filter(b => b.status === 'draft').length,
      });
    }
    return days;
  }, [recentBlogs]);

  // Select chart data based on period
  const chartData = useMemo(() => {
    if (chartPeriod === 'daily') {
      return dailyData.map(d => ({ label: d.day, saved: d.saved, drafts: d.drafts }));
    } else if (chartPeriod === 'weekly') {
      return weeklyData.map(w => ({ label: w.week, saved: w.saved, drafts: w.drafts }));
    } else {
      return monthlyData.map(m => ({ label: m.month, saved: m.saved, drafts: m.drafts }));
    }
  }, [chartPeriod, dailyData, weeklyData, monthlyData]);

  // Calculate max for bar chart scaling
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.saved, d.drafts)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good Morning, {userName}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            All your content matters, all in one place. Managing blogs has never been easier.
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Blog
          </Button>
        </Link>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Content */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs">
                All Time
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Content</p>
              <p className="text-2xl font-bold">{stats.totalBlogs}</p>
              <p className="text-xs text-primary">
                {stats.totalWords.toLocaleString()} total words
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Saved Blogs */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                {savedChange >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">+{savedChange}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                    <span className="text-red-500 font-medium">{savedChange}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saved Blogs</p>
              <p className="text-2xl font-bold">{stats.savedBlogs}</p>
              <p className="text-xs text-muted-foreground">
                {lastMonthSaved} this month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Words Written */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Content
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Words</p>
              <p className="text-2xl font-bold">
                {stats.totalWords >= 1000 
                  ? `${(stats.totalWords / 1000).toFixed(1)}k` 
                  : stats.totalWords}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg {stats.avgWordsPerBlog} per blog
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Drafts */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <PenTool className="h-4 w-4 text-gray-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                Draft
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{stats.draftBlogs}</p>
              <p className="text-xs text-muted-foreground">
                {stats.avgWordsPerBlog} avg words/post
              </p>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Middle Section: Chart & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Content Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Content Activity</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {chartPeriod === 'daily' ? 'Last 7 days' : chartPeriod === 'weekly' ? 'Last 7 weeks' : 'Last 6 months'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Period Filter Buttons */}
                <div className="flex items-center gap-1 p-1 rounded-md bg-muted">
                  <button
                    onClick={() => setChartPeriod('daily')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      chartPeriod === 'daily'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setChartPeriod('weekly')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      chartPeriod === 'weekly'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartPeriod('monthly')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      chartPeriod === 'monthly'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-muted-foreground">Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-muted-foreground">Drafts</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.every(d => d.saved === 0 && d.drafts === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-muted-foreground text-sm">No activity in this period</p>
                <p className="text-muted-foreground text-xs mt-1">Start creating blogs to see insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chartData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium min-w-[60px]">{data.label}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-primary">{data.saved} saved</span>
                        <span className="text-gray-500">{data.drafts} drafts</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-8">
                      {/* Saved Bar */}
                      <div 
                        className="bg-primary rounded transition-all hover:opacity-80 relative"
                        style={{ width: `${(data.saved / maxChartValue) * 100}%`, minWidth: data.saved > 0 ? '4px' : '0' }}
                      >
                        {data.saved > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                            {data.saved}
                          </span>
                        )}
                      </div>
                      {/* Drafts Bar */}
                      <div 
                        className="bg-gray-300 rounded transition-all hover:opacity-80 relative"
                        style={{ width: `${(data.drafts / maxChartValue) * 100}%`, minWidth: data.drafts > 0 ? '4px' : '0' }}
                      >
                        {data.drafts > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                            {data.drafts}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-4">
          {/* Quick Create */}
          <Card className="border-dashed">
            <CardContent className="p-5 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Start Creating</h3>
                <p className="text-xs text-muted-foreground">Generate AI-powered content</p>
              </div>
              <Link href="/dashboard/create">
                <Button className="w-full" size="sm">
                  New Blog Post
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* This Month Stats */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">This Month</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saved</span>
                  <span className="text-lg font-bold text-primary">{lastMonthSaved}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="text-lg font-bold text-gray-600">
                    {monthlyData[monthlyData.length - 1]?.drafts || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Insights */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">SEO Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg SEO Score</span>
                  <span className="text-2xl font-bold text-primary">{stats.avgSeoScore}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">High Quality (80+)</span>
                    <span className="text-green-600 font-medium">{stats.highSeoBlogs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Needs Work (&lt;80)</span>
                    <span className="text-gray-600 font-medium">{stats.totalBlogs - stats.highSeoBlogs}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Blogs */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Blogs</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Your latest content</p>
            </div>
            <Link href="/dashboard/blogs">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentBlogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-medium mb-2">No blogs yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Start creating amazing content with AI assistance
              </p>
              <Link href="/dashboard/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Blog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {blog.title}
                      </h4>
                      <Badge 
                        variant={blog.status === "published" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {blog.status === "published" ? "saved" : "draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {blog.wordCount || 0} words
                      </span>
                      {blog.seoScore && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          SEO: {blog.seoScore}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(blog.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {blog.status === "published" && (
                      <Link href={`/dashboard/blogs/${blog.id}/preview`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
