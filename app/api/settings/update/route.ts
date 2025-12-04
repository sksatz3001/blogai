import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

      const body = await req.json();
      const { authorName, companyName, companyWebsite, companyDescription } = body;

      // Update user settings
      await db
        .update(users)
        .set({
          authorName,
          companyName,
          companyWebsite,
          companyDescription,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, user.id));    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
