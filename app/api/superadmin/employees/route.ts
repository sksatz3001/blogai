import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { isSuperAdmin } from "@/lib/superadmin-auth";

export async function GET() {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db.select().from(employees).orderBy(employees.createdAt);
  return NextResponse.json({ employees: list });
}
