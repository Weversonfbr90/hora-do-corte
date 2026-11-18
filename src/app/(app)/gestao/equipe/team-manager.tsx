"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/app/page-header";
import { Alert, Avatar, Badge, Button, Card, Icon, Modal, TextField } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/types";
import { buscarConta, liberarBarbeiro, reativarAcesso, suspenderAcesso } from "@/server/actions/gestao";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: "ativo" | "suspenso";
  isOwner: boolean;
  workDays: number;
}

type Found = Extract<Awaited<ReturnType<typeof buscarConta>>, { ok: true }>["data"];
type Confirm = { kind: "suspender" | "liberar"; id: string; name: string } | null;

export function TeamManager({ team, suspended, ownerId }: { team: TeamMember[]; suspended: { id: string; name: string; email: string }[]; ownerId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    setFound(null);
    setSearchError(null);
    if (!email.trim()) return setSearchError("Informe o e-mail da conta.");
    setSearching(true);
    const res = await buscarConta({ email });
    setSearching(false);
    if (res.ok) setFound(res.data);
    else setSearchError(res.error);
  };

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    const res = confirm.kind === "liberar" ? await liberarBarbeiro({ email: found?.email ?? "" }) : await suspenderAcesso(confirm.id);
    setBusy(false);
    setFeedback(
      res.ok
        ? {
            tone: "success",
            text: confirm.kind === "liberar" ? `${confirm.name} agora faz parte da equipe. Confira o horário de trabalho.` : `O acesso de ${confirm.name} foi suspenso.`,
          }
        : { tone: "danger", text: res.error },
    );
    setConfirm(null);
    setFound(null);
    setEmail("");
    router.refresh();
  };

  const reactivate = async (id: string, name: string) => {
    setBusy(true);
    const res = await reativarAcesso(id);
    setBusy(false);
    setFeedback(res.ok ? { tone: "success", text: `O acesso de ${name} foi reativado.` } : { tone: "danger", text: res.error });
    setFound(null);
    router.refresh();
  };

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {feedback && <Alert tone={feedback.tone} title={feedback.text} live="polite" onDismiss={() => setFeedback(null)} />}

      <section aria-labelledby="equipe-titulo" className="flex flex-col gap-3">
        <h2 id="equipe-titulo" className="text-h2">Barbeiros</h2>
        {team.length === 0 ? (
          <EmptyState title="Ninguém na equipe ainda">Libere a conta de um barbeiro abaixo. Se você também atende, libere a sua própria conta.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {team.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/gestao/equipe/${m.id}`}
                  className="flex min-h-touch-lg items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-alt focus-visible:focus-ring"
                >
                  <Avatar name={m.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-h3">
                      {m.name}
                      {m.isOwner && <span className="ml-2 text-helper font-normal text-fg-muted">(você)</span>}
                    </span>
                    <span className="block truncate text-helper text-fg-muted">
                      {m.workDays === 0 ? "Sem dias de trabalho definidos" : `${m.workDays} dias de trabalho por semana`}
                    </span>
                  </span>
                  {m.status === "suspenso" ? <Badge tone="danger">Suspenso</Badge> : <Badge tone="success">Ativo</Badge>}
                  <Icon name="proximo" className="shrink-0 text-fg-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="liberar-titulo" className="flex flex-col gap-3">
        <h2 id="liberar-titulo" className="text-h2">Liberar acesso</h2>
        <p className="-mt-1 text-body text-fg-muted">
          A pessoa cria a conta no app e você procura pelo e-mail dela para liberar como barbeiro ou suspender o acesso.
        </p>
        <Card>
          <form onSubmit={search} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <TextField label="E-mail da conta" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} error={searchError ?? undefined} />
            </div>
            <Button type="submit" variant="secondary" loading={searching} icon={<Icon name="buscar" />} className="sm:mt-7">
              Procurar
            </Button>
          </form>
          {found && (
            <div className="mt-4 flex flex-col gap-3 rounded-md bg-surface-alt p-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <Avatar name={found.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-label">{found.name}</p>
                  <p className="truncate text-helper text-fg-muted">{found.email} · {ROLE_LABEL[found.role]}</p>
                </div>
                {found.status === "suspenso" && <Badge tone="danger">Suspenso</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                {found.status === "suspenso" ? (
                  <Button loading={busy} onClick={() => reactivate(found.id, found.name)}>Reativar acesso</Button>
                ) : (
                  <>
                    {!found.isBarber && (
                      <Button onClick={() => setConfirm({ kind: "liberar", id: found.id, name: found.name })}>
                        {found.id === ownerId ? "Eu também atendo" : "Liberar como barbeiro"}
                      </Button>
                    )}
                    {found.isBarber && <p className="flex min-h-touch items-center text-helper text-fg-muted">Já está na equipe.</p>}
                    {found.id !== ownerId && (
                      <Button variant="danger" onClick={() => setConfirm({ kind: "suspender", id: found.id, name: found.name })}>Suspender acesso</Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </section>

      {suspended.length > 0 && (
        <section aria-labelledby="suspensos-titulo" className="flex flex-col gap-3">
          <h2 id="suspensos-titulo" className="text-h2">Contas suspensas</h2>
          <ul className="flex flex-col gap-2">
            {suspended.map((s) => (
              <li key={s.id}>
                <Card className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-label">{s.name}</p>
                    <p className="truncate text-helper text-fg-muted">{s.email}</p>
                  </div>
                  <Button variant="secondary" disabled={busy} onClick={() => reactivate(s.id, s.name)}>Reativar</Button>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => !busy && setConfirm(null)}
        title={confirm?.kind === "liberar" ? `Liberar ${confirm.name} como barbeiro?` : `Suspender o acesso de ${confirm?.name ?? ""}?`}
        description={
          confirm?.kind === "liberar"
            ? "A pessoa passa a aparecer para os clientes, com o horário padrão (terça a sábado, 9h às 19h). Você pode mudar o horário depois."
            : "A pessoa não consegue mais entrar no app e, se for barbeiro, some da lista de agendamento. Os horários já marcados continuam na agenda."
        }
        footer={
          <>
            <Button variant="secondary" fullWidth className="sm:w-auto" onClick={() => setConfirm(null)} disabled={busy}>Voltar</Button>
            <Button variant={confirm?.kind === "liberar" ? "primary" : "danger"} fullWidth className="sm:w-auto" onClick={run} loading={busy}>
              {confirm?.kind === "liberar" ? "Liberar" : "Sim, suspender"}
            </Button>
          </>
        }
      />
    </div>
  );
}
