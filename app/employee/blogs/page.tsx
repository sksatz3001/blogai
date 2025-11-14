import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { employees, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import EmployeeBlogsClient from "@/components/employee-blogs-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeeBlogsPage() {
  const session = await getEmployeeSession();

  if (!session) {
    redirect("/employee/login");
  }

  // Get employee details
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, session.employeeId),
    with: {
      role: true,
    },
  });

  if (!employee || !employee.isActive) {
    redirect("/employee/login");
  }

  // Check if employee has view_blogs permission
  let hasPermission = false;
  if (employee.roleId) {
    const rolePerms = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, employee.roleId));

    hasPermission = rolePerms.some((p) => p.permissionName === "view_blogs");
  }

  if (!hasPermission) {
    redirect("/employee/dashboard?error=no_permission");
  }

  return (
    <EmployeeBlogsClient
      employee={{
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
      }}
    />
  );
}
