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
        return "bg-[#A3BE8C]/10 text-[#A3BE8C] border-[#A3BE8C]";
      case "draft":
        return "bg-[#D08770]/10 text-[#D08770] border-[#D08770]";
      default:
        return "bg-[#4C566A]/10 text-[#4C566A] border-[#4C566A]";
    }
  };

  return (
    <div className="min-h-screen bg-[#1E222A] p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/employee/blogs")}
            className="text-[#D8DEE9] hover:text-[#88C0D0] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
          <Button
            onClick={() => router.push(`/employee/blogs/${blog.id}/edit`)}
            className="bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440]"
          >
            Edit
          </Button>
        </div>

        {/* Blog Content */}
        <Card className="rounded-2xl border-2 border-[#3B4252] bg-[#2E3440]/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#2E3440] to-[#3B4252] border-b border-[#3B4252]">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-[#ECEFF4]">
                  {blog.title}
                </h1>
                <Badge variant="outline" className={getStatusColor(blog.status)}>
                  {blog.status === "published" ? "Saved" : blog.status === "draft" ? "Draft" : blog.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-[#D8DEE9]/80">
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
              className="prose prose-lg prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-5 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-[#88C0D0] prose-strong:font-semibold prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
