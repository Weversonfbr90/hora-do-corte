"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Button,
  ChipGroup,
  Icon,
  SelectableCard,
  TextField,
  TimeSlotGrid,
  type ChipOption,
} from "@/components/ui";
import { bookingDays } from "@/lib/agenda";
import { formatDuration, formatPhone, formatPrice } from "@/lib/format";
import { formatDateShort, minutesToTime, weekdayShort } from "@/lib/time";
import type { Appointment, Barber, Service } from "@/lib/types";
import { fieldErrors, phoneBookingSchema } from "@/lib/validation";
import { agendar, agendarPorTelefone, buscarHorarios, remarcar } from "@/server/actions/agendamentos";
import { AppointmentSummary } from "./appointment-summary";
import { EmptyState } from "./page-header";

type Mode = "cliente" | "telefone" | "remarcar";

export interface BookingFlowProps {
  mode: Mode;
  services: Service[];
  barbers: Pick<Barber, "id" | "name" | "schedule" | "daysOff">[];
  today: string;
  address?: string;
  /** Remarcar: agendamento atual (serviço fixo). */
  current?: Appointment;
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function Step({ n, title, children, id }: { n: number; title: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="flex items-center gap-2 text-h3">
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-primary text-helper font-bold text-on-primary">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BookingFlow({ mode, services, barbers, today, address, current }: BookingFlowProps) {
  const [query, setQuery] = useState("");
  const [serviceId, setServiceId] = useState<string | null>(current?.serviceId ?? null);
  const [barberId, setBarberId] = useState<string | null>(current?.barberId ?? (barbers.length === 1 ? barbers[0]!.id : null));
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<number[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [client, setClient] = useState({ name: "", phone: "" });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Appointment | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;

  const filteredServices = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return q ? services.filter((s) => s.name.toLocaleLowerCase("pt-BR").includes(q)) : services;
  }, [query, services]);

  const days = useMemo(() => (barber ? bookingDays(barber, today) : []), [barber, today]);
  const dayOptions: ChipOption[] = days.map((d) => ({
    value: d.date,
    sublabel: d.date === today ? "Hoje" : weekdayShort(d.date),
    label: String(Number(d.date.slice(8))),
    disabled: !d.works,
  }));

  // Ao trocar de barbeiro, escolhe o primeiro dia em que ele trabalha.
  useEffect(() => {
    if (!barber) return setDate(null);
    setDate((prev) => {
      if (prev && days.some((d) => d.date === prev && d.works)) return prev;
      return days.find((d) => d.works)?.date ?? null;
    });
  }, [barber, days]);

  // Busca os horários livres (descarta respostas antigas se a pessoa trocar rápido).
  useEffect(() => {
    setStartMin(null);
    if (!serviceId || !barberId || !date) {
      setSlots(null);
      return;
    }
    const id = ++requestId.current;
    setLoadingSlots(true);
    setSlotsError(null);
    buscarHorarios({ serviceId, barberId, date, ignoreAppointmentId: current?.id }).then((res) => {
      if (id !== requestId.current) return;
      setLoadingSlots(false);
      if (res.ok) setSlots(res.data);
      else {
        setSlots([]);
        setSlotsError(res.error);
      }
    });
  }, [serviceId, barberId, date, current?.id, reloadKey]);

  const confirm = async () => {
    if (!service || !barber || !date || startMin == null) return;
    setError(null);
    if (mode === "telefone") {
      const check = phoneBookingSchema.safeParse({ ...client, clientName: client.name, clientPhone: client.phone, serviceId: service.id, barberId: barber.id, date, startMin });
      if (!check.success) {
        const fe = fieldErrors(check.error);
        setClientErrors({ name: fe.clientName ?? "", phone: fe.clientPhone ?? "" });
        if (fe.clientName || fe.clientPhone) return;
      }
      setClientErrors({});
    }
    setSubmitting(true);
    const res =
      mode === "remarcar" && current
        ? await remarcar(current.id, { barberId: barber.id, date, startMin })
        : mode === "telefone"
          ? await agendarPorTelefone({ serviceId: service.id, barberId: barber.id, date, startMin, clientName: client.name, clientPhone: client.phone })
          : await agendar({ serviceId: service.id, barberId: barber.id, date, startMin });
    setSubmitting(false);
    if (res.ok) {
      setDone(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error);
      // Horário pode ter sido ocupado por outra pessoa: atualiza a grade.
      setReloadKey((k) => k + 1);
    }
  };

  /* ---------- Resumo final ---------- */
  if (done) {
    return (
      <div className="flex max-w-xl flex-col gap-5">
        <Alert tone="success" live="polite" title={mode === "remarcar" ? "Horário remarcado!" : mode === "telefone" ? "Agendamento criado!" : "Horário confirmado!"}>
          {mode === "telefone" ? `${done.clientName} já está na agenda de ${done.barberName}.` : "Ele já está na agenda do barbeiro."}
        </Alert>
        <AppointmentSummary appt={done} address={address} title={mode === "telefone" ? done.clientName : "Seu horário"} />
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode === "telefone" ? (
            <>
              <Link href="/painel" className="inline-flex min-h-touch items-center justify-center rounded-lg bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover focus-visible:focus-ring">
                Voltar ao painel
              </Link>
              <Button variant="secondary" onClick={() => window.location.reload()}>Agendar outra pessoa</Button>
            </>
          ) : (
            <>
              <Link href="/meus-agendamentos" className="inline-flex min-h-touch items-center justify-center rounded-lg bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover focus-visible:focus-ring">
                Ver meus agendamentos
              </Link>
              {mode === "cliente" && <Button variant="secondary" onClick={() => window.location.reload()}>Agendar outro horário</Button>}
            </>
          )}
        </div>
      </div>
    );
  }

  if (services.length === 0 || barbers.length === 0) {
    return (
      <EmptyState title="Agenda ainda em preparação">
        {services.length === 0 ? "A barbearia ainda não cadastrou os serviços." : "Nenhum barbeiro está atendendo pelo app no momento."} Tente mais tarde ou fale com a barbearia.
      </EmptyState>
    );
  }

  const month = date ? MONTHS[Number(date.slice(5, 7)) - 1] : null;
  const ready = Boolean(service && barber && date && startMin != null);
  let n = 0;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* 1. Serviço */}
      {mode === "remarcar" && current ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-helper text-fg-muted">Horário atual</p>
          <p className="text-label">
            {current.serviceName} com {current.barberName} · {formatDateShort(current.date)} às {minutesToTime(current.startMin)}
          </p>
          <p className="mt-1 text-helper text-fg-muted">Ele só é liberado quando o novo horário for confirmado.</p>
        </div>
      ) : (
        <Step n={++n} title="Serviço" id="passo-servico">
          {services.length > 3 && (
            <TextField
              label="Buscar serviço"
              type="search"
              placeholder="Ex.: barba"
              leadingIcon={<Icon name="buscar" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          {filteredServices.length === 0 ? (
            <p className="rounded-md bg-surface-alt px-4 py-3 text-body text-fg-muted">Nenhum serviço com “{query}”.</p>
          ) : (
            <div role="radiogroup" aria-label="Serviço" className="flex flex-col gap-2">
              {filteredServices.map((s) => (
                <SelectableCard
                  key={s.id}
                  title={s.name}
                  description={formatDuration(s.durationMin)}
                  meta={formatPrice(s.priceCents)}
                  selected={serviceId === s.id}
                  onSelect={() => setServiceId(s.id)}
                />
              ))}
            </div>
          )}
        </Step>
      )}

      {/* 2. Barbeiro */}
      <Step n={++n} title="Barbeiro" id="passo-barbeiro">
        <div role="radiogroup" aria-label="Barbeiro" className="flex flex-col gap-2">
          {barbers.map((b) => (
            <SelectableCard key={b.id} title={b.name} leading={<Avatar name={b.name} />} selected={barberId === b.id} onSelect={() => setBarberId(b.id)} />
          ))}
        </div>
      </Step>

      {/* 3. Dia */}
      <Step n={++n} title="Dia" id="passo-dia">
        {!barber ? (
          <p className="text-body text-fg-muted">Escolha o barbeiro para ver os dias.</p>
        ) : days.every((d) => !d.works) ? (
          <p className="text-body text-fg-muted">{barber.name} não tem dias de atendimento nos próximos 30 dias.</p>
        ) : (
          <>
            {month && <p className="-mt-1 text-label capitalize text-fg-muted">{month}</p>}
            <ChipGroup label="Dia do atendimento" options={dayOptions} value={date} onChange={setDate} layout="scroll" />
          </>
        )}
      </Step>

      {/* 4. Horário */}
      <Step n={++n} title="Horário" id="passo-horario">
        {!service || !barber || !date ? (
          <p className="text-body text-fg-muted">
            {!service ? "Escolha o serviço" : !barber ? "Escolha o barbeiro" : "Escolha o dia"} para ver os horários livres.
          </p>
        ) : slotsError ? (
          <Alert tone="danger" title={slotsError} action={<Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>Tentar de novo</Button>} />
        ) : (
          <>
            <p className="-mt-1 text-helper text-fg-muted">
              Horários livres para {service.name.toLowerCase()} ({formatDuration(service.durationMin)}) em {formatDateShort(date)}.
            </p>
            {slots && slots.length === 0 && !loadingSlots ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-surface px-4 py-6 text-center">
                <p className="text-label">Nenhum horário livre neste dia</p>
                <p className="mt-1 text-helper text-fg-muted">Escolha outro dia ou outro barbeiro.</p>
              </div>
            ) : (
              <TimeSlotGrid
                label={`Horários livres em ${formatDateShort(date)}`}
                slots={(slots ?? []).map((m) => ({ time: minutesToTime(m), available: true }))}
                value={startMin == null ? null : minutesToTime(startMin)}
                onChange={(t) => setStartMin(Number(t.slice(0, 2)) * 60 + Number(t.slice(3)))}
                loading={loadingSlots || slots === null}
              />
            )}
          </>
        )}
      </Step>

      {/* 5. Cliente (agendamento por telefone) */}
      {mode === "telefone" && (
        <Step n={++n} title="Quem ligou" id="passo-cliente">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nome do cliente" required autoComplete="off" value={client.name} onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))} error={clientErrors.name || undefined} />
            <TextField
              label="Celular"
              required
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="(11) 91234-5678"
              value={client.phone}
              onChange={(e) => setClient((c) => ({ ...c, phone: formatPhone(e.target.value) }))}
              error={clientErrors.phone || undefined}
            />
          </div>
        </Step>
      )}

      {/* Barra de confirmação (fica presa embaixo, perto do polegar) */}
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border md:bottom-4">
        {error && (
          <div className="mb-3">
            <Alert tone="danger" title={error} live="assertive" />
          </div>
        )}
        <p className="mb-2 truncate text-helper text-fg-muted" aria-live="polite">
          {ready ? (
            <>
              <strong className="text-fg">{service!.name}</strong> com {barber!.name} · {formatDateShort(date!)} às {minutesToTime(startMin!)} · {formatPrice(service!.priceCents)}
            </>
          ) : (
            "Escolha um horário para continuar"
          )}
        </p>
        <Button size="lg" fullWidth disabled={!ready} loading={submitting} onClick={confirm}>
          {submitting ? "Confirmando…" : mode === "remarcar" ? "Confirmar novo horário" : "Confirmar horário"}
        </Button>
      </div>
    </div>
  );
}
