import { db } from "@/db";
import { users, creditTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Credit costs
export const CREDIT_COSTS = {
  BLOG_GENERATION: 10,
  IMAGE_GENERATION: 1,
  IMAGE_EDIT: 2,
} as const;

export type CreditType = 'blog_generation' | 'image_generation' | 'image_edit' | 'admin_add' | 'admin_deduct';

interface DeductCreditsParams {
  userId: number;
  amount: number;
  type: CreditType;
  description: string;
  metadata?: {
    blogId?: number;
    blogTitle?: string;
    imageId?: number;
    imagePrompt?: string;
    adminNote?: string;
  };
}

interface AddCreditsParams {
  userId: number;
  amount: number;
  description: string;
  adminNote?: string;
}

/**
 * Deduct credits from a user's balance
 * Returns true if successful, false if insufficient credits
 */
export async function deductCredits({
  userId,
  amount,
  type,
  description,
  metadata,
}: DeductCreditsParams): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current balance
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, newBalance: 0, error: "User not found" };
    }

    const currentCredits = user.credits || 0;

    if (currentCredits < amount) {
      return { 
        success: false, 
        newBalance: currentCredits, 
        error: "Insufficient credits" 
      };
    }

    const newBalance = currentCredits - amount;

    // Update user credits
    await db
      .update(users)
      .set({
        credits: newBalance,
        totalCreditsUsed: sql`COALESCE(${users.totalCreditsUsed}, 0) + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Record transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: -amount, // Negative for deductions
      balanceAfter: newBalance,
      type,
      description,
      metadata,
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error("Deduct credits error:", error);
    return { success: false, newBalance: 0, error: "Failed to deduct credits" };
  }
}

/**
 * Add credits to a user's balance (admin function)
 * Amount can be positive (add) or negative (deduct)
 */
export async function addCredits({
  userId,
  amount,
  description,
  adminNote,
}: AddCreditsParams): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current balance
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, newBalance: 0, error: "User not found" };
    }

    const currentCredits = user.credits || 0;
    const newBalance = currentCredits + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      return { success: false, newBalance: currentCredits, error: "Insufficient credits to deduct" };
    }

    const transactionType = amount >= 0 ? 'admin_add' : 'admin_deduct';

    // Update user credits
    await db
      .update(users)
      .set({
        credits: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Record transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: amount,
      balanceAfter: newBalance,
      type: transactionType,
      description,
      metadata: { adminNote },
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error("Add credits error:", error);
    return { success: false, newBalance: 0, error: "Failed to add credits" };
  }
}

/**
 * Check if user has enough credits
 */
export async function checkCredits(userId: number, requiredAmount: number): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return false;
  return (user.credits || 0) >= requiredAmount;
}

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: number): Promise<number> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.credits || 0;
}
