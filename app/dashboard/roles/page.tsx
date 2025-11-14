import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import RoleManagementClient from "@/components/role-management-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RolesPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  return <RoleManagementClient />;
}
