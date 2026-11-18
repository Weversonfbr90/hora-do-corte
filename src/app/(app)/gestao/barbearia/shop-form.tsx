"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, ChipGroup, Icon, TextField } from "@/components/ui";
import { formatPhone } from "@/lib/format";
import type { ShopSettings } from "@/lib/types";
import { salvarBarbearia } from "@/server/actions/gestao";

export function ShopForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...settings, phone: formatPhone(settings.phone) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await salvarBarbearia(form);
    setSaving(false);
    setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
    setFeedback(res.ok ? { tone: "success", text: "Dados da barbearia salvos." } : { tone: "danger", text: res.error });
    if (res.ok) router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-5">
      <h2 className="text-h2">Dados da barbearia</h2>
      {feedback && <Alert tone={feedback.tone} title={feedback.text} live="polite" onDismiss={() => setFeedback(null)} />}
      <TextField label="Nome da barbearia" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
      <TextField
        label="Endereço"
        leadingIcon={<Icon name="local" />}
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        error={errors.address}
        hint="Aparece no resumo do agendamento."
      />
      <TextField
        label="Telefone da barbearia"
        type="tel"
        inputMode="tel"
        leadingIcon={<Icon name="telefone" />}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
        error={errors.phone}
        hint="Mostrado quando o cliente não pode mais mudar o horário pelo app."
      />
      <div className="flex flex-col gap-2">
        <p className="text-label" id="grade-rotulo">Intervalo entre horários</p>
        <ChipGroup
          label="Intervalo entre horários"
          value={String(form.slotStepMin)}
          onChange={(v) => setForm({ ...form, slotStepMin: Number(v) as ShopSettings["slotStepMin"] })}
          options={[
            { value: "15", label: "15 min" },
            { value: "20", label: "20 min" },
            { value: "30", label: "30 min" },
          ]}
        />
        <p className="text-helper text-fg-muted">De quanto em quanto tempo os horários aparecem na grade (ex.: 30 min = 9:00, 9:30, 10:00…).</p>
      </div>
      <Button type="submit" size="lg" loading={saving} className="sm:w-fit">Salvar</Button>
    </form>
  );
}
