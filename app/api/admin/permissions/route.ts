import { NextResponse } from "next/server";
import { db } from "@/db";
import { permissions } from "@/db/schema";

// Seed default permissions (call this once)
export async function POST() {
  try {
    const defaultPermissions = [
      { name: "view_dashboard", description: "View dashboard and metrics", category: "dashboard" },
      { name: "view_blogs", description: "View all blogs", category: "blogs" },
      { name: "create_blog", description: "Create new blogs", category: "blogs" },
      { name: "edit_blog", description: "Edit blogs", category: "blogs" },
      { name: "delete_blog", description: "Delete blogs", category: "blogs" },
      { name: "view_analytics", description: "View analytics and reports", category: "analytics" },
      { name: "manage_settings", description: "Manage account settings", category: "settings" },
      { name: "manage_employees", description: "Manage employees and permissions", category: "settings" },
    ];

    // Insert permissions (ignore duplicates)
    for (const perm of defaultPermissions) {
      const existing = await db.query.permissions.findFirst({
        where: (permissions, { eq }) => eq(permissions.name, perm.name),
      });

      if (!existing) {
        await db.insert(permissions).values(perm);
      }
    }

    return NextResponse.json({ success: true, message: "Permissions seeded" });
  } catch (error) {
    console.error("Seed permissions error:", error);
    return NextResponse.json(
      { error: "Failed to seed permissions" },
      { status: 500 }
    );
  }
}

// Get all permissions
export async function GET() {
  try {
    const allPermissions = await db.query.permissions.findMany();
    return NextResponse.json({ permissions: allPermissions });
  } catch (error) {
    console.error("Get permissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
