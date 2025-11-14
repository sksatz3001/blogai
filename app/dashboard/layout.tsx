import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Suspense } from "react";

async function AuthCheck() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user completed onboarding
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  if (!dbUser || !dbUser.onboardingCompleted) {
    redirect("/onboarding");
  }

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E222A] via-[#2E3440] to-[#1E222A]">
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>
      <DashboardSidebar />
      <main className="pl-64">
        <div className="container mx-auto p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#434C5E] border-t-[#88C0D0]" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
