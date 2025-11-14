import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { employees, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeeAnalyticsPage() {
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

    hasPermission = rolePerms.some((p) => p.permissionName === "view_analytics");
  }

  if (!hasPermission) {
    redirect("/employee/dashboard?error=no_permission");
  }

  return (
    <div className="min-h-screen bg-[#1E222A] p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#ECEFF4]">Analytics</h1>
          <p className="text-[#D8DEE9]/70 mt-2">Insights and performance metrics</p>
        </div>

        <Card className="glass border-2 border-[#3B4252]">
          <CardHeader>
            <CardTitle className="text-[#ECEFF4] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#88C0D0]" />
              Coming soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#D8DEE9]/70">
              This page will show your blog performance, SEO scores over time, and engagement stats.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
