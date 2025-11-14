import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { blogs, employees, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employee and verify permission
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
    }

    // Check create_blog permission
    if (!employee.roleId) {
      return NextResponse.json({ error: "No role assigned" }, { status: 403 });
    }

    const rolePerms = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, employee.roleId));

    const hasPermission = rolePerms.some((p) => p.permissionName === "create_blog");

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Permission denied - create_blog required" },
        { status: 403 }
      );
    }

  const { title, primaryKeyword, secondaryKeywords } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create blog entry (empty content, will be generated via streaming)
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const [newBlog] = await db
      .insert(blogs)
      .values({
        userId: employee.userId,
        employeeId: employee.id,
        title,
        primaryKeyword: primaryKeyword || title,
        secondaryKeywords: Array.isArray(secondaryKeywords) ? secondaryKeywords : [],
        slug,
        content: "",
        htmlContent: "",
        status: "draft",
      })
      .returning();

    return NextResponse.json({
      success: true,
      blogId: newBlog.id,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}
