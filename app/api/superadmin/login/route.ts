import { NextResponse } from "next/server";
import { setSuperAdminCookie, verifyCredentials } from "@/lib/superadmin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!verifyCredentials(String(username || ""), String(password || ""))) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    // Set cookie and return ok
    return setSuperAdminCookie();
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
