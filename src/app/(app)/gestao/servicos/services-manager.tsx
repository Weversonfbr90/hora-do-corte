"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/app/page-header";
import { Alert, Badge, Button, Card, Icon, Modal, Select, Switch, TextField } from "@/components/ui";
import { formatDuration, formatPrice, parsePrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { alternarServico, excluirServico, salvarServico } from "@/server/actions/gestao";

const DURATIONS = [10, 15, 20, 30, 40, 45, 50, 60, 75, 90, 120].map((m) => ({ value: String(m), label: formatDuration(m) }));

type Draft = { id: string | null; name: string; durationMin: string | null; price: string };
const empty: Draft = { id: null, name: "", durationMin: "30", price: "" };

export function ServicesManager({ services }: { services: Service[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const open = (s?: Service) => {
    setErrors({});
    setFormError(null);
    setDraft(s ? { id: s.id, name: s.name, durationMin: String(s.durationMin), price: (s.priceCents / 100).toFixed(2).replace(".", ",") } : empty);
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!draft) return;
    const fe: Record<string, string> = {};
    const priceCents = parsePrice(draft.price);
    if (!draft.name.trim()) fe.name = "Informe o nome do serviço.";
    if (!draft.durationMin) fe.durationMin = "Escolha a duração.";
    if (!draft.price.trim() || Number.isNaN(priceCents)) fe.priceCents = "Informe o preço, ex.: 40,00.";
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    const res = await salvarServico(draft.id, { name: draft.name, durationMin: Number(draft.durationMin), priceCents });
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setFormError(res.error);
      return;
    }
    setFeedback({ tone: "success", text: draft.id ? "Serviço atualizado." : "Serviço cadastrado." });
    setDraft(null);
    router.refresh();
  };

  const toggle = async (s: Service, active: boolean) => {
    setBusy(s.id);
    const res = await alternarServico(s.id, active);
    setBusy(null);
    setFeedback(res.ok ? { tone: "success", text: active ? `${s.name} voltou a aparecer para os clientes.` : `${s.name} foi pausado.` } : { tone: "danger", text: res.error });
    router.refresh();
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(toDelete.id);
    const res = await excluirServico(toDelete.id);
    setBusy(null);
    setFeedback(res.ok ? { tone: "success", text: `${toDelete.name} foi excluído.` } : { tone: "danger", text: res.error });
    setToDelete(null);
    router.refresh();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2">Serviços</h2>
        <Button icon={<Icon name="adicionar" />} onClick={() => open()}>Novo serviço</Button>
      </div>
      {feedback && <Alert tone={feedback.tone} title={feedback.text} live="polite" onDismiss={() => setFeedback(null)} />}

      {services.length === 0 ? (
        <EmptyState title="Nenhum serviço cadastrado" action={<Button onClick={() => open()}>Cadastrar o primeiro</Button>}>
          Os clientes só conseguem agendar depois que houver pelo menos um serviço.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {services.map((s) => (
            <li key={s.id}>
              <Card className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-h3">{s.name}</p>
                    <p className="text-body text-fg-muted">
                      {formatDuration(s.durationMin)} · {formatPrice(s.priceCents)}
                    </p>
                  </div>
                  {!s.active && <Badge tone="warning">Pausado</Badge>}
                </div>
                <Switch label="Aparece para os clientes" checked={s.active} disabled={busy === s.id} onChange={(v) => toggle(s, v)} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => open(s)}>Editar</Button>
                  <Button variant="danger" onClick={() => setToDelete(s)}>Excluir</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={draft !== null}
        onClose={() => !saving && setDraft(null)}
        title={draft?.id ? "Editar serviço" : "Novo serviço"}
        footer={
          <>
            <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setDraft(null)} disabled={saving}>Cancelar</Button>
            <Button fullWidth className="sm:w-auto" onClick={() => save()} loading={saving}>Salvar</Button>
          </>
        }
      >
        {draft && (
          <form onSubmit={save} noValidate className="flex flex-col gap-4 pb-2">
            {formError && <Alert tone="danger" title={formError} live="assertive" />}
            <TextField label="Nome" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} placeholder="Ex.: Corte + barba" />
            <Select label="Duração" required options={DURATIONS} value={draft.durationMin} onChange={(v) => setDraft({ ...draft, durationMin: v })} error={errors.durationMin} hint="Tempo que o barbeiro fica ocupado." />
            <TextField label="Preço (R$)" required inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} error={errors.priceCents} placeholder="40,00" />
            <button type="submit" hidden />
          </form>
        )}
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => !busy && setToDelete(null)}
        title={`Excluir “${toDelete?.name ?? ""}”?`}
        description="O serviço some do app. Agendamentos já feitos continuam com o nome e o preço da época. Para esconder só por um tempo, use “Aparece para os clientes”."
        footer={
          <>
            <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setToDelete(null)} disabled={busy !== null}>Manter</Button>
            <Button variant="danger" fullWidth className="sm:w-auto" onClick={remove} loading={busy !== null}>Sim, excluir</Button>
          </>
        }
      />
    </div>
  );
}
