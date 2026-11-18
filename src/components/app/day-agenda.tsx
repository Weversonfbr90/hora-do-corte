"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, ChipGroup, Icon, Modal, TextField } from "@/components/ui";
import { formatDuration, formatPhone, formatPrice } from "@/lib/format";
import { minutesToTime } from "@/lib/time";
import { STATUS_LABEL, type Appointment } from "@/lib/types";
import { cancelar, marcarPresenca } from "@/server/actions/agendamentos";
import { EmptyState } from "./page-header";
import { statusTone } from "./status";

type Item = Appointment & { started: boolean };

interface DayAgendaProps {
  items: Item[];
  /** Painel do dono: mostra o barbeiro, o celular e permite cancelar. */
  ownerView?: boolean;
  barbers?: { id: string; name: string }[];
}

/**
 * Lista do dia em ordem de horário, com busca por cliente, filtro por barbeiro (dono)
 * e ações de concluído / falta / desfazer / cancelar.
 */
export function DayAgenda({ items, ownerView = false, barbers = [] }: DayAgendaProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [barberFilter, setBarberFilter] = useState("todos");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [toCancel, setToCancel] = useState<Item | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return items.filter(
      (a) => (barberFilter === "todos" || a.barberId === barberFilter) && (!q || a.clientName.toLocaleLowerCase("pt-BR").includes(q)),
    );
  }, [items, query, barberFilter]);

  const act = async (a: Item, status: "concluido" | "falta" | "agendado") => {
    setBusyId(a.id);
    const res = await marcarPresenca(a.id, status);
    setBusyId(null);
    const msg = status === "concluido" ? "marcado como concluído" : status === "falta" ? "marcado como falta" : "voltou para agendado";
    setFeedback(res.ok ? { tone: "success", text: `${a.clientName}: ${msg}.` } : { tone: "danger", text: res.error });
    router.refresh();
  };

  const doCancel = async () => {
    if (!toCancel) return;
    setBusyId(toCancel.id);
    const res = await cancelar(toCancel.id);
    setBusyId(null);
    setFeedback(res.ok ? { tone: "success", text: `Horário de ${toCancel.clientName} cancelado.` } : { tone: "danger", text: res.error });
    setToCancel(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {ownerView && barbers.length > 1 && (
        <ChipGroup
          label="Filtrar por barbeiro"
          layout="scroll"
          value={barberFilter}
          onChange={setBarberFilter}
          options={[{ value: "todos", label: "Todos" }, ...barbers.map((b) => ({ value: b.id, label: b.name.split(" ")[0]! }))]}
        />
      )}
      {items.length > 0 && (
        <TextField
          label="Buscar cliente"
          type="search"
          placeholder="Nome do cliente"
          leadingIcon={<Icon name="buscar" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      {feedback && <Alert tone={feedback.tone} title={feedback.text} live="polite" onDismiss={() => setFeedback(null)} />}

      {items.length === 0 ? (
        <EmptyState title="Nenhum atendimento neste dia">Os horários marcados aparecem aqui, em ordem.</EmptyState>
      ) : visible.length === 0 ? (
        <p className="rounded-md bg-surface-alt px-4 py-3 text-body text-fg-muted">Nenhum atendimento com esse filtro.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Atendimentos do dia">
          {visible.map((a) => {
            const cancelled = a.status === "cancelado";
            return (
              <li key={a.id}>
                <Card className={cancelled ? "flex flex-col gap-3 opacity-80" : "flex flex-col gap-3"}>
                  <div className="flex items-start gap-3">
                    <div className="w-16 shrink-0">
                      <p className="text-h3 tabular-nums">{minutesToTime(a.startMin)}</p>
                      <p className="text-helper text-fg-muted tabular-nums">até {minutesToTime(a.endMin)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cancelled ? "text-label text-fg-muted line-through" : "text-label"}>{a.clientName}</p>
                      <p className="text-helper text-fg-muted">
                        {a.serviceName} · {formatDuration(a.durationMin)}
                        {ownerView && <> · {a.barberName} · {formatPrice(a.priceCents)}</>}
                      </p>
                      {ownerView && a.clientPhone && <p className="text-helper text-fg-muted">{formatPhone(a.clientPhone)}{a.source === "telefone" && " · por telefone"}</p>}
                    </div>
                    <Badge tone={statusTone[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>

                  {!cancelled && (
                    <div className="flex flex-wrap gap-2">
                      {a.status === "agendado" ? (
                        a.started ? (
                          <>
                            <Button variant="primary" icon={<Icon name="confirmar" />} loading={busyId === a.id} onClick={() => act(a, "concluido")}>
                              Concluído
                            </Button>
                            <Button variant="secondary" disabled={busyId === a.id} onClick={() => act(a, "falta")}>
                              Faltou
                            </Button>
                          </>
                        ) : (
                          <p className="flex min-h-touch items-center text-helper text-fg-muted">Concluído/falta liberam no horário do atendimento.</p>
                        )
                      ) : (
                        <Button variant="secondary" loading={busyId === a.id} onClick={() => act(a, "agendado")}>
                          Desfazer
                        </Button>
                      )}
                      {ownerView && a.status === "agendado" && (
                        <Button variant="danger" disabled={busyId === a.id} onClick={() => setToCancel(a)}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={toCancel !== null}
        onClose={() => busyId === null && setToCancel(null)}
        title="Cancelar este horário?"
        description={toCancel ? `${toCancel.clientName} · ${toCancel.serviceName} às ${minutesToTime(toCancel.startMin)} com ${toCancel.barberName}. O horário fica livre.` : undefined}
        footer={
          <>
            <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setToCancel(null)} disabled={busyId !== null}>
              Manter
            </Button>
            <Button variant="danger" fullWidth className="sm:w-auto" onClick={doCancel} loading={busyId !== null}>
              Sim, cancelar
            </Button>
          </>
        }
      />
    </div>
  );
}
