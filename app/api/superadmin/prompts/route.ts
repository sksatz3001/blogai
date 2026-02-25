import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemPrompts } from "@/db/schema";
import { isSuperAdmin } from "@/lib/superadmin-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prompts = await db.select().from(systemPrompts);
  return NextResponse.json({ prompts });
}

export async function PUT(request: Request) {
  const ok = await isSuperAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { key, prompt } = body;

  if (!key || !prompt) {
    return NextResponse.json({ error: "key and prompt are required" }, { status: 400 });
  }

  // Upsert: update if exists, insert if not
  const existing = await db.select().from(systemPrompts).where(eq(systemPrompts.key, key));

  if (existing.length > 0) {
    await db
      .update(systemPrompts)
      .set({ prompt, updatedAt: new Date() })
      .where(eq(systemPrompts.key, key));
  } else {
    const label = key === "blog_generation" ? "Blog Generation System Prompt" : "Image Enhancement System Prompt";
    await db.insert(systemPrompts).values({ key, label, prompt, updatedAt: new Date() });
  }

  return NextResponse.json({ ok: true });
}
