import { cookies } from "next/headers";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.EMPLOYEE_JWT_SECRET || "your-secret-key-change-this"
);

export interface EmployeeSession {
  employeeId: number;
  userId: number;
  username: string;
  roleId: number | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createEmployeeToken(
  session: EmployeeSession
): Promise<string> {
  const token = await new SignJWT({ ...(session as unknown as JWTPayload) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

export async function verifyEmployeeToken(
  token: string
): Promise<EmployeeSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const p = verified.payload as Record<string, unknown>;
    // Build a strongly-typed session object from payload
    const employeeId = typeof p.employeeId === "number" ? p.employeeId : Number(p.employeeId);
    const userId = typeof p.userId === "number" ? p.userId : Number(p.userId);
    const username = typeof p.username === "string" ? p.username : String(p.username || "");
    const roleIdRaw = p.roleId as unknown;
    const roleId = roleIdRaw === null || roleIdRaw === undefined ? null : Number(roleIdRaw as any);

    if (!employeeId || !userId || !username) {
      return null;
    }

    return { employeeId, userId, username, roleId };
  } catch (error) {
    return null;
  }
}

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) {
    return null;
  }

  return verifyEmployeeToken(token);
}

export async function setEmployeeSession(session: EmployeeSession) {
  const token = await createEmployeeToken(session);
  const cookieStore = await cookies();

  cookieStore.set("employee_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearEmployeeSession() {
  const cookieStore = await cookies();
  cookieStore.delete("employee_token");
}
