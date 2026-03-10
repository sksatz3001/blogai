import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import EmployeeManagementClient from "@/components/employee-management-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployeeManagementPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  return <EmployeeManagementClient />;
}
