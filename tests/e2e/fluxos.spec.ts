import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, login, logout, pickFirstFreeSlot, SENHA_TESTE } from "./helpers";

const unique = Date.now().toString(36);
const novoCliente = { name: `Rafa E2E ${unique}`, phone: "11987654321", email: `rafa-${unique}@exemplo.test`, password: "senha-e2e-123" };

test.describe.configure({ mode: "serial" });

test("US-01/02 criar conta valida campos e leva o cliente para Agendar", async ({ page }) => {
  await page.goto("/criar-conta");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Informe o nome (pelo menos 2 letras).")).toBeVisible();
  await expect(page.getByText(/Informe o celular com DDD/)).toBeVisible();

  await page.getByLabel("Nome").fill(novoCliente.name);
  await page.getByLabel("Celular (WhatsApp)").fill(novoCliente.phone);
  await expect(page.getByLabel("Celular (WhatsApp)")).toHaveValue("(11) 98765-4321");
  await page.getByLabel("E-mail").fill(novoCliente.email);
  await page.getByLabel("Senha").fill(novoCliente.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/agendar$/);
  await expect(page.getByRole("heading", { name: "Agendar horário" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("US-07..10 cliente agenda e vê o resumo; US-11/12 vê e cancela", async ({ page }) => {
  await login(page, novoCliente.email, novoCliente.password);
  await expect(page).toHaveURL(/\/agendar$/);

  // Pesquisar serviço
  await page.getByLabel("Buscar serviço").fill("barba");
  await expect(page.getByRole("radio", { name: /Corte \+ barba/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Pezinho/ })).toHaveCount(0);
  await page.getByLabel("Buscar serviço").fill("");

  await page.getByRole("radiogroup", { name: "Serviço" }).getByRole("radio", { name: /^Corte\s/ }).first().click();
  await page.getByRole("radiogroup", { name: "Barbeiro" }).getByRole("radio", { name: /Carlos/ }).click();
  const time = await pickFirstFreeSlot(page);
  await expect(page.getByText(/Corte.*com Carlos Teste/)).toBeVisible();
  await page.getByRole("button", { name: "Confirmar horário" }).click();

  await expect(page.getByText("Horário confirmado!")).toBeVisible();
  await expect(page.getByText(time, { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 40,00")).toBeVisible();
  await expect(page.getByText("Carlos Teste").first()).toBeVisible();

  await page.getByRole("link", { name: "Ver meus agendamentos" }).click();
  await expect(page.getByRole("tab", { name: /Próximos \(1\)/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  const dialog = page.getByRole("dialog", { name: "Cancelar este horário?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sim, cancelar" }).click();
  await expect(page.getByText("Agendamento cancelado. O horário ficou livre.")).toBeVisible();
  await page.getByRole("tab", { name: /Histórico/ }).click();
  await expect(page.getByRole("tabpanel").getByText("Cancelado", { exact: true })).toBeVisible();
});

test("US-13 cliente remarca um agendamento", async ({ page }) => {
  await login(page, novoCliente.email, novoCliente.password);
  await page.getByRole("radiogroup", { name: "Serviço" }).getByRole("radio", { name: /^Barba/ }).click();
  await page.getByRole("radiogroup", { name: "Barbeiro" }).getByRole("radio", { name: /Júnior/ }).click();
  await pickFirstFreeSlot(page);
  await page.getByRole("button", { name: "Confirmar horário" }).click();
  await expect(page.getByText("Horário confirmado!")).toBeVisible();

  await page.goto("/meus-agendamentos");
  await page.getByRole("link", { name: "Remarcar" }).click();
  await expect(page.getByRole("heading", { name: "Remarcar horário" })).toBeVisible();
  await page.getByRole("radiogroup", { name: "Barbeiro" }).getByRole("radio", { name: /Carlos/ }).click();
  const novo = await pickFirstFreeSlot(page);
  await page.getByRole("button", { name: "Confirmar novo horário" }).click();
  await expect(page.getByText("Horário remarcado!")).toBeVisible();
  await page.goto("/meus-agendamentos");
  await expect(page.getByText(new RegExp(`${novo}`)).first()).toBeVisible();
  await expect(page.getByText(/Barba com Carlos Teste/)).toBeVisible();
});

test("permissões: cliente não abre o painel nem a agenda; sem login vai para Entrar", async ({ page }) => {
  await login(page, novoCliente.email, novoCliente.password);
  await expect(page).toHaveURL(/\/agendar$/);
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/agendar$/);
  await page.goto("/gestao/equipe");
  await expect(page).toHaveURL(/\/agendar$/);
  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/agendar$/);
  await logout(page);
  await page.goto("/meus-agendamentos");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("US-14/15 barbeiro vê só a própria agenda, busca e marca falta", async ({ page }) => {
  await login(page, "carlos@exemplo.test");
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByRole("heading", { name: "Minha agenda" })).toBeVisible();
  const list = page.getByRole("list", { name: "Atendimentos do dia" });
  await expect(list.getByText("Visitante por Telefone")).toBeVisible();
  // Busca por cliente
  await page.getByLabel("Buscar cliente").fill("visitante");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await page.getByLabel("Buscar cliente").fill("");
  // Trocar de dia
  await page.getByRole("button", { name: "Próximo dia" }).click();
  await expect(page).toHaveURL(/dia=/);
  await page.getByRole("button", { name: "Dia anterior" }).click();
  await expect(page).not.toHaveURL(/dia=/);
  // Marcar falta (se o horário já começou) e desfazer
  const card = list.getByRole("listitem").filter({ hasText: "Visitante por Telefone" });
  const faltou = card.getByRole("button", { name: "Faltou" });
  if (await faltou.isVisible()) {
    await faltou.click();
    await expect(page.getByText("Visitante por Telefone: marcado como falta.")).toBeVisible();
    await expect(card.getByText("Faltou")).toBeVisible();
    await card.getByRole("button", { name: "Desfazer" }).click();
    await expect(card.getByText("Agendado")).toBeVisible();
  } else {
    await expect(card.getByText(/liberam no horário do atendimento/)).toBeVisible();
  }
  // Barbeiro não acessa o painel do dono
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/agenda$/);
});

test("US-16..18 dono vê totais, filtra e agenda para quem ligou", async ({ page }) => {
  await login(page, "dono@exemplo.test");
  await expect(page).toHaveURL(/\/painel$/);
  const totals = page.getByRole("region", { name: "Totais do dia" });
  await expect(totals.getByText("Atendimentos")).toBeVisible();
  await expect(totals.getByText("Faltas")).toBeVisible();
  await page.getByRole("radiogroup", { name: "Filtrar por barbeiro" }).getByRole("radio", { name: "Júnior" }).click();
  await expect(page.getByText("Nenhum atendimento com esse filtro.").or(page.getByRole("list", { name: "Atendimentos do dia" }))).toBeVisible();

  await page.getByRole("link", { name: "Agendar para quem ligou" }).click();
  await page.getByRole("radiogroup", { name: "Serviço" }).getByRole("radio", { name: /Pezinho/ }).click();
  await page.getByRole("radiogroup", { name: "Barbeiro" }).getByRole("radio", { name: /Júnior/ }).click();
  await pickFirstFreeSlot(page);
  await page.getByRole("button", { name: "Confirmar horário" }).click();
  await expect(page.getByText("Informe o nome (pelo menos 2 letras).")).toBeVisible();
  await page.getByLabel("Nome do cliente").fill("Seu Jorge Telefone");
  await page.getByLabel("Celular").fill("11955554444");
  await page.getByRole("button", { name: "Confirmar horário" }).click();
  await expect(page.getByText("Agendamento criado!")).toBeVisible();
  await expect(page.getByText(/Seu Jorge Telefone já está na agenda de Júnior Teste/)).toBeVisible();
});

test("US-20 dono cadastra, edita e exclui serviço (com confirmação)", async ({ page }) => {
  await login(page, "dono@exemplo.test");
  await page.goto("/gestao/servicos");
  await page.getByRole("button", { name: "Novo serviço" }).click();
  const dialog = page.getByRole("dialog", { name: "Novo serviço" });
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog.getByText("Informe o nome do serviço.")).toBeVisible();
  await dialog.getByLabel("Nome").fill(`Sobrancelha ${unique}`);
  await dialog.getByLabel("Preço (R$)").fill("20,00");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Serviço cadastrado.")).toBeVisible();
  const card = page.getByRole("listitem").filter({ hasText: `Sobrancelha ${unique}` });
  await expect(card.getByText("30 min · R$ 20,00")).toBeVisible();

  // Editar o preço
  await card.getByRole("button", { name: "Editar" }).click();
  const edit = page.getByRole("dialog", { name: "Editar serviço" });
  await edit.getByLabel("Preço (R$)").fill("25,50");
  await edit.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Serviço atualizado.")).toBeVisible();
  await expect(card.getByText("30 min · R$ 25,50")).toBeVisible();

  await card.getByRole("button", { name: "Excluir" }).click();
  const confirm = page.getByRole("dialog", { name: /Excluir/ });
  await confirm.getByRole("button", { name: "Manter" }).click();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Excluir" }).click();
  await confirm.getByRole("button", { name: "Sim, excluir" }).click();
  await expect(page.getByText(`Sobrancelha ${unique} foi excluído.`)).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("US-21/22/23 dono libera barbeiro, define folga e suspende acesso", async ({ page, browser }) => {
  await login(page, "dono@exemplo.test");
  await page.goto("/gestao/equipe");
  await page.getByLabel("E-mail da conta").fill("naoexiste@exemplo.test");
  await page.getByRole("button", { name: "Procurar" }).click();
  await expect(page.getByText(/Não encontramos uma conta com esse e-mail/)).toBeVisible();

  await page.getByLabel("E-mail da conta").fill(novoCliente.email);
  await page.getByRole("button", { name: "Procurar" }).click();
  await page.getByRole("button", { name: "Liberar como barbeiro" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Liberar" }).click();
  await expect(page.getByText(/agora faz parte da equipe/)).toBeVisible();

  await page.getByRole("link", { name: new RegExp(novoCliente.name) }).click();
  await expect(page.getByRole("heading", { name: "Horário de trabalho" })).toBeVisible();
  // Expediente inválido mostra erro
  // padrão: segunda é folga → passa a trabalhar (repete se o clique chegar antes da hidratação da página)
  const swSegunda = page.getByRole("switch", { name: "Segunda" });
  await expect(async () => {
    if ((await swSegunda.getAttribute("aria-checked")) !== "true") await swSegunda.click();
    await expect(swSegunda).toHaveAttribute("aria-checked", "true", { timeout: 1000 });
  }).toPass();
  const segunda = page.getByRole("listitem").filter({ has: page.getByRole("switch", { name: "Segunda" }) });
  await segunda.getByLabel("Início").fill("20:00");
  await page.getByRole("button", { name: "Salvar horário de trabalho" }).click();
  await expect(segunda.getByText("O início precisa ser antes do fim.")).toBeVisible();
  await segunda.getByLabel("Início").fill("10:00");
  await page.getByRole("button", { name: "Salvar horário de trabalho" }).click();
  await expect(page.getByText(/Horário de trabalho salvo/)).toBeVisible();
  // Folga
  const d = new Date(Date.now() + 5 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  await page.getByLabel("Data da folga").fill(d);
  await page.getByRole("button", { name: "Adicionar folga" }).click();
  await expect(page.getByText(/Folga registrada/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Remover folga de/ })).toBeVisible();

  // Suspender (com confirmação) e conferir que a pessoa não entra mais
  await page.getByRole("button", { name: "Suspender acesso" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Acesso suspenso.")).toBeVisible();

  const other = await browser.newPage();
  await login(other, novoCliente.email, novoCliente.password, false);
  await expect(other.getByText("Seu acesso está suspenso. Fale com a barbearia.")).toBeVisible();
  await other.close();

  await page.getByRole("button", { name: "Reativar acesso" }).click();
  await expect(page.getByText("Acesso reativado.")).toBeVisible();
});

test("US-03 recuperar senha confirma o envio", async ({ page }) => {
  await page.goto("/recuperar-senha");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Informe o e-mail.")).toBeVisible();
  await page.getByLabel("E-mail da conta").fill("cliente@exemplo.test");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Pronto! Confira seu e-mail")).toBeVisible();
});

test("login com senha errada mostra erro", async ({ page }) => {
  await login(page, "cliente@exemplo.test", "senha-errada-999", false);
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await login(page, "cliente@exemplo.test", SENHA_TESTE);
  await expect(page).toHaveURL(/\/agendar$/);
});
