"use client";

import { useState } from "react";
import {
  Alert,
  AppointmentCardSkeleton,
  Avatar,
  Badge,
  BottomNav,
  Button,
  Card,
  Checkbox,
  ChipGroup,
  Icon,
  IconButton,
  Modal,
  Select,
  SelectableCard,
  SideNav,
  Skeleton,
  Switch,
  Tabs,
  TextArea,
  TextField,
  TimeSlotGrid,
  TopBar,
  type ButtonVariant,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { agendaDoDia, barbeiros, dias, horariosDoDia, navCliente, navDono, servicos } from "./data";
import { Section, StateLabel, Sub } from "./section";

/* Classes que simulam hover/foco só para a vitrine estática. */
const hoverDe: Record<ButtonVariant, string> = {
  primary: "bg-primary-hover",
  secondary: "bg-surface-alt",
  accent: "bg-accent-hover",
  ghost: "bg-surface-alt",
  danger: "bg-danger-soft",
};
const nomes: Record<ButtonVariant, string> = {
  primary: "Principal",
  secondary: "Secundário",
  accent: "Destaque",
  ghost: "Discreto",
  danger: "Perigo",
};

export function ButtonsSection() {
  const [loading, setLoading] = useState(false);
  const simular = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  };
  const variants: ButtonVariant[] = ["primary", "secondary", "accent", "ghost", "danger"];
  return (
    <Section id="botoes" title="Botões" intro="Altura mínima de 48px (md) e 56px (lg) para a ação principal. Em cada tela só existe um botão principal. No celular, ele ocupa a largura toda e fica na parte de baixo, ao alcance do polegar.">
      <Sub title="Variantes × estados" note="As colunas de hover e foco são simuladas para a vitrine. Passe o mouse ou use Tab nos botões normais para ver o efeito real.">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr>
                {["Variante", "Normal", "Hover", "Foco", "Desabilitado", "Carregando"].map((h) => (
                  <th key={h} scope="col" className="pr-3 pb-1"><StateLabel>{h}</StateLabel></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v}>
                  <th scope="row" className="pr-3 text-label">{nomes[v]}</th>
                  <td className="pr-3"><Button variant={v}>Agendar</Button></td>
                  <td className="pr-3"><Button variant={v} className={hoverDe[v]} tabIndex={-1}>Agendar</Button></td>
                  <td className="pr-3"><Button variant={v} className="focus-ring" tabIndex={-1}>Agendar</Button></td>
                  <td className="pr-3"><Button variant={v} disabled>Agendar</Button></td>
                  <td className="pr-3"><Button variant={v} loading tabIndex={-1}>Agendar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sub>
      <Sub title="Tamanhos, ícone e largura total">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="md" icon={<Icon name="adicionar" />}>Novo horário</Button>
          <Button size="lg" icon={<Icon name="agenda" />}>Agendar agora</Button>
          <Button variant="secondary" icon={<Icon name="telefone" />}>Ligar</Button>
          <IconButton label="Buscar cliente"><Icon name="buscar" size={24} /></IconButton>
          <IconButton label="Ajustes" variant="secondary"><Icon name="ajustes" size={24} /></IconButton>
        </div>
        <div className="max-w-sm">
          <Button size="lg" fullWidth loading={loading} onClick={simular}>
            {loading ? "Confirmando…" : "Confirmar agendamento"}
          </Button>
          <p className="mt-2 text-helper text-fg-muted">Toque para ver o carregamento real (1,8s). O botão mantém o foco e anuncia “Carregando”.</p>
        </div>
      </Sub>
    </Section>
  );
}

export function FieldsSection() {
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("(11) 9");
  return (
    <Section id="campos" title="Campos" intro="O rótulo fica sempre visível acima do campo, nunca só como placeholder. O texto tem 16px, para o iPhone não dar zoom. Os erros aparecem abaixo, em vermelho, com ícone e texto que diz como corrigir.">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1"><StateLabel>Normal + dica</StateLabel>
          <TextField label="Seu nome" placeholder="Como o barbeiro vai te chamar" hint="Só o primeiro nome já basta." value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Com ícone + teclado numérico</StateLabel>
          <TextField label="WhatsApp" required leadingIcon={<Icon name="telefone" />} type="tel" inputMode="tel" autoComplete="tel" value={tel} onChange={(e) => setTel(e.target.value)} hint="Para enviar o lembrete do horário." />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Foco (simulado)</StateLabel>
          <TextField label="E-mail" defaultValue="marcos@" className="border-focus ring-[3px] ring-focus/30" tabIndex={-1} />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Erro</StateLabel>
          <TextField label="WhatsApp" required type="tel" defaultValue="(11) 9123" error="Número incompleto. Use DDD + 9 dígitos, ex.: (11) 91234-5678." />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Desabilitado</StateLabel>
          <TextField label="Barbearia" defaultValue="Barbearia Exemplo" disabled hint="Definido pelo dono da barbearia." />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Área de texto</StateLabel>
          <TextArea label="Observação para o barbeiro" placeholder="Ex.: manter o comprimento em cima" hint="Opcional · até 200 caracteres." maxLength={200} />
        </div>
      </div>
    </Section>
  );
}

export function SelectorsSection() {
  const [servico, setServico] = useState<string | null>("corte");
  const [servicoErro, setServicoErro] = useState<string | null>(null);
  const [dia, setDia] = useState<string | null>("ter");
  const [barbeiro, setBarbeiro] = useState<string | null>("carlos");
  const [lembrete, setLembrete] = useState(true);
  const [termos, setTermos] = useState(false);
  const [aberto, setAberto] = useState(true);
  const [aba, setAba] = useState("hoje");

  return (
    <Section id="seletores" title="Seletores" intro="São seletores feitos sob medida, mas com o comportamento de teclado e de leitor de tela dos controles nativos.">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1"><StateLabel>Seletor (lista suspensa)</StateLabel>
          <Select label="Serviço" options={servicos} value={servico} onChange={setServico} hint="O preço final é pago na barbearia." />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Erro</StateLabel>
          <Select label="Serviço" options={servicos} value={servicoErro} onChange={setServicoErro} required error={servicoErro ? undefined : "Escolha um serviço para ver os horários."} />
        </div>
        <div className="flex flex-col gap-1"><StateLabel>Desabilitado</StateLabel>
          <Select label="Serviço" options={servicos} value="corte" onChange={() => {}} disabled />
        </div>
      </div>

      <Sub title="Faixa de dias (rolagem horizontal no celular)" note="Domingo aparece desabilitado: a barbearia fecha.">
        <ChipGroup label="Dia do atendimento" options={dias} value={dia} onChange={setDia} layout="scroll" />
      </Sub>

      <Sub title="Cartões de escolha (barbeiro)">
        <div role="radiogroup" aria-label="Barbeiro" className="flex max-w-xl flex-col gap-2">
          {barbeiros.map((b) => (
            <SelectableCard
              key={b.id}
              title={b.nome}
              description={b.info}
              meta={b.folga ? undefined : b.proximo}
              leading={<Avatar name={b.nome} />}
              selected={barbeiro === b.id}
              disabled={b.folga}
              onSelect={() => setBarbeiro(b.id)}
            />
          ))}
        </div>
      </Sub>

      <div className="grid gap-6 sm:grid-cols-2">
        <Sub title="Caixas de seleção">
          <div>
            <Checkbox label="Me lembrar 1 hora antes" description="Pelo WhatsApp informado." checked={lembrete} onChange={setLembrete} />
            <Checkbox label="Aceito a política de cancelamento" checked={termos} onChange={setTermos} error={termos ? undefined : "Marque para continuar."} />
            <Checkbox label="Pagar adiantado (em breve)" checked={false} onChange={() => {}} disabled />
          </div>
        </Sub>
        <Sub title="Chave liga/desliga">
          <div className="divide-y divide-border">
            <Switch label="Aceitar agendamentos" description="Desligue para pausar a agenda online." checked={aberto} onChange={setAberto} />
            <Switch label="Confirmar cada horário manualmente" checked={false} onChange={() => {}} disabled description="Disponível no plano completo." />
          </div>
        </Sub>
      </div>

      <Sub title="Abas">
        <div className="max-w-md">
          <Tabs label="Período da agenda" idPrefix="demo" current={aba} onChange={setAba} tabs={[{ id: "hoje", label: "Hoje" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mês" }]} />
          <div id={`demo-panel-${aba}`} role="tabpanel" aria-labelledby={`demo-tab-${aba}`} tabIndex={0} className="mt-3 rounded-md p-1 text-helper text-fg-muted focus-visible:focus-ring">
            Mostrando a agenda de: <strong className="text-fg">{aba === "hoje" ? "hoje" : aba === "semana" ? "esta semana" : "este mês"}</strong>.
          </div>
        </div>
      </Sub>
    </Section>
  );
}

export function SlotsSection() {
  const [dia, setDia] = useState<string | null>("ter");
  const [hora, setHora] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const trocarDia = (d: string) => {
    setDia(d);
    setHora(null);
    setCarregando(true);
    setTimeout(() => setCarregando(false), 700);
  };
  const diaInfo = dias.find((d) => d.value === dia);

  return (
    <Section id="horarios" title="Grade de horários" intro="É o componente principal do app: o cliente escolhe o horário com um toque. A grade tem 3 colunas no celular e ganha mais colunas em telas maiores. Horários ocupados continuam visíveis, mas riscados, para o cliente entender a agenda. Os livres têm 48px de altura.">
      <Card padding="lg" className="flex max-w-3xl flex-col gap-5">
        <ChipGroup label="Dia" options={dias} value={dia} onChange={trocarDia} layout="scroll" />
        <div className="flex items-baseline justify-between">
          <h3 className="text-h3">Horários livres</h3>
          <span className="text-helper text-fg-muted">{diaInfo?.sublabel}, {diaInfo?.label} de nov.</span>
        </div>
        <TimeSlotGrid label={`Horários de ${diaInfo?.sublabel} ${diaInfo?.label}`} slots={horariosDoDia(dia ?? "ter")} value={hora} onChange={setHora} loading={carregando} />
        <p aria-live="polite" className="text-body">
          {hora ? <>Selecionado: <strong>{diaInfo?.sublabel}, {diaInfo?.label} às {hora}</strong></> : <span className="text-fg-muted">Nenhum horário escolhido.</span>}
        </p>
        <p className="text-helper text-fg-muted">Experimente: troque o dia (carregamento simulado). Quarta está lotada (estado vazio). Use Tab para entrar na grade e as setas para andar.</p>
      </Card>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2"><StateLabel>Livre</StateLabel>
          <TimeSlotGrid label="Exemplo livre" columns={3} responsive={false} slots={[{ time: "14:30", available: true }]} value={null} onChange={() => {}} />
        </div>
        <div className="flex flex-col gap-2"><StateLabel>Selecionado</StateLabel>
          <TimeSlotGrid label="Exemplo selecionado" columns={3} responsive={false} slots={[{ time: "14:30", available: true }]} value="14:30" onChange={() => {}} />
        </div>
        <div className="flex flex-col gap-2"><StateLabel>Ocupado</StateLabel>
          <TimeSlotGrid label="Exemplo ocupado" columns={3} responsive={false} slots={[{ time: "15:00", available: false }, { time: "15:30", available: true }]} value={null} onChange={() => {}} />
        </div>
      </div>
    </Section>
  );
}

const statusBadge = {
  confirmado: { tone: "success", txt: "Confirmado" },
  pendente: { tone: "warning", txt: "Pendente" },
  cancelado: { tone: "danger", txt: "Cancelado" },
} as const;

export function CardsSection() {
  return (
    <Section id="cartoes" title="Cartões e selos" intro="Os cartões usam borda fina e fundo claro. A sombra fica só nos cartões em destaque. Os selos de status sempre trazem texto junto com a cor.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Sub title="Agenda do dia (dono)">
          <ul className="flex flex-col gap-2">
            {agendaDoDia.map((a) => (
              <li key={a.hora}>
                <Card className="flex items-center gap-4">
                  <span className="w-14 shrink-0 text-h3 tabular-nums">{a.hora}</span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-label", a.status === "cancelado" && "text-fg-muted line-through")}>{a.cliente}</p>
                    <p className="truncate text-helper text-fg-muted">{a.servico} · {a.barbeiro}</p>
                  </div>
                  <Badge tone={statusBadge[a.status].tone}>{statusBadge[a.status].txt}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        </Sub>
        <Sub title="Resumo do agendamento (cliente)">
          <Card tone="inverse" padding="lg" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-overline uppercase text-accent">Seu horário</span>
              <Badge tone="success">Confirmado</Badge>
            </div>
            <p className="text-display tabular-nums">Ter, 18 · 14:30</p>
            <div className="flex items-center gap-3">
              <Avatar name="Carlos Mendes" />
              <div>
                <p className="text-label">Corte + barba com Carlos</p>
                <p className="text-helper text-creme-200">50 min · R$ 65,00</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-helper text-creme-200"><Icon name="local" /> Rua das Palmeiras, 120 — Centro</p>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Badge>Neutro</Badge>
            <Badge tone="info">Novo cliente</Badge>
            <Badge tone="leather">Cliente fiel</Badge>
            <Badge tone="success">Confirmado</Badge>
            <Badge tone="warning">Pendente</Badge>
            <Badge tone="danger">Faltou</Badge>
          </div>
        </Sub>
      </div>
    </Section>
  );
}

export function NavigationSection() {
  const [cli, setCli] = useState("agendar");
  const [dono, setDono] = useState("agenda");
  return (
    <Section id="navegacao" title="Navegação" intro="No celular, a navegação principal fica numa barra inferior (de 3 a 5 destinos, com ícone e texto), na área do polegar. A partir de 768px (tablet e computador), o painel do dono passa a usar um menu lateral. O cabeçalho de cada tela tem título e um botão Voltar com 48px de área de toque.">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Sub title="Cliente — celular">
          <div className="w-full max-w-[360px] overflow-hidden rounded-xl border border-border bg-bg shadow-md">
            <TopBar title="Agendar horário" onBack={() => {}} action={<IconButton label="Ajuda"><Icon name="info" size={24} /></IconButton>} />
            <div className="flex h-40 flex-col gap-2 p-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <BottomNav items={navCliente} current={cli} onNavigate={setCli} position="static" />
          </div>
        </Sub>
        <Sub title="Dono — tablet e desktop">
          <div className="flex h-[360px] max-w-[560px] overflow-hidden rounded-xl border border-border shadow-md">
            <SideNav items={navDono} current={dono} onNavigate={setDono} />
            <div className="hidden flex-1 flex-col gap-3 bg-bg p-5 sm:flex">
              <p className="text-h2 capitalize">{navDono.find((n) => n.id === dono)?.label}</p>
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
            </div>
          </div>
        </Sub>
      </div>
    </Section>
  );
}

export function FeedbackSection() {
  const [visivel, setVisivel] = useState(true);
  const [modal, setModal] = useState(false);
  const [cancelar, setCancelar] = useState(false);
  return (
    <Section id="alertas" title="Alertas e modais" intro="Os alertas sempre têm ícone, título e cor, então nenhum depende só da cor. O leitor de tela anuncia sozinho os que surgem depois de uma ação. No celular, o modal vira uma folha que sobe da base da tela. Ele prende o foco, fecha com Esc e devolve o foco a quem o abriu.">
      <div className="grid gap-3 lg:grid-cols-2">
        <Alert tone="info" title="Agenda de dezembro liberada">Os horários até 31/12 já podem ser escolhidos.</Alert>
        <Alert tone="success" title="Horário confirmado!">Enviamos o lembrete para o seu WhatsApp.</Alert>
        <Alert tone="warning" title="Chegue 5 minutos antes">Atrasos acima de 15 minutos podem perder o horário.</Alert>
        <Alert tone="danger" title="Esse horário acabou de ser ocupado" action={<Button variant="secondary">Ver outros horários</Button>}>
          Outra pessoa confirmou primeiro. Escolha outro horário.
        </Alert>
        {visivel ? (
          <Alert tone="info" title="Alerta que pode ser fechado" onDismiss={() => setVisivel(false)}>Toque no × para dispensar.</Alert>
        ) : (
          <Button variant="ghost" onClick={() => setVisivel(true)}>Mostrar o alerta de novo</Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setModal(true)}>Abrir confirmação</Button>
        <Button variant="danger" onClick={() => setCancelar(true)}>Cancelar horário</Button>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Confirmar agendamento?"
        description="Confira os dados antes de confirmar."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)} className="sm:w-auto" fullWidth>Voltar</Button>
            <Button onClick={() => setModal(false)} className="sm:w-auto" fullWidth size="lg">Confirmar</Button>
          </>
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
          <dt className="text-fg-muted">Serviço</dt><dd className="font-semibold">Corte + barba</dd>
          <dt className="text-fg-muted">Barbeiro</dt><dd className="font-semibold">Carlos Mendes</dd>
          <dt className="text-fg-muted">Quando</dt><dd className="font-semibold">Ter, 18/11 às 14:30</dd>
          <dt className="text-fg-muted">Valor</dt><dd className="font-semibold">R$ 65,00</dd>
        </dl>
      </Modal>

      <Modal
        open={cancelar}
        onClose={() => setCancelar(false)}
        title="Cancelar este horário?"
        description="O horário de terça às 14:30 volta a ficar livre para outros clientes."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelar(false)} fullWidth className="sm:w-auto">Manter horário</Button>
            <Button variant="danger" onClick={() => setCancelar(false)} fullWidth className="sm:w-auto">Sim, cancelar</Button>
          </>
        }
      />
    </Section>
  );
}

export function SkeletonSection() {
  return (
    <Section id="skeletons" title="Carregamento (skeletons)" intro="Enquanto os dados carregam, blocos com o formato do conteúdo final evitam que a tela “pule”. O leitor de tela ouve uma única mensagem de “carregando”, e não cada bloco. Se o usuário pede menos movimento, o brilho fica parado.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div role="status" aria-label="Carregando agenda" className="flex flex-col gap-2">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
        <div className="flex flex-col gap-3">
          <TimeSlotGrid label="Horários" slots={[]} value={null} onChange={() => {}} loading />
        </div>
      </div>
    </Section>
  );
}
