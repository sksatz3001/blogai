import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { blogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const blogId = parseInt(params.id);

    // Get employee
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
    }

    // Get blog - ensure it belongs to this employee
    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.employeeId, employee.id)),
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Get blog error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const blogId = parseInt(params.id);

    // Get employee
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
    }

    // Verify blog ownership
    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.employeeId, employee.id)),
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

  const { content, htmlContent, title, status, publishedAt } = await req.json();

    // Update blog
    await db
      .update(blogs)
      .set({
        ...(content !== undefined && { content }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(publishedAt !== undefined && { publishedAt }),
      })
      .where(eq(blogs.id, blogId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}
