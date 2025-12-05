import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, companyWebsite, authorName } = body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({
          companyName,
          companyWebsite,
          authorName,
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    } else {
      // Create new user with 0 credits
      await db.insert(users).values({
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        companyName,
        companyWebsite,
        authorName,
        credits: 0,
        totalCreditsUsed: 0,
        onboardingCompleted: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
