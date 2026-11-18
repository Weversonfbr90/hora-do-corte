import type { Metadata } from "next";
import { Badge, Wordmark } from "@/components/ui";
import {
  ButtonsSection,
  CardsSection,
  FeedbackSection,
  FieldsSection,
  NavigationSection,
  SelectorsSection,
  SkeletonSection,
  SlotsSection,
} from "@/components/demo/components-showcase";
import { ExampleScreenSection } from "@/components/demo/example-screen";
import { ColorsSection, ContrastSection, IconsSection, SpacingSection, TypographySection } from "@/components/demo/foundations";
import { Section } from "@/components/demo/section";

export const metadata: Metadata = { title: "Design System · Hora do corte" };

const indice = [
  ["cores", "Cores"],
  ["contraste", "Contraste"],
  ["tipografia", "Tipografia"],
  ["espacamento", "Espaço e forma"],
  ["icones", "Ícones"],
  ["botoes", "Botões"],
  ["campos", "Campos"],
  ["seletores", "Seletores"],
  ["horarios", "Horários"],
  ["cartoes", "Cartões"],
  ["navegacao", "Navegação"],
  ["alertas", "Alertas e modais"],
  ["skeletons", "Carregamento"],
  ["exemplo", "Exemplo de tela"],
  ["teclado", "Teclado"],
  ["responsivo", "Responsivo"],
];

const teclas: [string, string, string][] = [
  ["Qualquer tela", "Tab / Shift+Tab", "Avança/volta entre controles, na ordem visual"],
  ["Botões", "Enter ou Espaço", "Aciona"],
  ["Seletor (lista)", "Enter, Espaço, ↓", "Abre a lista"],
  ["Seletor (lista)", "↑ ↓ · Home · End · letra", "Navega; a letra pula para a opção que começa com ela"],
  ["Seletor (lista)", "Enter / Esc", "Escolhe / fecha sem mudar"],
  ["Grade de horários", "Tab", "Entra no horário selecionado (ou no primeiro livre); Tab de novo sai da grade"],
  ["Grade de horários", "← → ↑ ↓ · Home · End", "Move entre horários livres e já seleciona; os ocupados são pulados"],
  ["Faixa de dias, abas", "← → · Home · End", "Troca de dia ou de aba"],
  ["Caixa de seleção, chave", "Espaço", "Marca/desmarca, liga/desliga"],
  ["Modal", "Esc", "Fecha e devolve o foco ao botão que abriu"],
  ["Modal", "Tab", "Circula só dentro do modal enquanto ele está aberto"],
];

export default function DesignSystemPage() {
  return (
    <>
      <a href="#conteudo" className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Pular para o conteúdo
      </a>

      <header className="bg-surface-inverse text-fg-inverse">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-center gap-3">
            <Wordmark inverse className="text-h2" />
            <Badge tone="warning">v0.1 · aguardando aprovação</Badge>
          </div>
          <h1 className="max-w-3xl text-display">Design System</h1>
          <p className="max-w-2xl text-body-lg text-creme-200">
            Tokens, componentes e padrões de interface para o app de agendamento de barbearias. Pensado primeiro para o celular e para uso com uma mão.
            Todos os dados desta página são fictícios.
          </p>
        </div>
      </header>

      <nav aria-label="Seções do Design System" className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6">
          {indice.map(([id, nome]) => (
            <li key={id} className="shrink-0">
              <a href={`#${id}`} className="flex min-h-touch items-center rounded-full px-4 text-label text-fg-muted hover:bg-surface-alt hover:text-fg focus-visible:focus-ring">
                {nome}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main id="conteudo" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <ColorsSection />
        <ContrastSection />
        <TypographySection />
        <SpacingSection />
        <IconsSection />
        <ButtonsSection />
        <FieldsSection />
        <SelectorsSection />
        <SlotsSection />
        <CardsSection />
        <NavigationSection />
        <FeedbackSection />
        <SkeletonSection />
        <ExampleScreenSection />

        <Section id="teclado" title="Navegação por teclado" intro="Tudo o que funciona com o toque também funciona só com o teclado. O foco é sempre visível: um anel azul-escuro de 3px, com folga de 2px.">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-left">
              <thead className="bg-surface-alt text-label">
                <tr>
                  <th scope="col" className="px-4 py-3">Componente</th>
                  <th scope="col" className="px-4 py-3">Tecla</th>
                  <th scope="col" className="hidden px-4 py-3 sm:table-cell">Ação</th>
                </tr>
              </thead>
              <tbody>
                {teclas.map(([c, k, a], i) => (
                  <tr key={i} className="border-t border-border align-top">
                    <td className="px-4 py-3 text-helper font-semibold">{c}</td>
                    <td className="px-4 py-3">
                      <kbd className="rounded-sm border border-border-strong bg-surface-alt px-1.5 py-0.5 font-sans text-helper">{k}</kbd>
                      <span className="mt-1 block text-helper text-fg-muted sm:hidden">{a}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-helper sm:table-cell">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="responsivo" title="Comportamento responsivo" intro="O layout é feito primeiro para o celular e cresce para telas maiores. Os pontos de quebra são os do Tailwind.">
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              ["Celular · até 639px", "Uma coluna e margem de 16px. Navegação inferior, botões de largura total, grade de horários com 3 colunas, modal como folha inferior."],
              ["Tablet · 640–1023px", "Margem de 24px. Grade com 5 colunas e modal centralizado. O painel do dono passa a ter menu lateral a partir de 768px."],
              ["Computador · 1024px+", "Conteúdo limitado a 1152px. Grade com 6 colunas e cartões em duas colunas. A navegação inferior some."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-label">{t}</p>
                <p className="mt-1 text-helper text-fg-muted">{d}</p>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </>
  );
}
