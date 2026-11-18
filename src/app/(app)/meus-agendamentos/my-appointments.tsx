"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Avatar, Badge, Button, Card, Modal, Tabs } from "@/components/ui";
import { statusTone } from "@/components/app/status";
import { EmptyState } from "@/components/app/page-header";
import { formatDuration, formatPhone, formatPrice } from "@/lib/format";
import { formatDateShort, minutesToTime } from "@/lib/time";
import { STATUS_LABEL, type Appointment } from "@/lib/types";
import { cancelar } from "@/server/actions/agendamentos";

type Upcoming = Appointment & { canChange: boolean };

export function MyAppointments({ upcoming, history, shopPhone }: { upcoming: Upcoming[]; history: Appointment[]; shopPhone: string }) {
  const router = useRouter();
  const [tab, setTab] = useState(upcoming.length ? "proximos" : "historico");
  const [toCancel, setToCancel] = useState<Upcoming | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const doCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    const res = await cancelar(toCancel.id);
    setCancelling(false);
    setToCancel(null);
    setFeedback(res.ok ? { tone: "success", text: "Agendamento cancelado. O horário ficou livre." } : { tone: "danger", text: res.error });
    router.refresh();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {feedback && <Alert tone={feedback.tone} title={feedback.text} live="polite" onDismiss={() => setFeedback(null)} />}
      <Tabs
        label="Agendamentos"
        idPrefix="ag"
        current={tab}
        onChange={setTab}
        tabs={[
          { id: "proximos", label: `Próximos (${upcoming.length})` },
          { id: "historico", label: `Histórico (${history.length})` },
        ]}
      />

      <div id={`ag-panel-${tab}`} role="tabpanel" aria-labelledby={`ag-tab-${tab}`} className="flex flex-col gap-3">
        {tab === "proximos" ? (
          upcoming.length === 0 ? (
            <EmptyState title="Nenhum horário marcado">
              <Link href="/agendar" className="font-semibold text-accent-strong underline">Agendar um horário</Link>
            </EmptyState>
          ) : (
            upcoming.map((a) => (
              <Card key={a.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={a.barberName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-h3 first-letter:uppercase">
                      {formatDateShort(a.date)} · <span className="tabular-nums">{minutesToTime(a.startMin)}</span>
                    </p>
                    <p className="text-body text-fg-muted">
                      {a.serviceName} com {a.barberName} · {formatDuration(a.durationMin)} · {formatPrice(a.priceCents)}
                    </p>
                  </div>
                </div>
                {a.canChange ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/meus-agendamentos/${a.id}/remarcar`}
                      className="inline-flex min-h-touch items-center justify-center rounded-lg border border-border-strong bg-surface px-5 font-semibold hover:bg-surface-alt focus-visible:focus-ring"
                    >
                      Remarcar
                    </Link>
                    <Button variant="danger" onClick={() => setToCancel(a)}>Cancelar</Button>
                  </div>
                ) : (
                  <p className="rounded-md bg-warning-soft px-3 py-2 text-helper text-warning">
                    Faltam menos de 2 horas: para mudar, fale com a barbearia{shopPhone ? ` pelo ${formatPhone(shopPhone)}` : ""}.
                  </p>
                )}
              </Card>
            ))
          )
        ) : history.length === 0 ? (
          <EmptyState title="Sem histórico ainda" />
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((a) => (
              <li key={a.id}>
                <Card className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={a.status === "cancelado" ? "text-label text-fg-muted line-through" : "text-label"}>
                      {formatDateShort(a.date)} · {minutesToTime(a.startMin)}
                    </p>
                    <p className="truncate text-helper text-fg-muted">
                      {a.serviceName} com {a.barberName} · {formatPrice(a.priceCents)}
                    </p>
                  </div>
                  <Badge tone={statusTone[a.status]}>{a.status === "agendado" ? "Realizado" : STATUS_LABEL[a.status]}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={toCancel !== null}
        onClose={() => !cancelling && setToCancel(null)}
        title="Cancelar este horário?"
        description={toCancel ? `${toCancel.serviceName} com ${toCancel.barberName}, ${formatDateShort(toCancel.date)} às ${minutesToTime(toCancel.startMin)}. O horário fica livre para outras pessoas.` : undefined}
        footer={
          <>
            <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setToCancel(null)} disabled={cancelling}>
              Manter horário
            </Button>
            <Button variant="danger" fullWidth className="sm:w-auto" onClick={doCancel} loading={cancelling}>
              Sim, cancelar
            </Button>
          </>
        }
      />
    </div>
  );
}
