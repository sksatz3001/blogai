import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsClient } from "@/components/settings-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const profiles = await db.query.companyProfiles.findMany({
    where: eq(companyProfiles.userId, dbUser.id),
  });

  return (
    <SettingsClient 
      user={{
        email: dbUser.email,
        authorName: dbUser.authorName || "",
        companyName: dbUser.companyName || "",
        companyWebsite: dbUser.companyWebsite || "",
        companyDescription: dbUser.companyDescription || "",
      }}
      companyProfiles={profiles.map(p => ({
        id: p.id,
        companyName: p.companyName,
        companyWebsite: p.companyWebsite,
        description: p.description,
      }))}
    />
  );
}
