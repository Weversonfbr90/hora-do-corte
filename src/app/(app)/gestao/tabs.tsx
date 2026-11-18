"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/gestao/servicos", label: "Serviços" },
  { href: "/gestao/equipe", label: "Equipe" },
  { href: "/gestao/barbearia", label: "Barbearia" },
];

/** Sub-navegação da gestão (links de página, com aria-current). */
export function GestaoTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções da gestão" className="flex max-w-md gap-1 rounded-lg bg-surface-alt p-1">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-touch flex-1 items-center justify-center rounded-md px-3 text-label transition-colors focus-visible:focus-ring",
              active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
