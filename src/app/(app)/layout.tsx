import { AppShell } from "@/components/app/app-shell";
import { getSettings } from "@/server/data";
import { requireSession } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const settings = await getSettings();
  return (
    <AppShell role={session.role} isBarber={session.isBarber} userName={session.name} shopName={settings.name}>
      {children}
    </AppShell>
  );
}
