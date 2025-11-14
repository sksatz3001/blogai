import { NextResponse } from "next/server";
import { clearEmployeeSession } from "@/lib/employee-auth";

export async function POST() {
  try {
    await clearEmployeeSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
