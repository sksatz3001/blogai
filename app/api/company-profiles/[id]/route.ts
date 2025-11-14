import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, companyProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const profileId = parseInt(id);

    // Delete the profile (only if it belongs to the user)
    await db
      .delete(companyProfiles)
      .where(
        and(
          eq(companyProfiles.id, profileId),
          eq(companyProfiles.userId, dbUser.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company profile deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete company profile" },
      { status: 500 }
    );
  }
}
