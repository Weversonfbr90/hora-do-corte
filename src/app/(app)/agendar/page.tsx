import type { Metadata } from "next";
import { BookingFlow } from "@/components/app/booking-flow";
import { PageHeader } from "@/components/app/page-header";
import { firstName } from "@/lib/format";
import { zonedNow } from "@/lib/time";
import { getSettings, listBarbers, listServices } from "@/server/data";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Agendar · Hora do corte" };

export default async function AgendarPage() {
  const session = await requireSession();
  const [services, barbers, settings] = await Promise.all([
    listServices({ activeOnly: true }),
    listBarbers({ activeOnly: true }),
    getSettings(),
  ]);
  return (
    <>
      <PageHeader title="Agendar horário" description={`Olá, ${firstName(session.name)}! Escolha o serviço, o barbeiro e o horário.`} />
      <BookingFlow
        mode="cliente"
        services={services}
        barbers={barbers.map(({ id, name, schedule, daysOff }) => ({ id, name, schedule, daysOff }))}
        today={zonedNow().date}
        address={settings.address}
      />
    </>
  );
}
