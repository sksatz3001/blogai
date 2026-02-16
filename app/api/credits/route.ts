import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, creditTransactions } from "@/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { CREDIT_COSTS } from "@/lib/credits";

// GET - Fetch user credits and summary
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, dbUser.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(50);

    // Calculate usage breakdown
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageStats = await db
      .select({
        type: creditTransactions.type,
        totalAmount: sql<number>`SUM(ABS(${creditTransactions.amount}))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, dbUser.id),
          sql`${creditTransactions.amount} < 0`,
          gte(creditTransactions.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(creditTransactions.type);

    // Calculate daily usage for graph (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailyUsage = await db
      .select({
        date: sql<string>`DATE(${creditTransactions.createdAt})`,
        totalUsed: sql<number>`SUM(ABS(${creditTransactions.amount}))`,
      })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, dbUser.id),
          sql`${creditTransactions.amount} < 0`,
          gte(creditTransactions.createdAt, fourteenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${creditTransactions.createdAt})`)
      .orderBy(sql`DATE(${creditTransactions.createdAt})`);

    return NextResponse.json({
      credits: dbUser.credits || 0,
      totalCreditsUsed: dbUser.totalCreditsUsed || 0,
      userName: dbUser.authorName || dbUser.companyName || dbUser.email.split("@")[0],
      companyName: dbUser.companyName,
      transactions: recentTransactions,
      usageStats,
      dailyUsage,
      creditCosts: CREDIT_COSTS,
    });
  } catch (error) {
    console.error("Credits GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
