import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, blogs, employees } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard-client";

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  if (!dbUser) {
    return null;
  }

  const allBlogs = await db.query.blogs.findMany({
    where: eq(blogs.userId, dbUser.id),
    orderBy: [desc(blogs.createdAt)],
  });

  const recentBlogs = allBlogs.slice(0, 5);

  // Employee Metrics
  const allEmployees = await db.query.employees.findMany({
    where: eq(employees.userId, dbUser.id),
  });
  
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter((e) => e.isActive).length;
  
  // Employee-created blogs
  const employeeBlogs = allBlogs.filter((b) => b.employeeId !== null);
  const totalEmployeeBlogs = employeeBlogs.length;
  const employeeSavedBlogs = employeeBlogs.filter((b) => b.status === "published").length;
  const employeeDraftBlogs = employeeBlogs.filter((b) => b.status === "draft").length;
  
  // Admin-created blogs (your own blogs)
  const adminBlogs = allBlogs.filter((b) => b.employeeId === null);

  // Calculate comprehensive metrics
  const totalBlogs = allBlogs.length;
  const savedBlogs = allBlogs.filter((b) => b.status === "published").length;
  const draftBlogs = allBlogs.filter((b) => b.status === "draft").length;
  const totalWords = allBlogs.reduce((sum, blog) => sum + (blog.wordCount || 0), 0);
  const avgWordsPerBlog = totalBlogs > 0 ? Math.round(totalWords / totalBlogs) : 0;
  
  // SEO Metrics
  const avgSeoScore = totalBlogs > 0 
    ? Math.round(allBlogs.reduce((sum, blog) => sum + (blog.seoScore || 0), 0) / totalBlogs) 
    : 0;
  const highSeoBlogs = allBlogs.filter((b) => (b.seoScore || 0) >= 80).length;
  
  // Content performance by month (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const monthBlogs = allBlogs.filter(blog => {
      const blogDate = new Date(blog.createdAt || '');
      return blogDate.getMonth() === date.getMonth() && 
             blogDate.getFullYear() === date.getFullYear();
    });
    const saved = monthBlogs.filter(b => b.status === 'published').length;
    const drafts = monthBlogs.filter(b => b.status === 'draft').length;
    monthlyData.push({ month: monthName, saved, drafts, date });
  }

  return (
    <DashboardClient 
      userName={dbUser?.authorName || "there"}
      stats={{
        totalBlogs,
        savedBlogs,
        draftBlogs,
        totalWords,
        avgWordsPerBlog,
        avgSeoScore,
        highSeoBlogs,
        // Employee metrics
        totalEmployees,
        activeEmployees,
        totalEmployeeBlogs,
        employeeSavedBlogs,
        employeeDraftBlogs,
        adminBlogs: adminBlogs.length,
      }}
      recentBlogs={recentBlogs}
      monthlyData={monthlyData}
    />
  );
}
