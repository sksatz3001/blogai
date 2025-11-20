import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { employees, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeeSettingsPage() {
  const session = await getEmployeeSession();
  if (!session) {
    redirect("/employee/login");
  }

  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, session.employeeId),
  });

  if (!employee || !employee.isActive) {
    redirect("/employee/login");
  }

  // Permission check
  let hasPermission = false;
  if (employee.roleId) {
    const rolePerms = await db
      .select({ permissionName: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, employee.roleId));

    hasPermission = rolePerms.some((p) => p.permissionName === "manage_settings");
  }

  if (!hasPermission) {
    redirect("/employee/dashboard?error=no_permission");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Manage your employee preferences</p>
        </div>

        <Card className="glass border-2 border-[hsl(var(--border))]">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-[hsl(var(--primary))]" />
              Coming soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[hsl(var(--muted-foreground))]">
              This page will allow you to manage your profile and notification preferences.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
