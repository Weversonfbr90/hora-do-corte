import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { canClientChange } from "@/lib/time";
import { getSettings, listClientAppointments } from "@/server/data";
import { requireSession } from "@/server/session";
import { MyAppointments } from "./my-appointments";

export const metadata: Metadata = { title: "Meus agendamentos · Hora do corte" };

export default async function MeusAgendamentosPage() {
  const session = await requireSession();
  const [all, settings] = await Promise.all([listClientAppointments(session.uid), getSettings()]);
  const now = new Date();

  // Próximos: agendados que ainda não terminaram. Histórico: o resto, do mais recente ao mais antigo.
  const isUpcoming = (a: (typeof all)[number]) =>
    a.status === "agendado" && new Date(a.startAt).getTime() + a.durationMin * 60_000 > now.getTime();
  const upcoming = all.filter(isUpcoming).map((a) => ({ ...a, canChange: canClientChange(new Date(a.startAt), now) }));
  const history = all.filter((a) => !isUpcoming(a)).reverse();

  return (
    <>
      <PageHeader title="Meus agendamentos" description="Seus próximos cortes e o histórico." />
      {all.length === 0 ? (
        <EmptyState
          title="Você ainda não tem agendamentos"
          action={
            <Link href="/agendar" className="inline-flex min-h-touch items-center rounded-lg bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover focus-visible:focus-ring">
              Agendar agora
            </Link>
          }
        >
          Quando marcar um horário, ele aparece aqui.
        </EmptyState>
      ) : (
        <MyAppointments upcoming={upcoming} history={history} shopPhone={settings.phone} />
      )}
    </>
  );
}
