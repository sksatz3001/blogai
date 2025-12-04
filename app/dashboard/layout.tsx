import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Suspense } from "react";
import { CreditsProvider } from "@/lib/credits-context";

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
    <CreditsProvider>
      <div className="min-h-screen">
        <Suspense fallback={null}>
          <AuthCheck />
        </Suspense>
        <DashboardSidebar />
        <main className="pl-64">
          <div className="container mx-auto p-8">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </CreditsProvider>
  );
}
