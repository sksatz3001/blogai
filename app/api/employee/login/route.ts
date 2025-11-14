import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setEmployeeSession } from "@/lib/employee-auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find employee by username
    const employee = await db.query.employees.findFirst({
      where: eq(employees.username, username),
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if employee is active
    if (!employee.isActive) {
      return NextResponse.json(
        { error: "Account is inactive. Contact your administrator." },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, employee.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Update last login
    await db
      .update(employees)
      .set({ lastLogin: new Date() })
      .where(eq(employees.id, employee.id));

    // Create session
    await setEmployeeSession({
      employeeId: employee.id,
      userId: employee.userId,
      username: employee.username,
      roleId: employee.roleId,
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
        roleId: employee.roleId,
      },
    });
  } catch (error) {
    console.error("Employee login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
