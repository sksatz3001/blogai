import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isSuperAdmin } from "@/lib/superadmin-auth";

export async function GET() {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db.select().from(users).orderBy(users.createdAt);
  return NextResponse.json({ users: list });
}
