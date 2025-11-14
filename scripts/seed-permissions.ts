import { db } from "../db";
import { permissions } from "../db/schema";

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

async function seedPermissions() {
  try {
    console.log("Starting to seed permissions...");
    
    for (const perm of defaultPermissions) {
      const existing = await db.query.permissions.findFirst({
        where: (permissions, { eq }) => eq(permissions.name, perm.name),
      });

      if (!existing) {
        console.log(`Inserting permission: ${perm.name}`);
        await db.insert(permissions).values(perm);
      } else {
        console.log(`Permission already exists: ${perm.name}`);
      }
    }

    console.log("\n✅ Permissions seeded successfully!");
    
    // Verify by listing all permissions
    const allPerms = await db.query.permissions.findMany();
    console.log(`\nTotal permissions in database: ${allPerms.length}`);
    console.log("Permissions:", allPerms.map(p => p.name).join(", "));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    process.exit(1);
  }
}

seedPermissions();
