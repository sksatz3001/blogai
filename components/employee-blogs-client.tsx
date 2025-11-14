"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Loader2, Plus, Search, Filter, SortDesc, Edit, Eye } from "lucide-react";

interface EmployeeBlogsClientProps {
  employee: {
    id: number;
    username: string;
    fullName: string;
  };
}

interface BlogRow {
  id: number;
  title: string;
  status: string | null;
  primaryKeyword: string | null;
  targetKeywords: string | null;
  wordCount: number | null;
  seoScore: number | null;
  content: string | null;
  createdAt: string | null;
}

export default function EmployeeBlogsClient({ employee }: EmployeeBlogsClientProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "title-desc" | "words-high" | "words-low">("newest");
  const [filterStatus, setFilterStatus] = useState<"all" | "saved" | "draft">("all");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/employee/blogs");
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch blogs");
      }
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      setError("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const gradients = [
    'from-[#88C0D0]/20 via-[#81A1C1]/10 to-transparent',
    'from-[#D08770]/20 via-[#EBCB8B]/10 to-transparent',
    'from-[#B48EAD]/20 via-[#88C0D0]/10 to-transparent',
    'from-[#A3BE8C]/20 via-[#8FBCBB]/10 to-transparent',
  ];

  const filteredAndSortedBlogs = useMemo(() => {
    let list = [...blogs];

    if (filterStatus !== 'all') {
      const statusToFilter = filterStatus === 'saved' ? 'published' : filterStatus;
      list = list.filter(b => (b.status || 'draft') === statusToFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.primaryKeyword || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'words-high':
          return (b.wordCount || 0) - (a.wordCount || 0);
        case 'words-low':
          return (a.wordCount || 0) - (b.wordCount || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [blogs, searchQuery, sortBy, filterStatus]);

  return (
    <div className="min-h-screen bg-[#1E222A] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/employee/dashboard")}
              className="text-[#D8DEE9] hover:text-[#88C0D0] mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-[#ECEFF4]">My Blogs</h1>
            <p className="text-[#D8DEE9]/70 mt-2">Logged in as {employee.fullName}</p>
          </div>

          <Link href="/employee/create" prefetch={true}>
            <Button className="bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] hover:from-[#88C0D0]/90 hover:to-[#8FBCBB]/90">
              <FileText className="h-4 w-4 mr-2" />
              Create New Blog
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="glass border-2 border-[#BF616A] bg-[#BF616A]/10">
            <CardContent className="p-4">
              <p className="text-[#BF616A]">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Blogs List */}
        <Card className="glass border-2 border-[#3B4252]">
          <CardHeader>
            <CardTitle className="text-[#ECEFF4] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#88C0D0]" />
                Your Blog Posts ({blogs.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#88C0D0] animate-spin" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-[#4C566A] mx-auto mb-4" />
                <p className="text-[#D8DEE9]/60">No blogs yet</p>
                <p className="text-sm text-[#D8DEE9]/40 mt-2">Create your first blog to get started</p>
                <Link href="/employee/create" prefetch={true}>
                  <Button className="mt-6 bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440]">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Blog
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Search and Filters */}
                <div className="space-y-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#88C0D0]" />
                    <Input
                      placeholder="Search by title or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 h-12 bg-[#2E3440]/50 border-2 border-[#3B4252] focus:border-[#88C0D0] rounded-xl"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#88C0D0]/10 to-[#8FBCBB]/5 border border-[#88C0D0]/30">
                      <Filter className="h-4 w-4 text-[#88C0D0]" />
                      <span className="text-sm font-semibold text-[#88C0D0]">Filters</span>
                    </div>
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-[#2E3440] border-2 border-[#434C5E] text-[#ECEFF4] text-sm font-medium focus:outline-none focus:border-[#88C0D0]"
                      >
                        <option value="all">All Status</option>
                        <option value="saved">Saved</option>
                        <option value="draft">Draft</option>
                      </select>
                      <SortDesc className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#88C0D0] pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-[#2E3440] border-2 border-[#434C5E] text-[#ECEFF4] text-sm font-medium focus:outline-none focus:border-[#88C0D0]"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                        <option value="words-high">Most Words</option>
                        <option value="words-low">Least Words</option>
                      </select>
                      <SortDesc className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#88C0D0] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedBlogs.map((blog, index) => {
                    const gradient = gradients[index % gradients.length];
                    return (
                      <div
                        key={blog.id}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border-2 border-[#3B4252] hover:border-[#88C0D0]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#88C0D0]/10 hover:-translate-y-2 flex flex-col`}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#88C0D0]/0 via-[#88C0D0]/5 to-[#D08770]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        <div className="relative p-6 flex flex-col flex-1">
                          <div className="absolute top-4 right-4">
                            <Badge
                              variant={(blog.status || 'draft') === 'published' ? 'default' : 'secondary'}
                              className={`${(blog.status || 'draft') === 'published' ? 'bg-[#88C0D0] text-[#2E3440]' : 'bg-[#D08770] text-[#2E3440]'} shadow-lg capitalize`}
                            >
                              {(blog.status || 'draft') === 'published' ? 'saved' : (blog.status || 'draft')}
                            </Badge>
                          </div>

                          <div className="space-y-3 mb-4 pr-20">
                            <h3 className="text-xl font-bold text-[#ECEFF4] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#88C0D0] group-hover:to-[#8FBCBB] transition-all duration-300 line-clamp-2">
                              {blog.title}
                            </h3>
                            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#88C0D0] to-[#D08770] group-hover:w-24 transition-all duration-300" />
                          </div>

                          <div className="flex items-center gap-2 text-sm mb-4">
                            <span className="text-[#88C0D0] font-semibold">🔑</span>
                            <span className="text-[#D8DEE9] font-medium line-clamp-1">
                              {blog.primaryKeyword || (blog.targetKeywords ? blog.targetKeywords.split(',')[0].trim() : 'No keyword')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-auto">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B4252]/50 border border-[#434C5E]">
                              <span className="text-xs font-medium text-[#88C0D0]">📝</span>
                              <span className="text-xs font-semibold text-[#D8DEE9]">{blog.wordCount || 0}</span>
                            </div>
                            {blog.seoScore && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B4252]/50 border border-[#434C5E]">
                                <span className="text-xs font-medium text-[#A3BE8C]">📊</span>
                                <span className="text-xs font-semibold text-[#D8DEE9]">{blog.seoScore}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B4252]/50 border border-[#434C5E]">
                              <span className="text-xs font-medium text-[#D08770]">📅</span>
                              <span className="text-xs font-semibold text-[#D8DEE9]">{new Date(blog.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>

                          <div className="h-px bg-gradient-to-r from-transparent via-[#88C0D0]/30 to-transparent my-4" />

                          <div className="space-y-2">
                            <Link href={`/employee/blogs/${blog.id}/edit`} className="block" prefetch={true}>
                              <Button className="w-full group/btn">
                                <Edit className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                                Edit
                              </Button>
                            </Link>
                            <div className="flex gap-2">
                              <Link href={`/employee/blogs/${blog.id}`} className="flex-1" prefetch={true}>
                                <Button variant="outline" className="w-full" size="sm">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
