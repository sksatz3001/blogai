import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { blogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import EmployeeBlogEditor from "@/components/employee-blog-editor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeBlogEditPage({ params }: PageProps) {
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
    <EmployeeBlogEditor
      blogId={blogId}
      employeeId={employee.id}
      employeeName={employee.fullName}
    />
  );
}
