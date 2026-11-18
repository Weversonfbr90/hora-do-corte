# Hora do corte

Um aplicativo para donos de pequenas barbearias que automatiza o agendamento de horários pelos clientes, sem interrupções e perdas financeiras no WhatsApp.

O cliente escolhe **serviço → barbeiro → dia → horário livre** e confirma. O horário entra direto na agenda do barbeiro, sem ninguém precisar parar o corte para digitar.

| Perfil | O que faz |
|---|---|
| **Cliente** | Cria a conta, agenda, vê os próximos cortes e o histórico, cancela ou remarca até 2 h antes |
| **Barbeiro** | Vê a própria agenda do dia, busca o cliente, marca concluído ou falta |
| **Dono** | Vê a agenda de todos, filtra, acompanha os totais do dia, agenda para quem ligou, cadastra serviços, libera barbeiros, define expediente e folgas, suspende acessos |

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Firebase Authentication + Firestore (Admin SDK no servidor) · Zod · Vitest · Playwright

## Segurança e permissões

- **O navegador nunca acessa o banco.** As regras do Firestore (`firestore.rules`) negam qualquer leitura ou escrita direta.
- Toda leitura e gravação passa pelo servidor (Server Components e Server Actions), que confere o **cookie de sessão httpOnly**, o perfil da pessoa e o dono de cada dado.
- **Mesmo horário duas vezes é impossível:** cada agendamento é gravado numa transação que também atualiza o documento do dia do barbeiro. Se dois clientes confirmam ao mesmo tempo, só o primeiro passa (há teste automatizado com 5 confirmações simultâneas).
- Contas suspensas têm o login desativado e as sessões abertas derrubadas na hora.
- Segredos só em variáveis de ambiente. O `.env.example` não tem credenciais.

## Como rodar no computador (sem conta Google)

Requisitos: **Node.js 20.9+** e **Java 21+** (usado pelos emuladores do Firebase).

```bash
npm install
cp .env.example .env.local      # já vem pronto para os emuladores
npm run emulators               # terminal 1: Firebase Auth + Firestore locais (painel em http://127.0.0.1:4000)
npm run seed                    # terminal 2: cria dados FICTÍCIOS de teste
npm run dev                     # terminal 2: app em http://localhost:3000
```

Contas fictícias criadas pelo `seed` (existem **só no emulador local**):

| Perfil | E-mail | Senha |
|---|---|---|
| Dono | `dono@exemplo.test` | `senha-teste-123` |
| Barbeiro | `carlos@exemplo.test` / `junior@exemplo.test` | `senha-teste-123` |
| Cliente | `cliente@exemplo.test` | `senha-teste-123` |

> No emulador, o e-mail de "recuperar senha" não é enviado de verdade: o link aparece no painel dos emuladores (http://127.0.0.1:4000/auth).

## Testes

| Comando | O que verifica |
|---|---|
| `npm test` | Unitários: horários livres, expediente, intervalo, folgas, fuso, prazo de 2 h, janela de 30 dias, validações |
| `npm run test:integracao` | Com emuladores (sobe e derruba sozinho): transação com clientes simultâneos, cancelar/remarcar, permissões, regras do Firestore |
| `npm run test:e2e` | Ponta a ponta no Chrome instalado (com `emulators` + `seed` + `dev` rodando; defina `E2E_BASE_URL` se não for a porta 3000): todos os fluxos e telas em 390, 768 e 1280 px |
| `npm run typecheck` · `npm run build` | Tipos e build de produção |
| `npm run contrast` | Contraste das cores (WCAG 2.2 AA) |

## Publicar (Firebase + Vercel)

### 1. Firebase
1. Crie um projeto em <https://console.firebase.google.com>.
2. **Authentication → Método de login →** ative **E-mail/senha**.
3. **Firestore Database →** crie o banco (modo produção, região `southamerica-east1`).
4. Publique as regras e os índices:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore:rules,firestore:indexes --project SEU_PROJETO
   ```
5. **Configurações do projeto → Seus apps →** adicione um app **Web** e copie `apiKey`, `authDomain`, `projectId` e `appId`.
6. **Configurações → Contas de serviço → Gerar nova chave privada** (arquivo JSON, **não** faça commit).
7. **Authentication → Configurações → Domínios autorizados →** adicione o domínio da Vercel (necessário para o link de recuperar senha).

### 2. Vercel
1. Importe o repositório do GitHub em <https://vercel.com/new> (o Next.js é detectado sozinho).
2. Em **Settings → Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey do app Web |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |
| `FIREBASE_PROJECT_ID` | `project_id` do JSON da conta de serviço |
| `FIREBASE_CLIENT_EMAIL` | `client_email` do JSON |
| `FIREBASE_PRIVATE_KEY` | `private_key` do JSON (com os `\n`) |

> **Não** cadastre `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`, `FIRESTORE_EMULATOR_HOST` nem `FIREBASE_AUTH_EMULATOR_HOST` em produção.

3. Faça o deploy.

### 3. Configuração inicial (conta do dono)
1. No app publicado, o dono cria a conta normalmente em `/criar-conta`.
2. No seu computador, com as variáveis de produção num `.env.local` (sem as de emulador):
   ```bash
   npm run definir-dono -- email-do-dono@exemplo.com
   ```
3. O dono sai e entra de novo, e passa a ver o **Painel**. Em **Equipe e serviços** ele cadastra os serviços, os dados da barbearia e libera os barbeiros (que criam a própria conta antes).

## Estrutura

```
src/
├── app/
│   ├── (acesso)/        entrar, criar-conta, recuperar-senha
│   ├── (app)/           agendar, meus-agendamentos, agenda, painel, gestao, conta
│   ├── api/sessao/      cookie de sessão (entrar/sair)
│   └── design-system/   referência visual aprovada
├── components/
│   ├── ui/              Design System (tokens + componentes)
│   └── app/             componentes do app (fluxo de agendamento, agenda do dia…)
├── lib/                 regras puras (agenda, datas, validação, formatação)
└── server/              Admin SDK, sessão, leitura de dados, transações, Server Actions
tests/                   unit · integration · e2e
docs/PLANO.md            arquitetura, modelo de dados, suposições, backlog e sprints
PROGRESSO.md             histórias, tarefas e resultados dos testes
design-system.md         documentação visual
```

## Fora desta versão
Pagamentos no app, lembretes por WhatsApp, programa de fidelidade, fotos de cortes, relatórios financeiros e várias barbearias na mesma conta.
