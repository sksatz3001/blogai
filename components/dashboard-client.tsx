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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#88C0D0] via-[#8FBCBB] to-[#88C0D0] bg-clip-text text-transparent">
            Good Morning, {userName}!
          </h1>
          <p className="text-[#D8DEE9]">
            All your content matters, all in one place. Managing blogs has never been easier.
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Blog
          </Button>
        </Link>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Content */}
        <Card className="glass border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#88C0D0]/20 to-[#88C0D0]/5">
                <FileText className="h-5 w-5 text-[#88C0D0]" />
              </div>
              <Badge variant="outline" className="border-[#88C0D0]/30 text-[#88C0D0]">
                All Time
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#D8DEE9]">Total Content</p>
              <p className="text-3xl font-bold text-[#ECEFF4]">{stats.totalBlogs}</p>
              <p className="text-xs text-[#88C0D0]">
                {stats.totalWords.toLocaleString()} total words
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Saved Blogs */}
        <Card className="glass border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#A3BE8C]/20 to-[#A3BE8C]/5">
                <CheckCircle2 className="h-5 w-5 text-[#A3BE8C]" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                {savedChange >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-[#A3BE8C]" />
                    <span className="text-[#A3BE8C] font-semibold">+{savedChange}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-[#BF616A]" />
                    <span className="text-[#BF616A] font-semibold">{savedChange}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#D8DEE9]">Saved Blogs</p>
              <p className="text-3xl font-bold text-[#ECEFF4]">{stats.savedBlogs}</p>
              <p className="text-xs text-[#D8DEE9]">
                {lastMonthSaved} this month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Words Written */}
        <Card className="glass border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#B48EAD]/20 to-[#B48EAD]/5">
                <BookOpen className="h-5 w-5 text-[#B48EAD]" />
              </div>
              <Badge variant="outline" className="border-[#B48EAD]/30 text-[#B48EAD]">
                Content
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#D8DEE9]">Total Words</p>
              <p className="text-3xl font-bold text-[#ECEFF4]">
                {stats.totalWords >= 1000 
                  ? `${(stats.totalWords / 1000).toFixed(1)}k` 
                  : stats.totalWords}
              </p>
              <p className="text-xs text-[#D8DEE9]">
                Avg {stats.avgWordsPerBlog} per blog
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Drafts */}
        <Card className="glass border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#D08770]/20 to-[#D08770]/5">
                <PenTool className="h-5 w-5 text-[#D08770]" />
              </div>
              <Badge variant="outline" className="border-[#D08770]/30 text-[#D08770]">
                Draft
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#D8DEE9]">In Progress</p>
              <p className="text-3xl font-bold text-[#ECEFF4]">{stats.draftBlogs}</p>
              <p className="text-xs text-[#D8DEE9]">
                {stats.avgWordsPerBlog} avg words/post
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Metrics Section */}
      {stats.totalEmployees > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#88C0D0] to-[#B48EAD]" />
            <h2 className="text-2xl font-bold text-[#ECEFF4]">Team Performance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Employees */}
            <Card className="glass border-2 border-[#3B4252] hover:border-[#B48EAD]/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#B48EAD]/20 to-[#B48EAD]/5">
                    <svg className="h-5 w-5 text-[#B48EAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <Link href="/dashboard/team">
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-[#88C0D0] hover:text-[#88C0D0]">
                      Manage →
                    </Button>
                  </Link>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#D8DEE9]">Total Employees</p>
                  <p className="text-3xl font-bold text-[#ECEFF4]">{stats.totalEmployees}</p>
                  <p className="text-xs text-[#A3BE8C]">
                    {stats.activeEmployees} active
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Employee Blogs */}
            <Card className="glass border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#88C0D0]/20 to-[#88C0D0]/5">
                    <FileText className="h-5 w-5 text-[#88C0D0]" />
                  </div>
                  <Badge variant="outline" className="border-[#88C0D0]/30 text-[#88C0D0]">
                    Team
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#D8DEE9]">Employee Blogs</p>
                  <p className="text-3xl font-bold text-[#ECEFF4]">{stats.totalEmployeeBlogs}</p>
                  <p className="text-xs text-[#D8DEE9]">
                    {((stats.totalEmployeeBlogs / Math.max(stats.totalBlogs, 1)) * 100).toFixed(0)}% of total
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Employee Saved */}
            <Card className="glass border-2 border-[#3B4252] hover:border-[#A3BE8C]/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#A3BE8C]/20 to-[#A3BE8C]/5">
                    <CheckCircle2 className="h-5 w-5 text-[#A3BE8C]" />
                  </div>
                  <Badge variant="outline" className="border-[#A3BE8C]/30 text-[#A3BE8C]">
                    Saved
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#D8DEE9]">Team Saved</p>
                  <p className="text-3xl font-bold text-[#ECEFF4]">{stats.employeeSavedBlogs}</p>
                  <p className="text-xs text-[#D8DEE9]">
                    {stats.employeeDraftBlogs} drafts
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Your Blogs */}
            <Card className="glass border-2 border-[#3B4252] hover:border-[#EBCB8B]/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#EBCB8B]/20 to-[#EBCB8B]/5">
                    <Award className="h-5 w-5 text-[#EBCB8B]" />
                  </div>
                  <Badge variant="outline" className="border-[#EBCB8B]/30 text-[#EBCB8B]">
                    You
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#D8DEE9]">Your Blogs</p>
                  <p className="text-3xl font-bold text-[#ECEFF4]">{stats.adminBlogs}</p>
                  <p className="text-xs text-[#D8DEE9]">
                    {((stats.adminBlogs / Math.max(stats.totalBlogs, 1)) * 100).toFixed(0)}% of total
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Productivity Metric */}
            <Card className="glass border-2 border-[#3B4252] hover:border-[#D08770]/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#D08770]/20 to-[#D08770]/5">
                    <TrendingUp className="h-5 w-5 text-[#D08770]" />
                  </div>
                  <Badge variant="outline" className="border-[#D08770]/30 text-[#D08770]">
                    Avg
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#D8DEE9]">Blogs/Employee</p>
                  <p className="text-3xl font-bold text-[#ECEFF4]">
                    {stats.totalEmployees > 0 ? (stats.totalEmployeeBlogs / stats.totalEmployees).toFixed(1) : '0'}
                  </p>
                  <p className="text-xs text-[#D8DEE9]">
                    Team productivity
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Middle Section: Chart & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Performance Chart */}
        <Card className="lg:col-span-2 glass border-2 border-[#3B4252]">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-[#ECEFF4]">Content Activity</CardTitle>
                <p className="text-sm text-[#D8DEE9] mt-1">
                  {chartPeriod === 'daily' ? 'Last 7 days' : chartPeriod === 'weekly' ? 'Last 7 weeks' : 'Last 6 months'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Period Filter Buttons */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#2E3440]/50 border border-[#3B4252]">
                  <button
                    onClick={() => setChartPeriod('daily')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      chartPeriod === 'daily'
                        ? 'bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] shadow-lg'
                        : 'text-[#D8DEE9] hover:text-[#ECEFF4]'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setChartPeriod('weekly')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      chartPeriod === 'weekly'
                        ? 'bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] shadow-lg'
                        : 'text-[#D8DEE9] hover:text-[#ECEFF4]'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartPeriod('monthly')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      chartPeriod === 'monthly'
                        ? 'bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] shadow-lg'
                        : 'text-[#D8DEE9] hover:text-[#ECEFF4]'
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
                <div className="w-3 h-3 rounded-full bg-[#88C0D0]"></div>
                <span className="text-[#D8DEE9]">Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EBCB8B]"></div>
                <span className="text-[#D8DEE9]">Drafts</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.every(d => d.saved === 0 && d.drafts === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-[#88C0D0]/30 mb-3" />
                <p className="text-[#D8DEE9] text-sm">No activity in this period</p>
                <p className="text-[#D8DEE9]/60 text-xs mt-1">Start creating blogs to see insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chartData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#D8DEE9] font-medium min-w-[60px]">{data.label}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[#88C0D0]">{data.saved} saved</span>
                        <span className="text-[#EBCB8B]">{data.drafts} drafts</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-10">
                      {/* Saved Bar */}
                      <div 
                        className="bg-gradient-to-t from-[#88C0D0] to-[#8FBCBB] rounded-lg transition-all hover:opacity-80 relative group"
                        style={{ width: `${(data.saved / maxChartValue) * 100}%`, minWidth: data.saved > 0 ? '4px' : '0' }}
                      >
                        {data.saved > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#2E3440]">
                            {data.saved}
                          </span>
                        )}
                      </div>
                      {/* Drafts Bar */}
                      <div 
                        className="bg-gradient-to-t from-[#EBCB8B] to-[#D08770] rounded-lg transition-all hover:opacity-80 relative group"
                        style={{ width: `${(data.drafts / maxChartValue) * 100}%`, minWidth: data.drafts > 0 ? '4px' : '0' }}
                      >
                        {data.drafts > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#2E3440]">
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
          <Card className="glass border-2 border-dashed border-[#88C0D0]/30 hover:border-[#88C0D0]/60 transition-all bg-gradient-to-br from-[#88C0D0]/5 to-[#D08770]/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-[#88C0D0] to-[#8FBCBB] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#2E3440]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#ECEFF4] mb-1">Start Creating</h3>
                <p className="text-xs text-[#D8DEE9]">Generate AI-powered content</p>
              </div>
              <Link href="/dashboard/create">
                <Button className="w-full" size="sm">
                  New Blog Post
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* This Month Stats */}
          <Card className="glass border-2 border-[#3B4252]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#ECEFF4]">
                <Calendar className="h-4 w-4 text-[#88C0D0]" />
                <h3 className="font-semibold">This Month</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#D8DEE9]">Saved</span>
                  <span className="text-lg font-bold text-[#A3BE8C]">{lastMonthSaved}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[#88C0D0]/20 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#D8DEE9]">In Progress</span>
                  <span className="text-lg font-bold text-[#D08770]">
                    {monthlyData[monthlyData.length - 1]?.drafts || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Insights */}
          <Card className="glass border-2 border-[#3B4252]">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#ECEFF4]">
                <Target className="h-4 w-4 text-[#EBCB8B]" />
                <h3 className="font-semibold">SEO Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#D8DEE9]">Avg SEO Score</span>
                  <span className="text-2xl font-bold text-[#EBCB8B]">{stats.avgSeoScore}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[#88C0D0]/20 to-transparent" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#D8DEE9]">High Quality (80+)</span>
                    <span className="text-[#A3BE8C] font-semibold">{stats.highSeoBlogs}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#D8DEE9]">Needs Work (&lt;80)</span>
                    <span className="text-[#D08770] font-semibold">{stats.totalBlogs - stats.highSeoBlogs}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Blogs */}
      <Card className="glass border-2 border-[#3B4252]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-[#ECEFF4]">Recent Blogs</CardTitle>
              <p className="text-sm text-[#D8DEE9] mt-1">Your latest content</p>
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
              <FileText className="h-16 w-16 text-[#88C0D0]/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#ECEFF4] mb-2">No blogs yet</h3>
              <p className="text-[#D8DEE9] mb-6">
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
            <div className="space-y-3">
              {recentBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#2E3440]/30 border border-[#3B4252] hover:border-[#88C0D0]/50 hover:bg-[#2E3440]/50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-[#ECEFF4] truncate group-hover:text-[#88C0D0] transition-colors">
                        {blog.title}
                      </h4>
                      <Badge 
                        variant={blog.status === "published" ? "default" : "secondary"}
                        className={`${
                          blog.status === "published" 
                            ? "bg-[#A3BE8C] text-[#2E3440]" 
                            : "bg-[#D08770] text-[#2E3440]"
                        }`}
                      >
                        {blog.status === "published" ? "saved" : "draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#D8DEE9]">
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
                  <div className="flex items-center gap-2 ml-4">
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
