"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteBlogButton } from "@/components/delete-blog-button";
import { toast } from "sonner";
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Search,
  Sparkles,
  Loader2,
  ChevronDown
} from "lucide-react";

interface Blog {
  id: number;
  title: string;
  status: string | null;
  primaryKeyword: string | null;
  targetKeywords: string | null;
  wordCount: number | null;
  seoScore: number | null;
  content: string | null;
  createdAt: Date | null;
  employee?: {
    username: string;
    id: number;
  } | null;
}

interface BlogsClientPageProps {
  blogs: Blog[];
}

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'words-high' | 'words-low';
type FilterOption = 'all' | 'saved' | 'draft' | 'processing';

export function BlogsClientPage({ blogs: initialBlogs }: BlogsClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterOption>('all');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchDone = useRef(false);

  // Fetch fresh data on mount to catch newly created processing blogs
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    
    // Small delay to allow server to process the status update
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/blogs/list');
        if (res.ok) {
          const freshBlogs = await res.json();
          setBlogs(freshBlogs);
        }
      } catch (error) {
        console.error('Failed to fetch fresh blogs:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Poll for processing blogs - only update status, don't cause re-render flicker
  const checkProcessingBlogs = useCallback(async () => {
    const processingBlogs = blogs.filter(b => b.status === 'processing');
    if (processingBlogs.length === 0) return;

    for (const blog of processingBlogs) {
      try {
        const res = await fetch(`/api/blogs/${blog.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== 'processing') {
            // Blog is done, update local state with full content
            setBlogs(prev => prev.map(b => 
              b.id === blog.id ? { 
                ...b, 
                status: data.status, 
                content: data.content || b.content,
              } : b
            ));
            // Show toast when generation completes
            toast.success(`"${blog.title}" has been generated!`);
          }
        }
      } catch (error) {
        console.error('Error checking blog status:', error);
      }
    }
  }, [blogs]);

  // Poll every 5 seconds for processing blogs
  useEffect(() => {
    const hasProcessing = blogs.some(b => b.status === 'processing');
    if (!hasProcessing) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    // Clear existing interval
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    // Check immediately on first processing blog detected
    checkProcessingBlogs();
    
    // Set new interval - 5 seconds for responsive updates
    pollingRef.current = setInterval(checkProcessingBlogs, 5000);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [blogs, checkProcessingBlogs]);

  // Update blogs when initialBlogs changes (but preserve processing state)
  useEffect(() => {
    setBlogs(prev => {
      // Merge new data while preserving local processing state
      const merged = initialBlogs.map(newBlog => {
        const existingBlog = prev.find(b => b.id === newBlog.id);
        if (existingBlog && existingBlog.status === 'processing' && newBlog.status === 'processing') {
          return existingBlog; // Keep existing to prevent flicker
        }
        return newBlog;
      });
      
      // Check for any processing blogs in prev that are not in initialBlogs (newly added)
      const newProcessingBlogs = prev.filter(b => 
        b.status === 'processing' && !initialBlogs.find(ib => ib.id === b.id)
      );
      
      return [...merged, ...newProcessingBlogs];
    });
  }, [initialBlogs]);

  // Filter and sort blogs
  const filteredAndSortedBlogs = useMemo(() => {
    let filtered = [...blogs];

    // Apply status filter
    if (filterStatus !== 'all') {
      const statusToFilter = filterStatus === 'saved' ? 'published' : filterStatus;
      filtered = filtered.filter(blog => blog.status === statusToFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        blog.primaryKeyword?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

    return filtered;
  }, [blogs, searchQuery, sortBy, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Blogs</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your blog posts
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create New Blog
          </Button>
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No blogs yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start creating amazing content with AI assistance. Your blogs will appear here.
          </p>
          <Link href="/dashboard/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Blog
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-border"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterOption)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-gray-50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="saved">Saved</option>
                  <option value="draft">Draft</option>
                  <option value="processing">Processing</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-gray-50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="words-high">Most Words</option>
                  <option value="words-low">Least Words</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Results Count */}
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredAndSortedBlogs.length}</span> of <span className="font-semibold text-foreground">{blogs.length}</span>
                </span>
                {(searchQuery || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus('all');
                    }}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Blog Cards Grid */}
          {filteredAndSortedBlogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-16 text-center">
              <Search className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No blogs found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedBlogs.map((blog) => {
                const isProcessing = blog.status === 'processing';
                
                return (
                  <div
                    key={blog.id}
                    className={`bg-white rounded-xl border ${isProcessing ? 'border-primary/30' : 'border-border hover:border-primary/30'} transition-all duration-200 hover:shadow-md flex flex-col`}
                  >
                    <div className="p-5 flex flex-col flex-1">
                      {/* Header: Title + Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
                          {blog.title}
                        </h3>
                        {isProcessing ? (
                          <Badge className="bg-primary/10 text-primary border-0 shrink-0">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline"
                            className={`shrink-0 ${
                              blog.status === "published"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {blog.status === "published" ? "Saved" : "Draft"}
                          </Badge>
                        )}
                      </div>

                      {/* Keyword */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span className="text-primary">🔑</span>
                        <span className="line-clamp-1">
                          {blog.primaryKeyword || 
                           (blog.targetKeywords ? blog.targetKeywords.split(',')[0].trim() : "No keyword")}
                        </span>
                      </div>

                      {/* Employee Badge */}
                      {blog.employee && (
                        <div className="mb-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            👤 {blog.employee.username}
                          </Badge>
                        </div>
                      )}

                      {/* Processing State */}
                      {isProcessing ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-6">
                          <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                            <Sparkles className="h-6 w-6 text-primary" />
                          </div>
                          <div className="w-full max-w-[200px] mb-2">
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-primary animate-progress" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            AI is crafting your blog...
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 mt-auto">
                            <span className="flex items-center gap-1">
                              <span>📝</span> {blog.wordCount || 0} words
                            </span>
                            {blog.seoScore && (
                              <span className="flex items-center gap-1">
                                <span>📊</span> {blog.seoScore}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <span>📅</span> {new Date(blog.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Actions */}
                      <div className="pt-4 border-t border-border space-y-2">
                        {isProcessing ? (
                          <Button variant="outline" className="w-full" disabled>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </Button>
                        ) : (
                          <>
                            <Link href={`/dashboard/blogs/${blog.id}/edit`} className="block">
                              <Button className="w-full">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </Link>
                            
                            <div className="flex gap-2">
                              {blog.content && (
                                <Link href={`/dashboard/blogs/${blog.id}/preview`} className="flex-1">
                                  <Button variant="outline" className="w-full" size="sm">
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Preview
                                  </Button>
                                </Link>
                              )}
                              <DeleteBlogButton blogId={blog.id} blogTitle={blog.title} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
