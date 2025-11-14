import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, blogs } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteBlogButton } from "@/components/delete-blog-button";
import { BlogsClientPage } from "@/components/blogs-client-page";

// Force dynamic rendering to ensure fresh data after deletions
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BlogsPage() {
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

  // Fetch all blogs: both admin-created and employee-created
  const userBlogs = await db.query.blogs.findMany({
    where: eq(blogs.userId, dbUser.id),
    orderBy: [desc(blogs.createdAt)],
    with: {
      employee: {
        columns: {
          username: true,
          id: true,
        },
      },
    },
  });

  return <BlogsClientPage blogs={userBlogs} />;
}
