import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { blogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import EmployeeBlogViewClient from "@/components/employee-blog-view-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeBlogViewPage({ params }: PageProps) {
  const session = await getEmployeeSession();

  if (!session) {
    redirect("/employee/login");
  }

  const resolvedParams = await params;
  const blogId = parseInt(resolvedParams.id);

  // Get employee
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, session.employeeId),
  });

  if (!employee || !employee.isActive) {
    redirect("/employee/login");
  }

  // Get blog - ensure it belongs to this employee
  const blog = await db.query.blogs.findFirst({
    where: and(eq(blogs.id, blogId), eq(blogs.employeeId, employee.id)),
  });

  if (!blog) {
    redirect("/employee/blogs");
  }

  return (
    <EmployeeBlogViewClient
      employee={{
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
      }}
      blog={{
        id: blog.id,
        title: blog.title,
        content: blog.htmlContent ?? blog.content ?? "",
        keywords:
          (blog as any).targetKeywords ??
          (Array.isArray((blog as any).secondaryKeywords)
            ? (blog as any).secondaryKeywords.join(", ")
            : null),
        status: blog.status ?? "draft",
        createdAt: blog.createdAt?.toISOString() || new Date().toISOString(),
        publishedAt: blog.publishedAt?.toISOString() || null,
      }}
    />
  );
}
