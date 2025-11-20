"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteBlogButton } from "@/components/delete-blog-button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Search,
  Calendar,
  Filter,
  SortAsc,
  SortDesc
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
type FilterOption = 'all' | 'saved' | 'draft';

export function BlogsClientPage({ blogs }: BlogsClientPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterOption>('all');

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

  const gradients = [
    'from-accent/20 via-secondary/10 to-transparent',
    'from-primary/20 via-accent/10 to-transparent',
    'from-secondary/20 via-accent/10 to-transparent',
    'from-primary/20 via-secondary/10 to-transparent',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">My Blogs</h1>
          <p className="text-muted-foreground">
            Manage and view all your blog posts
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create New Blog
          </Button>
        </Link>
      </div>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">No blogs yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start creating amazing content with AI assistance. Your blogs will appear here.
            </p>
            <Link href="/dashboard/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Blog
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
              <Input
                placeholder="Search by title or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-base bg-card/50 backdrop-blur-sm border-2 border-border focus:border-accent rounded-xl text-foreground"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Label */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/30">
                <Filter className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterOption)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-card border-2 border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent hover:border-accent/50 cursor-pointer transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="saved">Saved</option>
                  <option value="draft">Draft</option>
                </select>
                <SortDesc className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent pointer-events-none" />
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-card border-2 border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent hover:border-accent/50 cursor-pointer transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="words-high">Most Words</option>
                  <option value="words-low">Least Words</option>
                </select>
                <SortDesc className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent pointer-events-none" />
              </div>

              {/* Results Count */}
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  <span className="text-accent font-bold">{filteredAndSortedBlogs.length}</span>
                  <span className="text-accent/60"> / </span>
                  <span className="text-accent font-bold">{blogs.length}</span>
                </span>
                {(searchQuery || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus('all');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 font-medium text-sm transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Blog Cards Grid */}
          {filteredAndSortedBlogs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="h-16 w-16 text-accent/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No blogs found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBlogs.map((blog, index) => {
                const gradient = gradients[index % gradients.length];
                
                return (
                  <div
                    key={blog.id}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border-2 border-border hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-2 flex flex-col`}
                  >
                    {/* Gradient overlay border effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/0 via-accent/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="relative p-6 flex flex-col flex-1">
                      {/* Status Badge - Top Right */}
                      <div className="absolute top-4 right-4">
                        <Badge
                          variant={
                            blog.status === "published"
                              ? "default"
                              : blog.status === "draft"
                              ? "secondary"
                              : "outline"
                          }
                          className={`${
                            blog.status === "published"
                              ? "bg-primary text-primary-foreground"
                              : blog.status === "draft"
                              ? "bg-secondary text-secondary-foreground"
                              : "border-accent text-accent"
                          } shadow-lg capitalize`}
                        >
                          {blog.status === "published" ? "saved" : blog.status}
                        </Badge>
                      </div>

                      {/* Title Section */}
                      <div className="space-y-3 mb-4 pr-20">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-primary transition-all duration-300 line-clamp-2">
                          {blog.title}
                        </h3>
                        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-accent to-secondary group-hover:w-24 transition-all duration-300" />
                      </div>

                      {/* Employee Badge (if created by employee) */}
                      {blog.employee && (
                        <div className="mb-3">
                          <Badge variant="outline" className="border-secondary/30 bg-secondary/10 text-secondary font-semibold">
                            👤 Created by {blog.employee.username}
                          </Badge>
                        </div>
                      )}

                      {/* Keyword */}
                      <div className="flex items-center gap-2 text-sm mb-4">
                        <span className="text-accent font-semibold">🔑</span>
                        <span className="text-muted-foreground font-medium line-clamp-1">
                          {blog.primaryKeyword || 
                           (blog.targetKeywords ? blog.targetKeywords.split(',')[0].trim() : "No keyword")}
                        </span>
                      </div>

                      {/* Stats Pills */}
                      <div className="flex flex-wrap items-center gap-2 mb-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border">
                          <span className="text-xs font-medium text-accent">📝</span>
                          <span className="text-xs font-semibold text-muted-foreground">{blog.wordCount || 0}</span>
                        </div>
                        
                        {blog.seoScore && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border">
                            <span className="text-xs font-medium text-primary">📊</span>
                            <span className="text-xs font-semibold text-muted-foreground">{blog.seoScore}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border">
                          <span className="text-xs font-medium text-secondary">📅</span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {new Date(blog.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent my-4" />

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Link href={`/dashboard/blogs/${blog.id}/edit`} className="block">
                          <Button variant="default" className="w-full group/btn">
                            <Edit className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
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
