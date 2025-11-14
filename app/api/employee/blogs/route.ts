import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { blogs, employees, rolePermissions, permissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
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

    // Check view_blogs permission
    if (!employee.roleId) {
      return NextResponse.json({ error: "No role assigned" }, { status: 403 });
    }

    const rolePerms = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, employee.roleId));

    const hasPermission = rolePerms.some((p) => p.permissionName === "view_blogs");

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Permission denied - view_blogs required" },
        { status: 403 }
      );
    }

    // Get blogs created by this employee
    const employeeBlogs = await db.query.blogs.findMany({
      where: eq(blogs.employeeId, employee.id),
      orderBy: (blogs, { desc }) => [desc(blogs.createdAt)],
    });

    return NextResponse.json({ blogs: employeeBlogs });
  } catch (error) {
    console.error("Get employee blogs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
