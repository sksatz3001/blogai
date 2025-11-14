import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import EmployeeDashboardClient from "@/components/employee-dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeeDashboardPage() {
  const session = await getEmployeeSession();

  if (!session) {
    redirect("/employee/login");
  }

  // Get employee details
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, session.employeeId),
  });

  if (!employee || !employee.isActive) {
    redirect("/employee/login");
  }

  return (
    <EmployeeDashboardClient
      employee={{
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
        email: employee.email,
      }}
    />
  );
}
