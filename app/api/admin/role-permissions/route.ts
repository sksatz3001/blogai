import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { rolePermissions, roles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get database user
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUser.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all role permissions for user's roles
    const allRolePermissions = await db
      .select()
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .where(eq(roles.userId, dbUser.id));

    return NextResponse.json({
      rolePermissions: allRolePermissions.map((rp) => ({
        roleId: rp.role_permissions.roleId,
        permissionId: rp.role_permissions.permissionId,
      })),
    });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch role permissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get database user
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUser.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { roleId, permissionIds } = await req.json();

    if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "roleId and permissionIds array are required" },
        { status: 400 }
      );
    }

    // Verify the role belongs to the user
    const role = await db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.userId, dbUser.id)),
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete existing permissions for this role
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Insert new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permissionId: number) => ({
        roleId,
        permissionId,
      }));

      await db.insert(rolePermissions).values(values);
    }

    return NextResponse.json({
      success: true,
      message: "Permissions assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning permissions:", error);
    return NextResponse.json(
      { error: "Failed to assign permissions" },
      { status: 500 }
    );
  }
}
