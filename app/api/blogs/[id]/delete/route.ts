import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }

    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, parseInt(id)),
    });

    if (!blog || blog.userId !== dbUser.id) {
      return new Response("Blog not found", { status: 404 });
    }

    // Delete blog (cascade will delete associated images)
    await db.delete(blogs).where(eq(blogs.id, blog.id));

    // Revalidate the blogs page and dashboard to reflect changes
    revalidatePath("/dashboard/blogs");
    revalidatePath("/dashboard");

    return Response.json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Blog deletion error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
