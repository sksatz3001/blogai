import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in database
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  // If user completed onboarding, redirect to dashboard
  if (existingUser?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-foreground">Welcome to Blog AI!</h1>
          <p className="text-center text-muted-foreground mb-12">
            Let&apos;s set up your account to personalize your blog creation experience
          </p>
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
