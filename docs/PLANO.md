# Plano de implementação — Hora do corte v1

## 1. Escopo da v1

**Dentro:** contas (criar, entrar, recuperar senha, sair); agendamento pelo cliente (serviço → barbeiro → dia → horário livre → resumo); meus agendamentos (próximos, histórico, remarcar, cancelar); agenda do barbeiro (dia, concluído/falta); painel do dono (todas as agendas, filtros, totais do dia, agendamento para quem ligou); serviços e equipe (serviços, liberar barbeiro, expediente, folgas, suspender acesso).

**Fora (próximas versões):** pagamentos, lembretes por WhatsApp, fidelidade, fotos de cortes, relatórios financeiros, várias barbearias.

## 2. Suposições (decididas por mim, registradas aqui)

| # | Suposição | Motivo |
|---|---|---|
| S1 | Fuso horário fixo da barbearia: `America/Sao_Paulo`. | Uma barbearia só, no Brasil. |
| S2 | Os horários são oferecidos de 30 em 30 min a partir do início do expediente. O dono pode mudar para 15 ou 20 min em Gestão → Barbearia. | Grade simples, mas ajustável. |
| S3 | O expediente é semanal (por dia da semana), com intervalo opcional (almoço) e folgas em datas específicas. | É o que "horário de trabalho e folgas" pede. |
| S4 | O cliente vê **apenas horários livres** (conforme o briefing funcional). A grade do Design System continua suportando "ocupado", mas o app não o exibe para o cliente. | O briefing funcional prevalece sobre a demonstração. |
| S5 | "Até 2 horas antes": o cliente pode cancelar ou remarcar se faltarem **2 horas ou mais**. O dono pode cancelar a qualquer momento. | Regra de negócio + dono gerencia a agenda. |
| S6 | "Até 30 dias de antecedência": dias de hoje até hoje + 30. Horários de hoje que já passaram não aparecem. | Regra de negócio. |
| S7 | Remarcar = escolher novo barbeiro/dia/horário para o **mesmo serviço**. A troca é atômica: o horário antigo só é liberado se o novo for confirmado. | Evita perder o horário antigo. |
| S8 | Concluído/falta só pode ser marcado a partir do horário de início do atendimento. É possível desfazer. | Não faz sentido marcar falta antes da hora. |
| S9 | Agendamento para quem ligou: o dono informa nome e celular. Não é preciso que a pessoa tenha conta. | "Cria um agendamento para quem ligou". |
| S10 | Liberar barbeiro: o dono procura a conta pelo **e-mail exato** (não há lista de clientes, para preservar a privacidade). | "Cada pessoa vê apenas seus próprios dados". |
| S11 | Suspender acesso desativa o login (Firebase Auth `disabled`), revoga as sessões e tira o barbeiro da lista de agendamento. Agendamentos já feitos continuam na agenda do dono. | "Suspende acessos". |
| S12 | O dono pode também atender: em Equipe, ele pode se liberar como barbeiro. Nesse caso ganha também a tela Agenda. | Barbearias pequenas: o dono costuma cortar. |
| S13 | A conta do dono é definida na configuração inicial pelo comando `npm run definir-dono -- email`, executado por quem instala o app. | "A conta do dono é definida na configuração inicial". |
| S14 | Senha com no mínimo 8 caracteres. Celular brasileiro com DDD (10 ou 11 dígitos). | Campos essenciais validados. |
| S15 | O "Pesquisar e filtrar" do Agendar = busca de serviço por nome. Na Agenda/Painel = busca por nome do cliente + filtros de dia e barbeiro. | Pesquisa onde o briefing pede. |

## 3. Arquitetura

```
Navegador ──(Firebase Auth SDK: criar conta*, entrar, recuperar senha)──► Firebase Authentication
    │
    │  ID token  ──► POST /api/sessao ──► cookie de sessão httpOnly (5 dias)
    ▼
Next.js (App Router, servidor)
    ├─ Server Components: leem dados com Firebase Admin SDK, filtrados pelo perfil
    ├─ Server Actions: TODA gravação passa aqui (validação Zod + checagem de perfil + transação)
    └─ Firestore (Admin SDK)
Firestore Security Rules: negam QUALQUER acesso direto do navegador (allow read, write: if false)
* a conta é criada no servidor (Server Action com Admin SDK) para validar os campos e gravar o perfil
```

- **Regras de acesso no servidor:** o navegador nunca fala com o Firestore. Cada leitura e gravação passa pelo servidor, que verifica o cookie de sessão (`verifySessionCookie(..., checkRevoked=true)`), o perfil e o dono do dado.
- **Horário duplo:** cada agendamento atualiza, **na mesma transação**, o documento `barberDays/{barbeiroId}_{data}`, que guarda os intervalos ocupados. Duas transações simultâneas no mesmo dia/barbeiro disputam o mesmo documento: o Firestore confirma a primeira e refaz a segunda, que então encontra o horário ocupado e é recusada.
- **Ambiente local:** Firebase Emulator Suite (Auth + Firestore) com projeto `demo-hora-do-corte`. É Firebase de verdade rodando localmente, sem precisar de conta Google.

## 4. Modelo de dados (Firestore)

| Coleção | Documento | Campos principais |
|---|---|---|
| `users` | `{uid}` | name, phone, email, role (`cliente` \| `barbeiro` \| `dono`), status (`ativo` \| `suspenso`), createdAt |
| `barbers` | `{uid}` | name, active, schedule (0–6 → {works, start, end, breakStart?, breakEnd?}), daysOff [YYYY-MM-DD], updatedAt |
| `services` | `{id}` | name, durationMin, priceCents, active, createdAt |
| `appointments` | `{id}` | clientId (ou null), clientName, clientPhone, barberId, barberName, serviceId, serviceName, durationMin, priceCents, date, startMin, endMin, startAt, status (`agendado` \| `concluido` \| `falta` \| `cancelado`), source (`app` \| `telefone`), createdBy, createdAt, updatedAt, cancelledAt?, cancelledBy? |
| `barberDays` | `{barberId}_{date}` | barberId, date, busy {appointmentId → {start, end}} |
| `settings` | `barbearia` | name, address, phone, slotStepMin |

Relacionamentos: `users 1—0..1 barbers`; `appointments N—1 barbers`, `N—1 services` (dados copiados para o histórico não mudar), `N—0..1 users (cliente)`.

## 5. Mapa de páginas

| Rota | Perfil | Conteúdo |
|---|---|---|
| `/entrar`, `/criar-conta`, `/recuperar-senha` | público | Acesso |
| `/` | logado | Redireciona: cliente → `/agendar`, barbeiro → `/agenda`, dono → `/painel` |
| `/agendar` | todos | Serviço → barbeiro → dia → horário → confirmar → resumo |
| `/meus-agendamentos` | todos | Próximos e histórico; cancelar |
| `/meus-agendamentos/[id]/remarcar` | dono do agendamento | Escolher novo horário |
| `/agenda` | barbeiro (ou dono que atende) | Agenda do dia, concluído/falta |
| `/painel` | dono | Agenda de todos, filtros, totais |
| `/painel/novo` | dono | Agendamento para quem ligou |
| `/gestao/servicos` | dono | Serviços |
| `/gestao/equipe` e `/gestao/equipe/[id]` | dono | Barbeiros, expediente, folgas, suspender |
| `/gestao/barbearia` | dono | Nome, endereço, intervalo da grade |
| `/conta` | logado | Meus dados e sair |
| `/design-system` | público | Referência visual (etapa 1) |

## 6. Estratégia de testes

1. **Unitários (Vitest):** cálculo de horários livres, datas/fuso, prazo de 2h, janela de 30 dias, validações.
2. **Integração (Vitest + emuladores):** transação de agendamento com 2 clientes simultâneos, cancelar/remarcar, permissões das ações por perfil, regras do Firestore negando acesso direto.
3. **Ponta a ponta (Playwright + Chrome instalado):** criar conta → agendar → meus agendamentos → barbeiro conclui → painel do dono; telas em 390px, 768px e 1280px.
4. `next build` + `tsc` + `npm run contrast`.

---

## 7. Backlog

### Épico E1 — Acesso

**US-01 Criar conta.** Como **visitante**, quero criar minha conta com nome, celular, e-mail e senha, para agendar meus cortes.
- Critérios: todos os campos são obrigatórios e validados no servidor; e-mail repetido mostra uma mensagem clara; a conta nova entra como **cliente**; depois de criar, a pessoa já entra e vai para Agendar.
- Dependências: —. Tarefas: Server Action `criarConta` (Admin SDK), perfil em `users`, tela `/criar-conta`.

**US-02 Entrar.** Como **usuário**, quero entrar com e-mail e senha e cair direto na minha tela, para não perder tempo.
- Critérios: cliente → Agendar, barbeiro → Agenda, dono → Painel; senha errada mostra erro sem dizer qual campo falhou; cookie de sessão httpOnly.
- Dependências: US-01. Tarefas: `/api/sessao`, `getSession`, redirecionamento por perfil.

**US-03 Recuperar senha.** Como **usuário**, quero receber um link para criar uma nova senha, para voltar a entrar.
- Critérios: e-mail obrigatório; mensagem igual exista ou não a conta (privacidade); link enviado pelo Firebase.
- Dependências: US-01.

**US-04 Sair.** Como **usuário**, quero sair da conta, para proteger meus dados num celular compartilhado.
- Critérios: o cookie é apagado; voltar a qualquer página protegida leva para Entrar.

**US-05 Conta do dono.** Como **quem instala o app**, quero definir a conta do dono na configuração inicial, para que só ela administre.
- Critérios: o comando `npm run definir-dono -- email` promove a conta existente; nenhuma tela permite virar dono.

**US-06 Bloqueio de acesso suspenso.** Como **dono**, quero que uma conta suspensa não consiga entrar, para proteger a agenda.
- Critérios: a sessão ativa é encerrada; o login mostra "acesso suspenso".
- Dependências: US-23.

### Épico E2 — Agendar (cliente)

**US-07 Escolher serviço e barbeiro.** Como **cliente**, quero ver os serviços com preço e duração, pesquisar pelo nome e escolher o barbeiro, para montar meu atendimento.
- Critérios: só serviços ativos; busca filtra por nome; só barbeiros ativos (não suspensos); estado vazio quando não há serviço/barbeiro.

**US-08 Ver horários livres.** Como **cliente**, quero ver só os horários livres do dia escolhido, para escolher com um toque.
- Critérios: respeita expediente, intervalo e folgas do barbeiro; o serviço inteiro cabe antes do fim do expediente/intervalo; nada no passado; no máximo 30 dias à frente; dias sem expediente desabilitados; carregamento e estado vazio.
- Dependências: US-07, US-22.

**US-09 Confirmar agendamento.** Como **cliente**, quero confirmar o horário, para ele entrar na agenda do barbeiro.
- Critérios: validação no servidor (serviço, barbeiro, janela, horário livre); se dois clientes confirmam o mesmo horário ao mesmo tempo, só o primeiro é aceito e o segundo recebe "esse horário acabou de ser ocupado" com a grade atualizada.

**US-10 Resumo.** Como **cliente**, quero ver um resumo com serviço, barbeiro, data, horário e preço, para ter certeza do que marquei.

### Épico E3 — Meus agendamentos

**US-11 Próximos e histórico.** Como **cliente**, quero ver meus próximos cortes e o histórico, para me organizar.
- Critérios: vejo apenas os meus; próximos em ordem crescente; histórico (passados, concluídos, faltas, cancelados) em ordem decrescente; estados vazios.

**US-12 Cancelar.** Como **cliente**, quero cancelar até 2 horas antes, para liberar o horário.
- Critérios: pede confirmação; o horário volta a ficar livre; com menos de 2 h o botão some e aparece uma orientação; o servidor recusa fora do prazo.

**US-13 Remarcar.** Como **cliente**, quero trocar o dia/horário até 2 horas antes, sem perder o horário atual se o novo falhar.

### Épico E4 — Agenda do barbeiro

**US-14 Ver o dia.** Como **barbeiro**, quero ver meus atendimentos do dia em ordem, com nome do cliente e serviço, trocar o dia e buscar um cliente.
- Critérios: vê só a própria agenda; navegação por dia (anterior/próximo/escolher data); busca por nome; estado vazio.

**US-15 Concluído ou falta.** Como **barbeiro**, quero marcar cada atendimento como concluído ou falta, para registrar o que aconteceu.
- Critérios: só a partir do horário de início; pode desfazer; não altera agendamentos de outro barbeiro (checado no servidor).

### Épico E5 — Painel do dono

**US-16 Agenda de todos.** Como **dono**, quero ver a agenda de todos os barbeiros e filtrar por barbeiro, dia e cliente.

**US-17 Totais do dia.** Como **dono**, quero ver o total de atendimentos, concluídos, faltas e cancelados do dia, para acompanhar o movimento.

**US-18 Agendar para quem ligou.** Como **dono**, quero criar um agendamento com nome e celular de quem ligou, para não precisar de caderno.
- Critérios: as mesmas regras de horário livre e de conflito do cliente.

**US-19 Gerenciar atendimentos.** Como **dono**, quero cancelar (com confirmação) e marcar concluído/falta em qualquer agenda.

### Épico E6 — Serviços e equipe

**US-20 Serviços.** Como **dono**, quero cadastrar, editar, pausar e excluir serviços com preço e duração.
- Critérios: nome, preço e duração obrigatórios; excluir pede confirmação; agendamentos antigos mantêm nome e preço.

**US-21 Liberar barbeiro.** Como **dono**, quero liberar uma conta existente como barbeiro, pelo e-mail.
- Critérios: e-mail inexistente mostra mensagem; a conta passa a barbeiro com expediente padrão; o dono pode remover o perfil de barbeiro (com confirmação).

**US-22 Expediente e folgas.** Como **dono**, quero definir o horário de trabalho semanal, o intervalo e as folgas de cada barbeiro.
- Critérios: início < fim; intervalo dentro do expediente; folgas futuras listadas e removíveis.

**US-23 Suspender acesso.** Como **dono**, quero suspender e reativar o acesso de uma pessoa da equipe.
- Critérios: pede confirmação; o login é bloqueado; o barbeiro some da lista de agendamento; o dono não pode suspender a si mesmo.

**US-24 Dados da barbearia.** Como **dono**, quero informar nome, endereço, telefone e o intervalo da grade de horários.

### Épico E7 — Qualidade e publicação

**US-25 Segurança.** Regras do Firestore negam acesso direto; segredos só em variáveis de ambiente; `.env.example` sem credenciais.
**US-26 Acessibilidade e celular.** Interface fiel ao Design System, teclado, 390/768/1280 px.
**US-27 Testes.** Unitários, integração com emuladores e ponta a ponta.
**US-28 Publicação.** README com configuração, execução e passo a passo da Vercel + Firebase.

---

## 8. Sprints (ordem por dependência)

| Sprint | Objetivo | Histórias | Resultado demonstrável |
|---|---|---|---|
| 1 — Fundação | Firebase, sessão e acesso | US-01–05, US-25 | Criar conta, entrar, sair, recuperar senha, dono definido por comando |
| 2 — Gestão | Dono configura a barbearia | US-20–24, US-06 | Serviços cadastrados, barbeiro liberado com expediente e folga, suspensão |
| 3 — Agendar | Fluxo principal do cliente | US-07–10 | Cliente agenda e vê o resumo; conflito simultâneo recusado |
| 4 — Meus agendamentos | Autoatendimento do cliente | US-11–13 | Cancelar e remarcar dentro do prazo |
| 5 — Agenda e painel | Operação da barbearia | US-14–19 | Barbeiro conclui/marca falta; dono filtra, vê totais e agenda quem ligou |
| 6 — Qualidade | Testes, responsividade, documentação | US-26–28 | Build, testes verdes, README de publicação |
