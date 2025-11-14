import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { employees, roles, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getEmployeeSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get employee details
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { error: "Employee not found or inactive" },
        { status: 403 }
      );
    }

    // Get role and permissions
    let employeePermissions: string[] = [];

    if (employee.roleId) {
      const rolePerms = await db
        .select({
          permissionName: permissions.name,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, employee.roleId));

      employeePermissions = rolePerms.map((p) => p.permissionName);
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
        email: employee.email,
        roleId: employee.roleId,
      },
      permissions: employeePermissions,
    });
  } catch (error) {
    console.error("Employee verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
