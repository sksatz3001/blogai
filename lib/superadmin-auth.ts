import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPERADMIN_USERNAME = "superadmin";
const SUPERADMIN_PASSWORD = "Edysor@123";
const COOKIE_NAME = "sauth";
const COOKIE_VALUE = "superadmin-ok";

export function verifyCredentials(username: string, password: string) {
  return username === SUPERADMIN_USERNAME && password === SUPERADMIN_PASSWORD;
}

export async function isSuperAdmin() {
  const c = await cookies();
  const v = c.get(COOKIE_NAME)?.value;
  return v === COOKIE_VALUE;
}

export function setSuperAdminCookie() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // In dev we can skip secure; adjust automatically
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
  });
  return res;
}

export function clearSuperAdminCookie() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res;
}
