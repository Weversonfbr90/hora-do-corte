# Design System — Hora do corte

> **Versão 0.1 — aguardando aprovação.**
> Esta entrega cobre só a camada visual: tokens, componentes e a página de demonstração. Telas, regras de negócio, autenticação e banco de dados ficam para a próxima etapa, depois da aprovação.

- **Demonstração ao vivo:** `npm run dev` → <http://localhost:3000/design-system>
- **Tokens:** [`src/app/globals.css`](src/app/globals.css) (bloco `@theme` do Tailwind CSS 4)
- **Componentes:** [`src/components/ui/`](src/components/ui/), importados de `@/components/ui`
- **Verificação de contraste:** `npm run contrast`

---

## 1. Princípios

1. **Celular primeiro, uma mão só.** Todo alvo de toque tem no mínimo 48 × 48 px, e a ação principal tem 56 px. Ações importantes ficam na metade de baixo da tela, ao alcance do polegar.
2. **Um toque para escolher.** Horário, dia, serviço e barbeiro são escolhidos com um toque, sem listas escondidas sempre que possível.
3. **Barbearia clássica, sem caricatura.** Carvão, creme, couro e madeira dão o tom quente. O azul claro do briefing marca só "o que está escolhido agora".
4. **Acessível por padrão.** WCAG 2.2 AA, foco sempre visível, nada depende só de cor, e tudo funciona pelo teclado e com leitor de tela.
5. **Marca em texto.** Ainda não há logo, então a marca é o nome **"Hora do corte"** escrito em Manrope ExtraBold (componente `Wordmark`), sem símbolo inventado. Quando o logo existir, envie os arquivos (SVG de preferência) para ele substituir o `Wordmark`.

---

## 2. Cores

### 2.1 Paleta base

| Escala | Token | Hex | Observação |
|---|---|---|---|
| Carvão | `carvao-950` | `#1C1917` | Pressionado |
| | `carvao-900` | `#292524` | **Principal / texto do briefing** |
| | `carvao-800` | `#3A3532` | Hover do principal |
| | `carvao-600` | `#635B54` | Texto secundário |
| | `carvao-500` | `#8C8178` | Contorno de campos |
| | `carvao-400` | `#A39A91` | Desabilitado |
| Creme | `creme-0` | `#FFFDF9` | Superfície (cartões, campos) |
| | `creme-50` | `#FAF7F2` | **Fundo do briefing** |
| | `creme-100` | `#F2ECE3` | Superfície alternativa |
| | `creme-200` | `#E2D8C9` | Borda decorativa |
| Couro | `couro-700` | `#7A4A2B` | Texto/ícone de marca |
| | `couro-500` | `#A5714A` | Ilustrativo (não usar em texto) |
| | `couro-100` | `#F3E5D6` | Fundo de avatar/selo |
| Madeira | `madeira-800` | `#5B3F2C` | Títulos de destaque em marketing |
| Celeste | `celeste-300` | `#ADD2FF` | **Destaque do briefing** (só como fundo) |
| | `celeste-100` | `#EAF3FF` | Fundo suave de seleção/info |
| | `celeste-700` | `#1E5A9C` | Destaque acessível: links, foco |

### 2.2 Tokens semânticos (use estes nos componentes)

| Token | Valor | Uso | Classe Tailwind |
|---|---|---|---|
| `bg` | creme-50 | Fundo das telas | `bg-bg` |
| `surface` | creme-0 | Cartões, campos, modais | `bg-surface` |
| `surface-alt` | creme-100 | Hover, desabilitado, trilhos | `bg-surface-alt` |
| `surface-inverse` | carvao-900 | Cabeçalho de marca, menu lateral | `bg-surface-inverse` |
| `fg` | carvao-900 | Texto principal | `text-fg` |
| `fg-muted` | carvao-600 | Texto secundário, mensagens auxiliares | `text-fg-muted` |
| `fg-disabled` | carvao-400 | Só itens desabilitados | `text-fg-disabled` |
| `fg-inverse` | creme-50 | Texto sobre carvão | `text-fg-inverse` |
| `primary` / `-hover` / `-active` | carvao 900/800/950 | Botão principal | `bg-primary` |
| `on-primary` | creme-50 | Texto sobre o principal | `text-on-primary` |
| `accent` / `-hover` / `-active` | `#ADD2FF` / `#93C4FF` / `#7FB8FF` | Item selecionado, botão de destaque | `bg-accent` |
| `accent-soft` | celeste-100 | Fundo de cartão selecionado, hover de horário | `bg-accent-soft` |
| `accent-strong` | celeste-700 | Links, ícones de confirmação | `text-accent-strong` |
| `on-accent` | carvao-900 | Texto sobre o destaque | `text-on-accent` |
| `brand-leather` / `-soft` | couro 700/100 | Avatares, selo "cliente fiel" | `text-brand-leather` |
| `brand-wood` | madeira-800 | Detalhes de marca | `text-brand-wood` |
| `border` | creme-200 | Divisórias (decorativa) | `border-border` |
| `border-strong` | carvao-500 | Contorno de campos e controles | `border-border-strong` |
| `focus` | celeste-700 | Anel de foco | `focus-visible:focus-ring` |
| `success` / `-soft` | `#2C6B3F` / `#E5F1E7` | Confirmado, salvo | `text-success` |
| `warning` / `-soft` | `#7D5300` / `#FBF0D6` | Pendente, atenção | `text-warning` |
| `danger` / `-soft` | `#A8261B` / `#FCEBE8` | Erro, cancelado, destrutivo | `text-danger` |
| `info` / `-soft` | celeste-700 / celeste-100 | Informação neutra | `text-info` |

A paleta padrão do Tailwind foi **desligada** (`--color-*: initial`). Assim, só as cores da marca existem, e ninguém usa um `bg-blue-500` por engano.

---

## 3. Contraste: verificação e ajustes

Metas (WCAG 2.2 AA): **texto ≥ 4,5:1**; **contornos de controles, ícones e anel de foco ≥ 3:1**. Os valores abaixo foram calculados pelo script `npm run contrast` e também aparecem ao vivo na página de demonstração.

| Combinação | Contraste | Resultado |
|---|---|---|
| Texto `#292524` sobre fundo `#FAF7F2` | 14,19:1 | AAA |
| Texto secundário `#635B54` sobre fundo | 6,23:1 | AA |
| Texto secundário sobre `surface-alt` | 5,67:1 | AA |
| Texto creme sobre botão principal | 14,19:1 | AAA |
| Texto carvão sobre destaque `#ADD2FF` | 9,71:1 | AAA |
| **Destaque `#ADD2FF` como texto/borda sobre o fundo** | **1,46:1** | **Falha** |
| Destaque forte `#1E5A9C` (links, foco) sobre o fundo | 6,56:1 | AA |
| Contorno de campo `#8C8178` sobre superfície | 3,74:1 | ≥ 3:1 |
| Couro `#7A4A2B` sobre couro claro | 5,98:1 | AA |
| Sucesso / Aviso / Erro sobre seus fundos suaves | 5,51 / 5,96 / 6,15:1 | AA |

### Ajustes feitos (e por quê)

1. **O destaque `#ADD2FF` não pode ser texto, borda nem anel de foco.** Sobre o creme ele tem só 1,46:1 e fica quase invisível, ainda mais com sol na tela do celular.
   - **Mantido** como cor de destaque, mas **apenas como fundo** com texto carvão por cima (9,71:1): horário selecionado, aba ativa, botão "Destaque".
   - **Criado** o `accent-strong #1E5A9C`, do mesmo matiz azul, para links, ícones de confirmação e anel de foco (6,56:1).
   - **Seleção não depende só da cor:** item selecionado também ganha borda carvão de 2px e um ícone ✓. Isso ajuda daltônicos e quem usa a tela no sol.
2. **Texto secundário escurecido** para `#635B54`. Um cinza mais claro passaria no fundo, mas reprovaria sobre `surface-alt`.
3. **Duas bordas:** `border` (`#E2D8C9`, 1,32:1) é só decorativa, para separar cartões. Tudo que o usuário precisa enxergar para usar (campos, checkbox, horários livres) usa `border-strong` (3,74:1).
4. **Couro e madeira** foram escurecidos até passar como texto. Os tons mais claros (`couro-500`) ficam só para ilustração.
5. **Desabilitado** (`#A39A91`) não precisa atingir contraste segundo a WCAG, mas o estado sempre vem acompanhado de cursor bloqueado e, quando faz sentido, de um texto explicando o motivo (ex.: "De folga hoje").

---

## 4. Tipografia

**Fonte:** Manrope Variable, sem serifa, moderna, com algarismos claros para horários e preços. Ela vem empacotada pelo `@fontsource-variable/manrope`, sem chamada ao Google Fonts em tempo de execução. Horários e valores usam `tabular-nums`, para os números ficarem alinhados.

| Token / classe | Tamanho / altura de linha | Peso | Uso |
|---|---|---|---|
| `text-display` | 32 / 40 px · −2% | 800 | Destaque de horário confirmado, capas |
| `text-h1` | 28 / 36 px · −1,5% | 700 | Título da tela |
| `text-h2` | 22 / 30 px · −1% | 700 | Título de seção, título de modal |
| `text-h3` | 18 / 26 px | 600 | Título de cartão, cabeçalho da barra superior |
| `text-body-lg` | 18 / 28 px | 400 | Introduções, textos de destaque |
| `text-body` | 16 / 24 px | 400 | Texto padrão e **valor dos campos** (evita o zoom automático do iOS) |
| `text-label` | 15 / 22 px | 600 | Rótulos de campo, itens de menu, chips |
| `text-helper` | 14 / 20 px | 400–500 | Mensagens auxiliares e de erro, metadados |
| `text-overline` | 12 / 16 px · +8% · caixa alta | 700 | Só rótulos curtos (ex.: "SEG", "SEU HORÁRIO") |

Regras: frases nunca ficam abaixo de 14px. Títulos são curtos, sem ponto final. Mensagens de erro dizem **o que fazer**: "Use DDD + 9 dígitos", e não "Inválido".

---

## 5. Espaçamento, raios, bordas e sombras

### Espaçamento (base de 4px)

| Passo | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 |
|---|---|---|---|---|---|---|---|---|---|---|
| px | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 |

- **Ritmo:** 6px entre rótulo e campo · 16px entre campos · 24px entre grupos · 40–56px entre seções.
- **Margens laterais:** 16px no celular e 24px a partir de 640px.
- **Alvos de toque:** `touch` = 48px (`min-h-touch`, `size-touch`) · `touch-lg` = 56px (ação principal).

### Raios (cantos suaves)

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 6px | Checkbox, selos pequenos, `kbd` |
| `rounded-md` | 10px | Campos, horários, itens de lista |
| `rounded-lg` | 14px | Botões, cartões, alertas |
| `rounded-xl` | 20px | Modais e folhas inferiores |
| `rounded-full` | 9999px | Avatares, selos de status, chaves |

### Bordas

| Espessura | Cor | Uso |
|---|---|---|
| 1px | `border` | Separar e contornar cartões |
| 1px | `border-strong` | Campos e controles interativos |
| 2px | `fg` | Item **selecionado** (horário, cartão, chip) |
| 2px | `danger` | Campo com **erro** |

### Sombras (tom carvão, nunca preto puro)

| Token | Uso |
|---|---|
| `shadow-sm` | Botões preenchidos, item selecionado |
| `shadow-md` | Cartão em destaque |
| `shadow-lg` | Menus suspensos, modais |

---

## 6. Ícones

- **Família única:** [Lucide](https://lucide.dev), em **contorno, com traço de 1,5px** (`absoluteStrokeWidth`, para o traço não engrossar com o tamanho).
- **Tamanhos:** 16px dentro de selos, 20px junto a texto (padrão) e 24px na navegação e em botões só de ícone.
- **Exceção única:** o ✓ dentro de controles pequenos preenchidos (checkbox, chave, horário selecionado) usa traço de 2,5px para continuar legível.
- **Sempre** importe de `@/components/ui` usando o nome em português (`<Icon name="agenda" />`), nunca direto do `lucide-react`. Assim fica garantido o mesmo traço em todo o app.
- Um ícone sem texto ao lado precisa de rótulo (`IconButton label="…"` ou `Icon label="…"`). Ao lado de texto, ele é decorativo e o leitor de tela o ignora.

Ícones disponíveis: `agenda`, `horario`, `servico`, `cliente`, `equipe`, `painel`, `ajustes`, `local`, `telefone`, `buscar`, `adicionar`, `confirmar`, `fechar`, `voltar`, `anterior`, `proximo`, `expandir`, `sucesso`, `aviso`, `erro`, `info`.

---

## 7. Componentes

Todos os componentes ficam em `src/components/ui/` e são exportados por `@/components/ui`.

### Estados, regra geral

| Estado | Como aparece | Como é anunciado |
|---|---|---|
| **Normal** | Cores do token | — |
| **Hover** | Fundo um passo mais escuro (`*-hover`, `surface-alt`) | — |
| **Foco** | Anel de 3px `#1E5A9C` com folga de 2px (`focus-visible:focus-ring`); só aparece no teclado | Foco nativo |
| **Selecionado** | Fundo `accent`/`primary`, borda carvão de 2px e ícone ✓ | `aria-checked` / `aria-selected` / `aria-current` |
| **Desabilitado** | Fundo `surface-alt`, texto `fg-disabled`, cursor bloqueado | `disabled` ou `aria-disabled` |
| **Erro** | Borda `danger` de 2px, mensagem com ícone abaixo | `aria-invalid` + `aria-describedby` |
| **Carregando** | Spinner no lugar do ícone, botão continua focável | `aria-busy` + texto "Carregando" |

Pressionar um botão encolhe-o levemente (`scale .98`). Se o usuário pede menos movimento (`prefers-reduced-motion`), todas as animações são desligadas.

### Botões — `Button`, `IconButton`

- **Variantes:** `primary` (uma por tela), `secondary`, `accent`, `ghost`, `danger`.
- **Tamanhos:** `md` (48px) e `lg` (56px, para a ação principal, com `fullWidth` no celular).
- **Props:** `loading`, `icon`, `fullWidth`. O `IconButton` exige `label`.

```tsx
<Button size="lg" fullWidth loading={salvando}>Confirmar horário</Button>
<IconButton label="Buscar cliente"><Icon name="buscar" size={24} /></IconButton>
```

### Campos — `TextField`, `TextArea`

- O rótulo fica sempre visível acima do campo. O placeholder é só um exemplo e nunca substitui o rótulo.
- `hint` traz uma mensagem auxiliar e `error` substitui o hint pelo erro, com ícone.
- Use o tipo certo para abrir o teclado certo: `type="tel" inputMode="tel"`, `autoComplete="tel"`, etc.

### Seletores

| Componente | Quando usar |
|---|---|
| `Select` | Lista com mais de 5 opções ou com descrição (ex.: serviços com duração e preço). Combobox ARIA, com teclado completo e busca por letra. |
| `ChipGroup` | De 2 a 7 opções curtas, escolha única (ex.: dias). `layout="scroll"` cria uma faixa horizontal no celular. |
| `SelectableCard` | Opções com mais informação (barbeiro com foto/iniciais, serviço com preço). Use dentro de `role="radiogroup"`. |
| `Checkbox` | Marcar/desmarcar algo que vale ao enviar o formulário. |
| `Switch` | Liga/desliga com efeito imediato (ex.: "Aceitar agendamentos"). |
| `Tabs` | Alternar visões da mesma tela (Hoje / Semana / Mês). |

### Grade de horários — `TimeSlotGrid` (componente principal)

- 3 colunas no celular, 5 a partir de 640px e 6 a partir de 1024px. Cada horário tem 48px de altura.
- **Livre:** contorno `border-strong`. **Selecionado:** fundo `accent`, borda carvão de 2px e ✓. **Ocupado:** riscado, fundo `surface-alt`, fora do foco e do toque. Ele continua visível para o cliente entender a agenda do dia.
- **Carregando:** 9 skeletons no mesmo formato. **Vazio:** a mensagem "Nenhum horário livre neste dia", com uma orientação.
- Funciona como um `radiogroup`: o Tab entra e sai da grade, e as setas andam pelos horários livres.

```tsx
<TimeSlotGrid label="Horários de terça, 18" slots={slots} value={hora} onChange={setHora} loading={carregando} />
```

### Cartões e selos — `Card`, `Badge`, `Avatar`

- `Card tone="flat" | "raised" | "inverse"`.
- `Badge tone="neutral" | "success" | "warning" | "danger" | "info" | "leather"`: sempre com texto.
- `Avatar` mostra as **iniciais** em couro. Não usamos fotos genéricas inventadas.

### Navegação — `TopBar`, `BottomNav`, `SideNav`, `Wordmark`

- **Celular:** `TopBar` (título e Voltar) no topo e `BottomNav` na base, com 3 a 5 destinos, sempre ícone + texto. O item atual tem fundo `accent` e `aria-current="page"`.
- **A partir de 768px:** o painel do dono troca a barra inferior pelo `SideNav` (fundo carvão).

### Alertas — `Alert`

- Tons `info`, `success`, `warning` e `danger`, sempre com ícone, título e texto oculto para leitor de tela ("Erro: …").
- `live="polite"` anuncia avisos que surgem depois de uma ação; `live="assertive"` só serve para erros que bloqueiam a tarefa.
- Podem ter `action` (botão) e `onDismiss` (fechar, 48px).

### Modal — `Modal`

- Usa o `<dialog>` nativo com `showModal()`: o foco fica preso dentro, o resto da página fica inerte, Esc fecha e tocar no fundo também fecha.
- Ao fechar, o foco volta para o botão que abriu o modal.
- **No celular** vira uma folha inferior (sobe da base, com puxador e cantos de 20px). **A partir de 640px** fica centralizado.
- No rodapé, os botões ficam empilhados no celular, com a ação principal mais perto do polegar.

### Carregamento — `Skeleton`, `AppointmentCardSkeleton`, `Spinner`

- O skeleton imita o formato do conteúdo final. O contêiner leva `role="status"` e `aria-label="Carregando …"`, e os blocos são `aria-hidden`.
- O `Spinner` aparece só dentro de botões. Para áreas inteiras, use skeleton.

---

## 8. Navegação por teclado

| Componente | Tecla | Ação |
|---|---|---|
| Qualquer tela | Tab / Shift+Tab | Avança/volta, na ordem visual |
| Página | Tab (primeiro) | Link "Pular para o conteúdo" |
| Botões | Enter ou Espaço | Aciona |
| Seletor | Enter, Espaço, ↓ / ↑ | Abre a lista |
| Seletor | ↑ ↓ · Home · End · letra | Navega pelas opções |
| Seletor | Enter / Esc / Tab | Escolhe / fecha sem mudar / fecha e segue |
| Grade de horários | Tab | Entra no horário selecionado (ou no primeiro livre); outro Tab sai da grade |
| Grade de horários | ← → ↑ ↓ · Home · End | Move entre horários livres e seleciona; os ocupados são pulados |
| Dias, abas, cartões de escolha | ← → · Home · End | Troca a escolha |
| Checkbox, chave | Espaço | Marca/desmarca, liga/desliga |
| Modal | Esc | Fecha e devolve o foco |

---

## 9. Comportamento responsivo

| Faixa | Layout |
|---|---|
| **Celular**, < 640px | Uma coluna e margem de 16px. `BottomNav`, botões principais com largura total e fixos na base, grade de horários com 3 colunas, modal como folha inferior. |
| **Tablet**, 640–1023px | Margem de 24px. Grade com 5 colunas, modal centralizado. `SideNav` no painel do dono a partir de 768px. |
| **Computador**, ≥ 1024px | Conteúdo limitado a 1152px (`max-w-6xl`), grade com 6 colunas, cartões em duas colunas. |

Também considerados: `env(safe-area-inset-bottom)` na barra inferior e nos modais (iPhone com barra de gestos), `100dvh` nas folhas e viewport sem bloqueio de zoom.

---

## 10. Estrutura de arquivos

```
src/
├── app/
│   ├── globals.css            # tokens (@theme) + estilos base + foco
│   ├── layout.tsx             # fonte, idioma pt-BR, cor do tema
│   ├── page.tsx               # redireciona para /design-system (temporário)
│   └── design-system/page.tsx # página de demonstração
├── components/
│   ├── ui/                    # ← Design System (reutilizar no app)
│   │   ├── index.ts
│   │   ├── alert.tsx  button.tsx  card.tsx  choice.tsx  field.tsx
│   │   ├── icon.tsx   modal.tsx   navigation.tsx  select.tsx
│   │   └── skeleton.tsx  spinner.tsx  time-slot-grid.tsx
│   └── demo/                  # só para a página de demonstração (dados fictícios)
└── lib/
    ├── cn.ts                  # junta classes
    └── contrast.ts            # cálculo de contraste WCAG
scripts/contrast.mjs           # npm run contrast
```

---

## 11. Pendências para a próxima etapa

- [ ] **Sua aprovação** desta direção visual, ou os ajustes que você quiser.
- [ ] **Logo:** quando existir, enviar os arquivos (SVG, PNG em fundo transparente e versão clara/escura) para substituir o `Wordmark`.
- [ ] **Documentação funcional** (telas, regras, perfis cliente/equipe/administrador) para começar o app.
- [ ] Ver com os donos de barbearia que você conhece se a grade de horários e o fluxo de 4 passos fazem sentido para os clientes deles.
