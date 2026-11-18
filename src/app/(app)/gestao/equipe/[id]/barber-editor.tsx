"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Alert, Avatar, Badge, Button, Card, Icon, IconButton, Modal, Switch } from "@/components/ui";
import { controlClasses } from "@/components/ui/field";
import { validateDaySchedule } from "@/lib/agenda";
import { cn } from "@/lib/cn";
import { formatDateLong, minutesToTime, timeToMinutes } from "@/lib/time";
import type { Barber, DaySchedule, WeekSchedule } from "@/lib/types";
import { adicionarFolga, reativarAcesso, removerBarbeiro, removerFolga, salvarExpediente, suspenderAcesso } from "@/server/actions/gestao";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// Segunda primeiro (como a semana de trabalho é lida no Brasil).
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function TimeInput({ label, value, onChange, invalid }: { label: string; value: number | null; onChange: (v: number | null) => void; invalid?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-helper font-semibold text-fg">{label}</label>
      <input
        id={id}
        type="time"
        step={300}
        value={value == null ? "" : minutesToTime(value)}
        onChange={(e) => {
          const m = timeToMinutes(e.target.value);
          onChange(Number.isNaN(m) ? null : m);
        }}
        aria-invalid={invalid || undefined}
        className={cn(controlClasses, invalid ? "border-2 border-danger" : "border-border-strong", "px-3 tabular-nums")}
      />
    </div>
  );
}

interface Props {
  barber: Barber;
  email: string;
  suspended: boolean;
  isSelf: boolean;
  today: string;
}

export function BarberEditor({ barber, email, suspended, isSelf, today }: Props) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<WeekSchedule>(barber.schedule);
  const [dayErrors, setDayErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [newOff, setNewOff] = useState("");
  const [offError, setOffError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"suspender" | "remover" | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger" | "warning"; text: string } | null>(null);

  const update = (i: number, patch: Partial<DaySchedule>) =>
    setSchedule((s) => s.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) as WeekSchedule);

  const save = async () => {
    const errs: Record<number, string> = {};
    schedule.forEach((d, i) => {
      const e = validateDaySchedule(d);
      if (e) errs[i] = e;
    });
    setDayErrors(errs);
    if (Object.keys(errs).length) {
      setFeedback({ tone: "danger", text: "Corrija os dias marcados em vermelho." });
      return;
    }
    setSaving(true);
    const res = await salvarExpediente(barber.id, schedule);
    setSaving(false);
    setFeedback(res.ok ? { tone: "success", text: "Horário de trabalho salvo. Os clientes já veem os novos horários." } : { tone: "danger", text: res.error });
    router.refresh();
  };

  const addOff = async () => {
    setOffError(null);
    if (!newOff) return setOffError("Escolha a data da folga.");
    setBusy(true);
    const res = await adicionarFolga(barber.id, newOff);
    setBusy(false);
    if (!res.ok) return setOffError(res.error);
    setNewOff("");
    setFeedback(
      res.data.existing > 0
        ? { tone: "warning", text: `Folga registrada. Atenção: já existem ${res.data.existing} horário(s) marcado(s) nesse dia. Veja no painel e cancele se precisar.` }
        : { tone: "success", text: "Folga registrada. Esse dia não aparece mais para os clientes." },
    );
    router.refresh();
  };

  const removeOff = async (date: string) => {
    setBusy(true);
    const res = await removerFolga(barber.id, date);
    setBusy(false);
    setFeedback(res.ok ? { tone: "success", text: "Folga removida." } : { tone: "danger", text: res.error });
    router.refresh();
  };

  const runConfirm = async () => {
    setBusy(true);
    const res = confirm === "suspender" ? await suspenderAcesso(barber.id) : await removerBarbeiro(barber.id);
    setBusy(false);
    setConfirm(null);
    if (res.ok && confirm === "remover") {
      router.push("/gestao/equipe");
      router.refresh();
      return;
    }
    setFeedback(res.ok ? { tone: "success", text: "Acesso suspenso." } : { tone: "danger", text: res.error });
    router.refresh();
  };

  const reactivate = async () => {
    setBusy(true);
    const res = await reativarAcesso(barber.id);
    setBusy(false);
    setFeedback(res.ok ? { tone: "success", text: "Acesso reativado." } : { tone: "danger", text: res.error });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar name={barber.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-h2">{barber.name}</h2>
          <p className="truncate text-body text-fg-muted">{email}</p>
        </div>
        {suspended ? <Badge tone="danger">Suspenso</Badge> : <Badge tone="success">Ativo</Badge>}
      </div>

      {feedback && <Alert tone={feedback.tone} title={feedback.text} live="polite" onDismiss={() => setFeedback(null)} />}

      {/* Horário de trabalho */}
      <section aria-labelledby="expediente" className="flex flex-col gap-3">
        <h3 id="expediente" className="text-h3">Horário de trabalho</h3>
        <p className="-mt-2 text-helper text-fg-muted">O intervalo (almoço) é opcional. Os clientes só veem horários dentro do expediente.</p>
        <ul className="flex flex-col gap-2">
          {ORDER.map((i) => {
            const d = schedule[i]!;
            const err = dayErrors[i];
            return (
              <li key={i}>
                <Card className={cn("flex flex-col gap-2", err && "border-2 border-danger")}>
                  <Switch label={DAYS[i]!} description={d.works ? undefined : "Não trabalha"} checked={d.works} onChange={(v) => update(i, { works: v })} />
                  {d.works && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <TimeInput label="Início" value={d.start} onChange={(v) => update(i, { start: v ?? 0 })} invalid={Boolean(err)} />
                      <TimeInput label="Fim" value={d.end} onChange={(v) => update(i, { end: v ?? 0 })} invalid={Boolean(err)} />
                      <TimeInput label="Intervalo de" value={d.breakStart} onChange={(v) => update(i, { breakStart: v })} />
                      <TimeInput label="até" value={d.breakEnd} onChange={(v) => update(i, { breakEnd: v })} />
                    </div>
                  )}
                  {err && <p className="flex items-center gap-1.5 text-helper font-medium text-danger"><Icon name="erro" size={16} /> {err}</p>}
                </Card>
              </li>
            );
          })}
        </ul>
        <Button size="lg" onClick={save} loading={saving} className="sm:w-fit">Salvar horário de trabalho</Button>
      </section>

      {/* Folgas */}
      <section aria-labelledby="folgas" className="flex flex-col gap-3">
        <h3 id="folgas" className="text-h3">Folgas</h3>
        <p className="-mt-2 text-helper text-fg-muted">Dias em que {barber.name.split(" ")[0]} não atende (além dos dias de descanso da semana).</p>
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="nova-folga" className="text-label">Data da folga</label>
            <input
              id="nova-folga"
              type="date"
              min={today}
              value={newOff}
              onChange={(e) => setNewOff(e.target.value)}
              aria-invalid={offError ? true : undefined}
              aria-describedby={offError ? "nova-folga-msg" : undefined}
              className={cn(controlClasses, offError ? "border-2 border-danger" : "border-border-strong")}
            />
            {offError && <p id="nova-folga-msg" className="text-helper font-medium text-danger">{offError}</p>}
          </div>
          <Button variant="secondary" icon={<Icon name="adicionar" />} onClick={addOff} disabled={busy}>Adicionar folga</Button>
        </Card>
        {barber.daysOff.length === 0 ? (
          <p className="text-body text-fg-muted">Nenhuma folga marcada.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {barber.daysOff.map((d) => (
              <li key={d} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface py-1 pr-1 pl-4">
                <span className="text-body first-letter:uppercase">{formatDateLong(d)}</span>
                <IconButton label={`Remover folga de ${formatDateLong(d)}`} onClick={() => removeOff(d)} disabled={busy}>
                  <Icon name="fechar" size={24} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Acesso */}
      <section aria-labelledby="acesso" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <h3 id="acesso" className="text-h3">Acesso</h3>
        <div className="flex flex-wrap gap-2">
          {!isSelf &&
            (suspended ? (
              <Button onClick={reactivate} loading={busy}>Reativar acesso</Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirm("suspender")}>Suspender acesso</Button>
            ))}
          <Button variant="secondary" onClick={() => setConfirm("remover")}>{isSelf ? "Não atendo mais" : "Tirar da equipe"}</Button>
        </div>
      </section>

      <Modal
        open={confirm !== null}
        onClose={() => !busy && setConfirm(null)}
        title={confirm === "suspender" ? `Suspender o acesso de ${barber.name}?` : isSelf ? "Parar de atender pelo app?" : `Tirar ${barber.name} da equipe?`}
        description={
          confirm === "suspender"
            ? "A pessoa não consegue mais entrar e some da lista de agendamento. Os horários já marcados continuam na agenda."
            : "Ninguém mais consegue agendar com essa pessoa. Os horários já marcados continuam na agenda e no painel." +
              (isSelf ? "" : " A conta volta a ser de cliente.")
        }
        footer={
          <>
            <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setConfirm(null)} disabled={busy}>Voltar</Button>
            <Button variant="danger" fullWidth className="sm:w-auto" onClick={runConfirm} loading={busy}>Confirmar</Button>
          </>
        }
      />
    </div>
  );
}
