import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, blogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Download, ArrowLeft, User, Calendar as CalendarIcon, Clock, BookOpen, Info } from "lucide-react";
import { notFound } from "next/navigation";

export default async function PreviewBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, parseInt(id)),
  });

  if (!blog || blog.userId !== dbUser.id) {
    notFound();
  }

  const publishedDate = blog.publishedAt ?? blog.createdAt;
  const dateLabel = publishedDate
    ? new Date(publishedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/blogs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </Link>
        <div className="flex gap-3">
          <Link href={`/dashboard/blogs/${blog.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Blog Preview */}
      <article className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Article Header */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-10">
          <div className="max-w-3xl">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {blog.title}
              </h1>
              <span className={`inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium ${blog.status === 'published' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}`}>
                {blog.status === 'published' ? 'Saved' : 'Draft'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><User className="h-4 w-4" />{dbUser.authorName || "Anonymous"}</span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{blog.status === 'published' ? `Saved on ${dateLabel}` : dateLabel}</span>
              {blog.wordCount ? (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />{blog.wordCount} words</span>
                </>
              ) : null}
              {blog.readingTime ? (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{blog.readingTime} min read</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="px-8 py-12">
          {blog.htmlContent || blog.content ? (
            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-5 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-blue-600 prose-strong:font-semibold prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{
                __html: blog.htmlContent || blog.content || "",
              }}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No content available for preview
              </p>
              <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Start Writing
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Article Footer */}
        {blog.primaryKeyword && (
          <div className="border-t bg-muted/30 px-8 py-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Keywords:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {blog.primaryKeyword}
              </span>
              {blog.secondaryKeywords && Array.isArray(blog.secondaryKeywords) && blog.secondaryKeywords.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[hsl(var(--secondary))]/20 text-[hsl(var(--foreground))] border border-[hsl(var(--secondary))]/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* SEO Metrics */}
      {(blog.seoScore || blog.keywordDensity || blog.aeoScore || blog.geoScore || blog.eeatScore) && (
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">SEO Metrics
            <span title="Overall SEO quality (0–100). Good: 70–100."><Info className="h-4 w-4 text-muted-foreground" /></span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {blog.seoScore !== null && blog.seoScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-muted/30">
                <div className="text-3xl font-bold text-[hsl(var(--primary))]">
                  {blog.seoScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                  SEO Score
                </div>
              </div>
            )}
            {blog.keywordDensity && typeof blog.keywordDensity === 'object' && Object.keys(blog.keywordDensity).length > 0 ? (
              <div className="text-center p-5 rounded-xl border bg-muted/30">
                <div className="text-3xl font-bold text-[hsl(var(--secondary))]">
                  {(Object.values(blog.keywordDensity as Record<string, number>)[0] as number).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                  Keyword Density
                  <span title="Primary keyword usage as % of total words. Target 0.8%–2.5%."><Info className="h-4 w-4" /></span>
                </div>
              </div>
            ) : null}
            {blog.aeoScore !== null && blog.aeoScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-muted/30">
                <div className="text-3xl font-bold text-blue-500">
                  {blog.aeoScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                  AEO Score
                  <span title="Answer Engine Optimization (0–100). Good: 70–100. Focus on FAQs and concise answers."><Info className="h-4 w-4" /></span>
                </div>
              </div>
            )}
            {blog.geoScore !== null && blog.geoScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-muted/30">
                <div className="text-3xl font-bold text-purple-500">
                  {blog.geoScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                  GEO Score
                  <span title="Geo/Entity Optimization (0–100). Good: 70–100. Local relevance and entities."><Info className="h-4 w-4" /></span>
                </div>
              </div>
            )}
            {blog.eeatScore !== null && blog.eeatScore !== undefined && (
              <div className="text-center p-5 rounded-xl border bg-muted/30">
                <div className="text-3xl font-bold text-[hsl(var(--primary))]">
                  {blog.eeatScore}
                </div>
                <div className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                  E-E-A-T
                  <span title="Expertise, Experience, Authoritativeness, Trust (0–100). Good: 70–100."><Info className="h-4 w-4" /></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
