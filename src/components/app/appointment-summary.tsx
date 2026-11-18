import { Avatar, Badge, Card, Icon } from "@/components/ui";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatDateLong, minutesToTime } from "@/lib/time";
import type { Appointment } from "@/lib/types";

/** US-10 — Resumo do agendamento: serviço, barbeiro, data, horário e preço. */
export function AppointmentSummary({ appt, address, title = "Seu horário" }: { appt: Appointment; address?: string; title?: string }) {
  return (
    <Card tone="inverse" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-overline uppercase text-accent">{title}</span>
        <Badge tone="success">Confirmado</Badge>
      </div>
      <div>
        <p className="text-h2 first-letter:uppercase">{formatDateLong(appt.date)}</p>
        <p className="text-display tabular-nums">{minutesToTime(appt.startMin)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
        <dt className="text-creme-200">Serviço</dt>
        <dd className="font-semibold">
          {appt.serviceName} <span className="font-normal text-creme-200">· {formatDuration(appt.durationMin)}</span>
        </dd>
        <dt className="text-creme-200">Barbeiro</dt>
        <dd className="flex items-center gap-2 font-semibold">
          <Avatar name={appt.barberName} size="sm" />
          {appt.barberName}
        </dd>
        <dt className="text-creme-200">Preço</dt>
        <dd className="font-semibold">{formatPrice(appt.priceCents)}</dd>
      </dl>
      {address && (
        <p className="flex items-start gap-2 text-helper text-creme-200">
          <Icon name="local" className="mt-0.5 shrink-0" /> {address}
        </p>
      )}
      <p className="text-helper text-creme-200">Pagamento na barbearia. Dá para cancelar ou remarcar até 2 horas antes.</p>
    </Card>
  );
}
