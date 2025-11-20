"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, Clock, BookOpen, User } from "lucide-react";

interface EmployeeBlogViewClientProps {
  employee: {
    id: number;
    username: string;
    fullName: string;
  };
  blog: {
    id: number;
    title: string;
    content: string;
    keywords: string | null;
    status: string;
    createdAt: string;
    publishedAt: string | null;
  };
}

export default function EmployeeBlogViewClient({
  employee,
  blog,
}: EmployeeBlogViewClientProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-primary/10 text-primary border-primary";
      case "draft":
        return "bg-secondary/10 text-secondary border-secondary";
      default:
        return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/employee/blogs")}
            className="text-foreground hover:text-[hsl(var(--primary))] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
          <Button
            onClick={() => router.push(`/employee/blogs/${blog.id}/edit`)}
            className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground"
          >
            Edit
          </Button>
        </div>

        {/* Blog Content */}
        <Card className="rounded-2xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[hsl(var(--card))] to-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {blog.title}
                </h1>
                <Badge variant="outline" className={getStatusColor(blog.status)}>
                  {blog.status === "published" ? "Saved" : blog.status === "draft" ? "Draft" : blog.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(blog.createdAt).toLocaleDateString()}</span>
                {blog.publishedAt && (
                  <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />Saved on {new Date(blog.publishedAt).toLocaleDateString()}</span>
                )}
                {blog.keywords && (
                  <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />{blog.keywords}</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-lg prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-5 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[hsl(var(--primary))] prose-strong:font-semibold prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
