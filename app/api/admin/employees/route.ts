import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { employees, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/employee-auth";

// Create new employee
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { username, password, fullName, email, roleId } = await req.json();

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { error: "Username, password, and full name are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.username, username),
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create employee
    const [newEmployee] = await db
      .insert(employees)
      .values({
        userId: dbUser.id,
        username,
        password: hashedPassword,
        fullName,
        email,
        roleId: roleId || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      employee: {
        id: newEmployee.id,
        username: newEmployee.username,
        fullName: newEmployee.fullName,
        email: newEmployee.email,
        roleId: newEmployee.roleId,
        isActive: newEmployee.isActive,
      },
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

// Get all employees for the current user
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allEmployees = await db.query.employees.findMany({
      where: eq(employees.userId, dbUser.id),
      with: {
        role: true,
      },
    });

    // Don't send passwords
    const employeesData = allEmployees.map((emp) => ({
      id: emp.id,
      username: emp.username,
      fullName: emp.fullName,
      email: emp.email,
      roleId: emp.roleId,
      isActive: emp.isActive,
      lastLogin: emp.lastLogin,
      createdAt: emp.createdAt,
    }));

    return NextResponse.json({ employees: employeesData });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
