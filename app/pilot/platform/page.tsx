import { redirect } from "next/navigation";
import { getCurrentSession, isPlatformAdmin } from "@/lib/session";
import { PilotPlatform } from "@/components/pilot/platform";
export const dynamic = "force-dynamic";
export default async function PlatformPage() {
  if (!isPlatformAdmin(await getCurrentSession())) redirect("/login");
  return <PilotPlatform />;
}
