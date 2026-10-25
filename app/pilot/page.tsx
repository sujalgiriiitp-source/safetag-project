import { redirect } from "next/navigation";
import { getCurrentSession, isPlatformAdmin } from "@/lib/session";
import { PilotWorkspace } from "@/components/pilot/workspace";
export const dynamic = "force-dynamic";
export default async function PilotPage() {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  if (isPlatformAdmin(session)) redirect("/pilot/platform");
  return <PilotWorkspace />;
}
