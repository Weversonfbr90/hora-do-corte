import { PageHeader } from "@/components/app/page-header";
import { requireSession } from "@/server/session";
import { GestaoTabs } from "./tabs";

export default async function GestaoLayout({ children }: { children: React.ReactNode }) {
  await requireSession(["dono"]);
  return (
    <>
      <PageHeader title="Equipe e serviços" description="Cadastre serviços, libere barbeiros e defina horários." />
      <GestaoTabs />
      <div className="mt-6">{children}</div>
    </>
  );
}
