import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, creditTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { addCredits } from "@/lib/credits";
import { isSuperAdmin } from "@/lib/superadmin-auth";

// GET - List all users with their credits
export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        authorName: users.authorName,
        credits: users.credits,
        totalCreditsUsed: users.totalCreditsUsed,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get credit summary for each user
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const recentTransactions = await db
          .select()
          .from(creditTransactions)
          .where(eq(creditTransactions.userId, user.id))
          .orderBy(desc(creditTransactions.createdAt))
          .limit(5);

        return {
          ...user,
          credits: user.credits || 0,
          totalCreditsUsed: user.totalCreditsUsed || 0,
          recentTransactions,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Super admin credits GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Add credits to a user
export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, amount, note } = await request.json();

    if (!userId || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "userId and amount are required" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json(
        { error: "Amount must be a non-zero number" },
        { status: 400 }
      );
    }

    // Get user info for description
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await addCredits({
      userId,
      amount: numAmount,
      description: numAmount > 0 
        ? `Admin added ${numAmount} credits` 
        : `Admin deducted ${Math.abs(numAmount)} credits`,
      adminNote: note || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update credits" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      message: numAmount > 0 
        ? `Added ${numAmount} credits to ${user.email}` 
        : `Deducted ${Math.abs(numAmount)} credits from ${user.email}`,
    });
  } catch (error) {
    console.error("Super admin credits POST error:", error);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 }
    );
  }
}
