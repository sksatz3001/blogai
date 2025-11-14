import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
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
  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
