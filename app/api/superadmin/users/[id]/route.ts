import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, blogs, employees, companyProfiles, roles, creditTransactions } from "@/db/schema";
import { isSuperAdmin } from "@/lib/superadmin-auth";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: pid } = await params;
  const id = Number(pid);
  const row = await db.select().from(users).where(eq(users.id, id));
  return NextResponse.json({ user: row[0] || null });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: pid } = await params;
  const id = Number(pid);
  const body = await req.json();
  await db.update(users).set(body).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: pid } = await params;
  const id = Number(pid);
  
  try {
    // Delete in correct order due to foreign key constraints (no transactions in neon-http)
    // Delete credit transactions
    await db.delete(creditTransactions).where(eq(creditTransactions.userId, id));
    // Delete blogs (this will cascade to blogImages due to onDelete: 'cascade')
    await db.delete(blogs).where(eq(blogs.userId, id));
    // Delete employees
    await db.delete(employees).where(eq(employees.userId, id));
    // Delete roles
    await db.delete(roles).where(eq(roles.userId, id));
    // Delete company profiles
    await db.delete(companyProfiles).where(eq(companyProfiles.userId, id));
    // Finally delete user
    await db.delete(users).where(eq(users.id, id));
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
