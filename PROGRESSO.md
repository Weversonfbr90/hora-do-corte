# Progresso — Hora do corte v1

Legenda: `[x]` concluído **e conferido pelos critérios de aceite** · `[ ]` pendente.
Backlog completo, critérios de aceite e sprints: [docs/PLANO.md](docs/PLANO.md).

## Sprint 1 — Fundação (acesso)
- [x] **US-01 Criar conta**: nome, celular, e-mail e senha validados no navegador e no servidor (Zod); e-mail repetido avisa; conta nova = cliente; entra direto em Agendar. *(e2e: "criar conta valida campos…")*
- [x] **US-02 Entrar**: cookie de sessão httpOnly; cliente → `/agendar`, barbeiro → `/agenda`, dono → `/painel`; senha errada mostra "E-mail ou senha incorretos". *(e2e)*
- [x] **US-03 Recuperar senha**: link enviado pelo Firebase; mesma mensagem exista ou não a conta. *(e2e)*
- [x] **US-04 Sair**: apaga o cookie; páginas protegidas voltam para Entrar. *(e2e "permissões…")*
- [x] **US-05 Conta do dono**: `npm run definir-dono -- email` (testado no emulador); nenhuma tela promove a dono.
- [x] **US-25 Segurança**: `firestore.rules` nega tudo; acesso só pelo servidor; `.env.example` sem segredos; dependências de produção sem vulnerabilidades (`npm audit --omit=dev`). *(integração: rules.test.ts)*

## Sprint 2 — Gestão
- [x] **US-20 Serviços**: cadastrar, editar, pausar (some para o cliente) e excluir com confirmação; histórico mantém nome/preço. *(e2e)*
- [x] **US-21 Liberar barbeiro**: busca pelo e-mail exato; e-mail inexistente avisa; expediente padrão; o dono pode se liberar ("Eu também atendo"); tirar da equipe com confirmação. *(e2e)*
- [x] **US-22 Expediente e folgas**: dias da semana, início/fim, intervalo opcional; validação (início < fim, intervalo dentro); folgas futuras com aviso se já houver horário marcado. *(unit + e2e)*
- [x] **US-23 Suspender acesso**: confirmação; login bloqueado ("acesso suspenso"); sessões derrubadas; some da lista de barbeiros; dono não suspende a si mesmo; reativar. *(e2e)*
- [x] **US-24 Dados da barbearia**: nome, endereço, telefone, intervalo da grade (15/20/30 min).
- [x] **US-06 Bloqueio de conta suspensa**. *(e2e)*

## Sprint 3 — Agendar
- [x] **US-07 Serviço e barbeiro**: só ativos; busca de serviço por nome; estado vazio. *(e2e)*
- [x] **US-08 Horários livres**: expediente, intervalo, folgas, duração cabendo inteira, nada no passado, até 30 dias, dias sem expediente desabilitados, carregamento e estado vazio. *(unit + integração)*
- [x] **US-09 Confirmar**: validação no servidor; **5 confirmações simultâneas no mesmo horário → só 1 aceita**; a recusada mostra "Esse horário acabou de ser ocupado" e a grade é atualizada. *(integração)*
- [x] **US-10 Resumo**: serviço, barbeiro, data, horário e preço (+ endereço). *(e2e)*

## Sprint 4 — Meus agendamentos
- [x] **US-11 Próximos e histórico**: só os próprios (filtro no servidor); ordem certa; estados vazios. *(e2e)*
- [x] **US-12 Cancelar**: confirmação; horário volta a ficar livre; com menos de 2 h o botão some e aparece a orientação; servidor recusa fora do prazo. *(integração + e2e)*
- [x] **US-13 Remarcar**: novo barbeiro/dia/horário; atômico (se falhar, o horário antigo é mantido). *(integração + e2e)*

## Sprint 5 — Agenda e painel
- [x] **US-14 Agenda do barbeiro**: só a própria; ordem por horário; trocar dia (anterior/próximo/data/hoje); busca por cliente. *(e2e)*
- [x] **US-15 Concluído/falta**: a partir do horário de início; desfazer; outro barbeiro não altera. *(integração + e2e)*
- [x] **US-16 Agenda de todos**: filtro por barbeiro, dia e cliente. *(e2e)*
- [x] **US-17 Totais do dia**: atendimentos, concluídos, faltas, cancelados. *(e2e)*
- [x] **US-18 Agendar para quem ligou**: nome + celular validados; mesmas regras de conflito. *(e2e)*
- [x] **US-19 Gerenciar atendimentos**: dono cancela com confirmação e marca concluído/falta em qualquer agenda. *(integração)*

## Sprint 6 — Qualidade e publicação
- [x] **US-26 Acessibilidade e celular**: componentes do Design System; teclado (grade de horários, seletores, modais); sem rolagem horizontal em 390/768/1280 px; barra inferior no celular e menu lateral ≥ 768 px. *(e2e responsivo.spec.ts)*
- [x] **US-27 Testes**: unitários, integração e ponta a ponta (resultados abaixo).
- [x] **US-28 Publicação — preparação**: README com Firebase + Vercel passo a passo; `.env.example`; `firebase.json` + regras + índices; build de produção OK.
- [ ] **US-28 Publicação — no ar**: bloqueado por falta de acesso (ver "Bloqueios").

## Resultados dos testes (17/11/2026)

| Verificação | Resultado |
|---|---|
| `npm test` (unitários) | **24/24 passaram** |
| Integração com emuladores (Auth + Firestore) | **20/20 passaram** (inclui 5 agendamentos simultâneos → 1 confirmado) |
| `npx playwright test` (Chrome, celular + 3 larguras) | **13/13 passaram** |
| `npm run typecheck` | sem erros |
| `npm run build` | OK, 17 rotas |
| `npm run contrast` | todas as combinações AA |
| `npm audit --omit=dev` | 0 vulnerabilidades (com `overrides` de `@grpc/grpc-js`) |

Observações:
- O console do navegador durante os testes e2e mostrou apenas avisos de hidratação causados por `caret-color: transparent`, que o próprio Playwright injeta para as capturas de tela. Não é um problema do app.
- As ferramentas de desenvolvimento (`firebase-tools`, Playwright etc.) têm alertas do `npm audit` em dependências delas. Elas não vão para produção.

## Bloqueios reais
1. **Projeto Firebase de produção:** não há credenciais nem CLI logada nesta máquina. Tudo foi validado nos emuladores oficiais do Firebase (Auth + Firestore reais, rodando localmente).
2. **Vercel:** não há conta/CLI conectada. O projeto está pronto para importar do GitHub (passo a passo no README).
