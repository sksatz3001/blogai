import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const profiles = await db.query.companyProfiles.findMany({
      where: eq(companyProfiles.userId, dbUser.id),
      columns: {
        id: true,
        companyName: true,
        companyWebsite: true,
      },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Company profiles fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profiles" },
      { status: 500 }
    );
  }
}
