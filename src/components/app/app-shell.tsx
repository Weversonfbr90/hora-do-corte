"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav, SideNav, Wordmark, type NavItem } from "@/components/ui";
import type { Role } from "@/lib/types";

interface AppShellProps {
  role: Role;
  isBarber: boolean;
  userName: string;
  shopName: string;
  children: ReactNode;
}

/** Destinos de navegação por perfil. */
function navFor(role: Role, isBarber: boolean): NavItem[] {
  if (role === "dono") {
    return [
      { id: "painel", label: "Painel", icon: "painel", href: "/painel" },
      ...(isBarber ? [{ id: "agenda", label: "Minha agenda", icon: "agenda", href: "/agenda" } as NavItem] : []),
      { id: "gestao", label: "Equipe e serviços", icon: "equipe", href: "/gestao/servicos" },
      { id: "conta", label: "Conta", icon: "cliente", href: "/conta" },
    ];
  }
  if (role === "barbeiro") {
    return [
      { id: "agenda", label: "Agenda", icon: "agenda", href: "/agenda" },
      { id: "conta", label: "Conta", icon: "cliente", href: "/conta" },
    ];
  }
  return [
    { id: "agendar", label: "Agendar", icon: "agenda", href: "/agendar" },
    { id: "meus", label: "Meus horários", icon: "horario", href: "/meus-agendamentos" },
    { id: "conta", label: "Conta", icon: "cliente", href: "/conta" },
  ];
}

const sectionOf = (path: string): string => {
  if (path.startsWith("/painel")) return "painel";
  if (path.startsWith("/agenda") && !path.startsWith("/agendar")) return "agenda";
  if (path.startsWith("/gestao")) return "gestao";
  if (path.startsWith("/conta")) return "conta";
  if (path.startsWith("/meus-agendamentos")) return "meus";
  return "agendar";
};

/** Rótulos curtos para a barra inferior (cabem em 390px). */
const shortLabel: Record<string, string> = { gestao: "Gestão", agenda: "Agenda" };

export function AppShell({ role, isBarber, userName, shopName, children }: AppShellProps) {
  const pathname = usePathname();
  const items = navFor(role, isBarber);
  const current = sectionOf(pathname);
  const mobileItems = items.map((i) => ({ ...i, label: shortLabel[i.id] ?? i.label }));

  return (
    <div className="min-h-dvh md:flex">
      <a href="#conteudo" className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Pular para o conteúdo
      </a>

      {/* Tablet/computador: menu lateral */}
      <div className="sticky top-0 hidden h-dvh shrink-0 md:block">
        <SideNav
          items={items}
          current={current}
          footer={
            <div className="border-t border-carvao-800 px-3 pt-4">
              <p className="truncate text-label text-fg-inverse">{userName}</p>
              <p className="truncate text-helper text-creme-200">{shopName}</p>
            </div>
          }
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Celular: faixa da marca */}
        <header className="bg-surface-inverse px-4 py-3 text-fg-inverse md:hidden">
          <Wordmark inverse className="text-body" />
          <span className="ml-2 text-helper text-creme-200">· {shopName}</span>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:pt-10 md:pb-12">
          {children}
        </main>
      </div>

      {/* Celular: barra inferior */}
      <BottomNav items={mobileItems} current={current} />
    </div>
  );
}
