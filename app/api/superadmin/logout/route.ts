import { clearSuperAdminCookie } from "@/lib/superadmin-auth";

export async function POST() {
  return clearSuperAdminCookie();
}
