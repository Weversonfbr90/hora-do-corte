"use client";

import { useState } from "react";
import { Alert, Avatar, Button, ChipGroup, Icon, SelectableCard, TimeSlotGrid, TopBar, Wordmark } from "@/components/ui";
import { barbearia, barbeiros, dias, horariosDoDia, servicos } from "./data";
import { Section } from "./section";

/** Tela de exemplo montada só com os componentes do Design System, para validar a direção visual. */
export function ExampleScreenSection() {
  const [servico, setServico] = useState<string>("corte");
  const [barbeiro, setBarbeiro] = useState<string>("carlos");
  const [dia, setDia] = useState<string | null>("qui");
  const [hora, setHora] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const s = servicos.find((x) => x.value === servico);
  const d = dias.find((x) => x.value === dia);

  const confirmar = () => {
    setEnviando(true);
    setTimeout(() => { setEnviando(false); setConfirmado(true); }, 1200);
  };

  return (
    <Section id="exemplo" title="Exemplo de tela: agendamento pelo celular" intro="Uma tela montada só com os componentes acima, com dados fictícios. Ela serve para validar a direção visual e não é o app final. O botão de confirmar fica fixo na base, com o resumo da escolha logo acima.">
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="relative w-full max-w-[390px] overflow-hidden rounded-[2rem] border-8 border-carvao-900 bg-bg shadow-lg">
          <div className="h-[720px] overflow-y-auto">
            <div className="bg-surface-inverse px-4 pt-5 pb-6 text-fg-inverse">
              <Wordmark inverse className="text-helper opacity-80" />
              <p className="mt-3 text-h2">{barbearia.nome}</p>
              <p className="mt-1 flex items-center gap-1.5 text-helper text-creme-200"><Icon name="local" size={16} />{barbearia.endereco}</p>
            </div>
            <TopBar title="Agendar horário" />
            {confirmado ? (
              <div className="flex flex-col gap-4 p-4">
                <Alert tone="success" title="Horário confirmado!" live="polite">
                  {s?.label} com {barbeiros.find((b) => b.id === barbeiro)?.nome.split(" ")[0]}, {d?.sublabel} {d?.label}/11 às {hora}.
                </Alert>
                <Button variant="secondary" fullWidth onClick={() => { setConfirmado(false); setHora(null); }}>Fazer outro agendamento</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-6 p-4 pb-40">
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-label">1. Serviço</legend>
                  <div role="radiogroup" aria-label="Serviço" className="flex flex-col gap-2">
                    {servicos.filter((x) => !x.disabled).slice(0, 3).map((x) => (
                      <SelectableCard key={x.value} title={x.label} description={x.description} selected={servico === x.value} onSelect={() => setServico(x.value)} />
                    ))}
                  </div>
                </fieldset>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-label">2. Barbeiro</legend>
                  <div role="radiogroup" aria-label="Barbeiro" className="flex flex-col gap-2">
                    {barbeiros.map((b) => (
                      <SelectableCard key={b.id} title={b.nome.split(" ")[0]!} description={b.info} leading={<Avatar name={b.nome} size="sm" />} selected={barbeiro === b.id} disabled={b.folga} onSelect={() => setBarbeiro(b.id)} />
                    ))}
                  </div>
                </fieldset>
                <div className="flex flex-col gap-3">
                  <p className="text-label">3. Dia</p>
                  <ChipGroup label="Dia" options={dias} value={dia} onChange={(v) => { setDia(v); setHora(null); }} layout="scroll" />
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-label">4. Horário</p>
                  <TimeSlotGrid label={`Horários de ${d?.sublabel} ${d?.label}`} slots={horariosDoDia(dia ?? "qui")} value={hora} onChange={setHora} />
                </div>
              </div>
            )}
          </div>
          {!confirmado && (
            <div className="absolute inset-x-0 bottom-0 border-t border-border bg-surface/95 p-4 backdrop-blur">
              <p className="mb-2 truncate text-helper text-fg-muted" aria-live="polite">
                {hora ? <><strong className="text-fg">{s?.label}</strong> · {d?.sublabel} {d?.label} às {hora}</> : "Escolha um horário para continuar"}
              </p>
              <Button size="lg" fullWidth disabled={!hora} loading={enviando} onClick={confirmar}>
                {enviando ? "Confirmando…" : "Confirmar horário"}
              </Button>
            </div>
          )}
        </div>

        <ul className="flex max-w-md flex-col gap-3 text-body">
          {[
            ["Uma mão só", "O que se toca fica na metade de baixo da tela. O botão final tem 56px e ocupa toda a largura."],
            ["Ordem natural", "Serviço → barbeiro → dia → horário. Cada passo vale o anterior, sem telas extras."],
            ["Resumo sempre visível", "A barra inferior mostra o que foi escolhido antes de confirmar."],
            ["Clássico e quente", "O topo em carvão e os avatares em couro evocam a barbearia tradicional. O azul claro marca só a escolha atual."],
          ].map(([t, txt]) => (
            <li key={t} className="flex gap-3">
              <Icon name="confirmar" className="mt-1 shrink-0 text-accent-strong" />
              <span><strong>{t}.</strong> {txt}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
