import { expect, type Page } from "@playwright/test";

/** Senha das contas fictícias criadas por `npm run seed` (somente emulador local). */
export const SENHA_TESTE = "senha-teste-123";

/** Entra. Por padrão espera sair da tela de login (sessão criada); use expectSuccess=false para testar erros. */
export async function login(page: Page, email: string, password = SENHA_TESTE, expectSuccess = true) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  if (expectSuccess) await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
}

export async function logout(page: Page) {
  await page.goto("/conta");
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/entrar/);
}

/** Escolhe o primeiro dia (a partir de amanhã) que tenha horário livre e o primeiro horário. Retorna o horário. */
export async function pickFirstFreeSlot(page: Page): Promise<string> {
  const days = page.getByRole("radiogroup", { name: "Dia do atendimento" }).getByRole("radio");
  const count = await days.count();
  for (let i = 1; i < count; i++) {
    const day = days.nth(i);
    if (await day.isDisabled()) continue;
    await day.click();
    const grid = page.getByRole("radiogroup", { name: /Horários livres/ });
    const empty = page.getByText("Nenhum horário livre neste dia");
    await expect(grid.or(empty)).toBeVisible();
    if (await grid.isVisible()) {
      const slot = grid.getByRole("radio").first();
      const time = (await slot.textContent())!.trim();
      await slot.click();
      return time;
    }
  }
  throw new Error("Nenhum horário livre encontrado nos próximos 30 dias");
}

/** Garante que a página não rola na horizontal. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "a página não deve rolar na horizontal").toBeLessThanOrEqual(1);
}
