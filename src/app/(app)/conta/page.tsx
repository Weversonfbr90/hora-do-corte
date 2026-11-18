import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Avatar, Badge, Card } from "@/components/ui";
import { formatPhone } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";
import { requireSession } from "@/server/session";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = { title: "Conta · Hora do corte" };

export default async function ContaPage() {
  const session = await requireSession();
  return (
    <>
      <PageHeader title="Minha conta" />
      <div className="flex max-w-xl flex-col gap-5">
        <Card padding="lg" className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={session.name} size="lg" />
            <div className="min-w-0">
              <p className="text-h2">{session.name}</p>
              <Badge tone="leather">{ROLE_LABEL[session.role]}{session.role === "dono" && session.isBarber ? " · também atende" : ""}</Badge>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
            <dt className="text-fg-muted">E-mail</dt>
            <dd className="truncate">{session.email}</dd>
            <dt className="text-fg-muted">Celular</dt>
            <dd>{session.phone ? formatPhone(session.phone) : "—"}</dd>
          </dl>
        </Card>
        <LogoutButton />
      </div>
    </>
  );
}
