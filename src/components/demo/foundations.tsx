// Seções de fundamentos: cores, contraste, tipografia, espaçamento, raios, bordas, sombras e ícones.
import { Icon, icons, type IconName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { contrastRatio, wcagLevel } from "@/lib/contrast";
import { Section, Sub } from "./section";

const BG = "#FAF7F2";

type Swatch = { token: string; hex: string; uso: string; textOn?: string; /** 0 = não exibir contraste (superfícies, desabilitado). */ min?: number };

const grupos: { titulo: string; itens: Swatch[] }[] = [
  {
    titulo: "Marca",
    itens: [
      { token: "primary", hex: "#292524", uso: "Botão principal, texto, navegação lateral", textOn: "#FAF7F2" },
      { token: "accent", hex: "#ADD2FF", uso: "Seleção (horário, aba ativa). Só como fundo, com texto escuro", textOn: "#292524" },
      { token: "accent-strong", hex: "#1E5A9C", uso: "Links, anel de foco, ícone de confirmação", textOn: "#FFFDF9" },
      { token: "brand-leather", hex: "#7A4A2B", uso: "Couro: avatares, selos, detalhes de marca", textOn: "#FFFDF9" },
      { token: "brand-wood", hex: "#5B3F2C", uso: "Madeira: títulos de destaque em telas de marketing", textOn: "#FFFDF9" },
    ],
  },
  {
    titulo: "Superfícies e bordas",
    itens: [
      { min: 0, token: "bg", hex: "#FAF7F2", uso: "Fundo de todas as telas", textOn: "#292524" },
      { min: 0, token: "surface", hex: "#FFFDF9", uso: "Cartões, campos, modais", textOn: "#292524" },
      { min: 0, token: "surface-alt", hex: "#F2ECE3", uso: "Hover, desabilitado, trilhos", textOn: "#292524" },
      { min: 0, token: "border", hex: "#E2D8C9", uso: "Divisórias e contorno de cartões (decorativo)", textOn: "#292524" },
      { token: "border-strong", hex: "#8C8178", uso: "Contorno de campos e controles (≥ 3:1)", textOn: "#FFFDF9" },
    ],
  },
  {
    titulo: "Texto",
    itens: [
      { token: "fg", hex: "#292524", uso: "Texto principal", textOn: "#FAF7F2" },
      { token: "fg-muted", hex: "#635B54", uso: "Texto secundário, mensagens auxiliares", textOn: "#FAF7F2" },
      { min: 0, token: "fg-disabled", hex: "#A39A91", uso: "Somente itens desabilitados (isento pela WCAG)", textOn: "#292524" },
    ],
  },
  {
    titulo: "Estados",
    itens: [
      { token: "success", hex: "#2C6B3F", uso: "Confirmado, salvo", textOn: "#FFFDF9" },
      { token: "warning", hex: "#7D5300", uso: "Pendente, atenção", textOn: "#FFFDF9" },
      { token: "danger", hex: "#A8261B", uso: "Erro, cancelado, ação destrutiva", textOn: "#FFFDF9" },
      { token: "info", hex: "#1E5A9C", uso: "Informação neutra", textOn: "#FFFDF9" },
    ],
  },
];

function Ratio({ fg, bg, min = 4.5 }: { fg: string; bg: string; min?: number }) {
  const r = contrastRatio(fg, bg);
  const ok = r >= min;
  return (
    <span className={cn("inline-flex items-center gap-1 text-helper font-semibold tabular-nums", ok ? "text-success" : "text-danger")}>
      <Icon name={ok ? "sucesso" : "erro"} size={16} />
      {r.toFixed(2)}:1 · {ok ? wcagLevel(r) : "Falha"}
    </span>
  );
}

export function ColorsSection() {
  return (
    <Section id="cores" title="Cores" intro="Os componentes usam só os tokens semânticos (bg, fg, primary…). As escalas de base (carvao, creme, couro, madeira, celeste) ficam reservadas para criar novos tokens.">
      {grupos.map((g) => (
        <Sub key={g.titulo} title={g.titulo}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.itens.map((s) => (
              <li key={s.token} className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex h-20 items-end p-3" style={{ backgroundColor: s.hex, color: s.textOn }}>
                  <span className="text-label">Aa</span>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <code className="text-label">{s.token}</code>
                  <span className="text-helper text-fg-muted">{s.hex}</span>
                  <span className="text-helper">{s.uso}</span>
                  {s.min !== 0 && (
                    <span className="text-helper text-fg-muted">
                      Sobre o fundo: <Ratio fg={s.hex} bg={BG} min={s.min ?? 3} />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Sub>
      ))}
    </Section>
  );
}

const pares: { desc: string; fg: string; bg: string; min: number }[] = [
  { desc: "Texto principal no fundo", fg: "#292524", bg: "#FAF7F2", min: 4.5 },
  { desc: "Texto secundário no fundo", fg: "#635B54", bg: "#FAF7F2", min: 4.5 },
  { desc: "Texto secundário em superfície alternativa", fg: "#635B54", bg: "#F2ECE3", min: 4.5 },
  { desc: "Texto do botão principal", fg: "#FAF7F2", bg: "#292524", min: 4.5 },
  { desc: "Texto escuro sobre o destaque (horário selecionado)", fg: "#292524", bg: "#ADD2FF", min: 4.5 },
  { desc: "Links e anel de foco (destaque forte)", fg: "#1E5A9C", bg: "#FAF7F2", min: 4.5 },
  { desc: "Contorno de campos", fg: "#8C8178", bg: "#FFFDF9", min: 3 },
  { desc: "Couro sobre couro claro (avatar)", fg: "#7A4A2B", bg: "#F3E5D6", min: 4.5 },
  { desc: "Sucesso", fg: "#2C6B3F", bg: "#E5F1E7", min: 4.5 },
  { desc: "Aviso", fg: "#7D5300", bg: "#FBF0D6", min: 4.5 },
  { desc: "Erro", fg: "#A8261B", bg: "#FCEBE8", min: 4.5 },
];

export function ContrastSection() {
  return (
    <Section id="contraste" title="Contraste e ajustes" intro="Meta: WCAG 2.2 nível AA. Texto ≥ 4,5:1; contornos de controles, ícones e anel de foco ≥ 3:1. Os números abaixo são calculados ao vivo a partir das cores.">
      <div className="rounded-lg border-2 border-warning bg-warning-soft p-4 sm:p-5">
        <p className="flex items-center gap-2 text-h3 text-warning">
          <Icon name="aviso" size={24} /> Ajuste necessário: o destaque #ADD2FF
        </p>
        <div className="mt-3 grid gap-3 text-body sm:grid-cols-2">
          <div className="rounded-md bg-surface p-3">
            <p className="text-label">Problema</p>
            <p className="mt-1 text-helper">
              Sobre o fundo creme, o azul claro tem só <Ratio fg="#ADD2FF" bg={BG} />. Como texto, link, borda ou anel de foco, ele
              ficaria praticamente invisível, principalmente no sol, na tela do celular.
            </p>
            <p className="mt-2 rounded-sm px-2 py-1 text-body font-semibold" style={{ color: "#ADD2FF", backgroundColor: BG }}>
              Exemplo do que não fazer
            </p>
          </div>
          <div className="rounded-md bg-surface p-3">
            <p className="text-label">Solução adotada</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-helper">
              <li><strong>#ADD2FF continua sendo o destaque</strong>, mas só como <em>fundo</em>, com texto carvão por cima (<Ratio fg="#292524" bg="#ADD2FF" />).</li>
              <li>Para texto, links e foco, criei a variação escura <strong>accent-strong #1E5A9C</strong> (<Ratio fg="#1E5A9C" bg={BG} />), do mesmo matiz.</li>
              <li>Itens selecionados também levam <strong>borda escura de 2px e ícone ✓</strong>, para não depender só da cor.</li>
            </ul>
          </div>
        </div>
      </div>

      <Sub title="Outros ajustes">
        <ul className="list-disc space-y-1 pl-5 text-body">
          <li>O cinza de texto secundário foi escurecido para <code>#635B54</code>, para chegar a AA também sobre <code>surface-alt</code>.</li>
          <li>A borda clara <code>#E2D8C9</code> serve só para enfeite. Campos e controles usam <code>border-strong #8C8178</code> (≥ 3:1).</li>
          <li>Couro e madeira entram como cores de apoio no tom quente que o briefing pede. Os tons foram escurecidos até passarem como texto.</li>
        </ul>
      </Sub>

      <Sub title="Combinações aprovadas">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-left">
            <caption className="sr-only">Pares de cores e razão de contraste</caption>
            <thead className="bg-surface-alt text-label">
              <tr>
                <th scope="col" className="px-4 py-3">Uso</th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">Amostra</th>
                <th scope="col" className="px-4 py-3">Contraste</th>
              </tr>
            </thead>
            <tbody>
              {pares.map((p) => (
                <tr key={p.desc} className="border-t border-border">
                  <td className="px-4 py-3 text-helper">{p.desc}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="inline-block rounded-sm border border-border px-3 py-1 text-label" style={{ color: p.fg, backgroundColor: p.bg }}>
                      Agendar 14:30
                    </span>
                  </td>
                  <td className="px-4 py-3"><Ratio fg={p.fg} bg={p.bg} min={p.min} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sub>
    </Section>
  );
}

const escala = [
  { cls: "text-display", nome: "display", spec: "32/40 · 800", ex: "Seu horário, sem espera" },
  { cls: "text-h1", nome: "h1", spec: "28/36 · 700", ex: "Agendar horário" },
  { cls: "text-h2", nome: "h2", spec: "22/30 · 700", ex: "Escolha o barbeiro" },
  { cls: "text-h3", nome: "h3", spec: "18/26 · 600", ex: "Corte + barba" },
  { cls: "text-body-lg", nome: "body-lg", spec: "18/28 · 400", ex: "Texto de destaque e introduções." },
  { cls: "text-body", nome: "body", spec: "16/24 · 400", ex: "Texto padrão. Também é o tamanho mínimo dos campos." },
  { cls: "text-label", nome: "label", spec: "15/22 · 600", ex: "Rótulo do campo" },
  { cls: "text-helper text-fg-muted", nome: "helper", spec: "14/20 · 400–500", ex: "Mensagem auxiliar ou de erro, abaixo do campo." },
  { cls: "text-overline uppercase text-fg-muted", nome: "overline", spec: "12/16 · 700 · caixa alta", ex: "Seg · próximo horário" },
];

export function TypographySection() {
  return (
    <Section id="tipografia" title="Tipografia" intro="Fonte: Manrope (variável), sem serifa, moderna e com números bem desenhados para horários e preços. Ela vem empacotada no projeto, sem chamada ao Google Fonts. Horários e valores usam algarismos tabulares (tabular-nums).">
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {escala.map((t) => (
          <li key={t.nome} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6">
            <span className="w-40 shrink-0">
              <code className="text-label">text-{t.nome}</code>
              <span className="block text-helper text-fg-muted">{t.spec}</span>
            </span>
            <span className={t.cls}>{t.ex}</span>
          </li>
        ))}
      </ul>
      <p className="text-helper text-fg-muted">Formato: tamanho/altura de linha em px · peso. Nunca use menos de 14px para frases.</p>
    </Section>
  );
}

const espacos = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const raios = [
  { cls: "rounded-sm", nome: "sm · 6px", uso: "badges, checkbox" },
  { cls: "rounded-md", nome: "md · 10px", uso: "campos, horários" },
  { cls: "rounded-lg", nome: "lg · 14px", uso: "botões, cartões" },
  { cls: "rounded-xl", nome: "xl · 20px", uso: "modais, folhas" },
  { cls: "rounded-full", nome: "full", uso: "avatares, pílulas" },
];
const sombras = [
  { cls: "shadow-sm", nome: "sm", uso: "botões, item selecionado" },
  { cls: "shadow-md", nome: "md", uso: "cartão em destaque" },
  { cls: "shadow-lg", nome: "lg", uso: "menus suspensos, modais" },
];

export function SpacingSection() {
  return (
    <Section id="espacamento" title="Espaçamento, raios, bordas e sombras" intro="A base é 4px. As medidas de toque são fixas: 48px no mínimo para qualquer alvo e 56px para a ação principal da tela.">
      <Sub title="Espaçamento (múltiplos de 4px)">
        <ul className="flex flex-col gap-2">
          {espacos.map((s) => (
            <li key={s} className="flex items-center gap-4">
              <code className="w-20 text-helper">{s} · {s * 4}px</code>
              <span className="h-4 rounded-sm bg-brand-leather" style={{ width: `${s * 4}px` }} />
            </li>
          ))}
          <li className="flex items-center gap-4">
            <code className="w-20 text-helper">touch · 48</code>
            <span className="size-touch rounded-sm border-2 border-dashed border-accent-strong" />
            <code className="w-24 text-helper">touch-lg · 56</code>
            <span className="size-touch-lg rounded-sm border-2 border-dashed border-accent-strong" />
          </li>
        </ul>
        <p className="mt-3 text-helper text-fg-muted">Ritmo: 4 entre rótulo e campo · 16 entre campos · 24 entre grupos · 32–48 entre seções. Margem lateral de 16px no celular e 24px a partir do tablet.</p>
      </Sub>
      <Sub title="Raios (cantos suaves)">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {raios.map((r) => (
            <li key={r.nome} className="flex flex-col items-center gap-2 text-center">
              <span className={cn("size-20 border-2 border-fg bg-accent-soft", r.cls)} />
              <code className="text-label">{r.nome}</code>
              <span className="text-helper text-fg-muted">{r.uso}</span>
            </li>
          ))}
        </ul>
      </Sub>
      <Sub title="Bordas">
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-lg border border-border bg-surface p-4"><code className="text-label">border · 1px · border</code><p className="text-helper text-fg-muted">Separar e contornar cartões.</p></li>
          <li className="rounded-lg border border-border-strong bg-surface p-4"><code className="text-label">border · 1px · border-strong</code><p className="text-helper text-fg-muted">Campos e controles.</p></li>
          <li className="rounded-lg border-2 border-fg bg-accent-soft p-4"><code className="text-label">border-2 · 2px · fg</code><p className="text-helper text-fg-muted">Selecionado e erro.</p></li>
        </ul>
      </Sub>
      <Sub title="Sombras (tom quente)">
        <ul className="grid gap-4 sm:grid-cols-3">
          {sombras.map((s) => (
            <li key={s.nome} className={cn("rounded-lg bg-surface p-5", s.cls)}>
              <code className="text-label">shadow-{s.nome}</code>
              <p className="text-helper text-fg-muted">{s.uso}</p>
            </li>
          ))}
        </ul>
      </Sub>
    </Section>
  );
}

export function IconsSection() {
  return (
    <Section id="icones" title="Ícones" intro="Uma única família: Lucide, em contorno, com traço fino de 1,5px. O tamanho padrão é 20px junto a texto e 24px na navegação. Ícone sozinho sempre leva um rótulo acessível. O único traço mais grosso (2,5px) é o ✓ dentro de controles pequenos preenchidos, para continuar legível.">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {(Object.keys(icons) as IconName[]).map((n) => (
          <li key={n} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-2 py-4">
            <Icon name={n} size={24} />
            <code className="text-helper text-fg-muted">{n}</code>
          </li>
        ))}
      </ul>
    </Section>
  );
}
