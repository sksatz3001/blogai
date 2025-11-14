import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { employees, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkEmployeePermission(
  permissionName: string
): Promise<boolean> {
  const session = await getEmployeeSession();

  if (!session) {
    return false;
  }

  // Get employee
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, session.employeeId),
  });

  if (!employee || !employee.isActive) {
    return false;
  }

  // If no role, no permissions
  if (!employee.roleId) {
    return false;
  }

  // Check if role has the permission
  const rolePerms = await db
    .select({ permissionName: permissions.name })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, employee.roleId));

  return rolePerms.some((p) => p.permissionName === permissionName);
}

export async function getEmployeePermissions(): Promise<string[]> {
  const session = await getEmployeeSession();

  if (!session) {
    return [];
  }

  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, session.employeeId),
  });

  if (!employee || !employee.isActive || !employee.roleId) {
    return [];
  }

  const rolePerms = await db
    .select({ permissionName: permissions.name })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, employee.roleId));

  return rolePerms.map((p) => p.permissionName);
}
