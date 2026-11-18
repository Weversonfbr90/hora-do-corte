import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, login } from "./helpers";

/** Telas principais em celular, tablet e computador: sem rolagem lateral e com navegação certa. */
const sizes = [
  { name: "celular", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "computador", width: 1280, height: 800 },
];

const routes: { who: string; paths: string[] }[] = [
  { who: "cliente@exemplo.test", paths: ["/agendar", "/meus-agendamentos", "/conta"] },
  { who: "carlos@exemplo.test", paths: ["/agenda"] },
  { who: "dono@exemplo.test", paths: ["/painel", "/painel/novo", "/gestao/servicos", "/gestao/equipe", "/gestao/barbearia"] },
];

for (const size of sizes) {
  test(`telas em ${size.name} (${size.width}px)`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
    const page = await ctx.newPage();

    await page.goto("/entrar");
    await expectNoHorizontalScroll(page);

    for (const r of routes) {
      await login(page, r.who);
      await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
      for (const path of r.paths) {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        await expectNoHorizontalScroll(page);
        // Celular: barra inferior. Tablet/computador (≥ 768px): menu lateral.
        const nav = page.getByRole("navigation", { name: "Principal" }).filter({ visible: true });
        await expect(nav).toHaveCount(1);
        await page.screenshot({ path: `tests/e2e/screenshots/${size.name}${path.replaceAll("/", "_")}.png`, fullPage: true });
      }
      await page.context().clearCookies();
    }
    await ctx.close();
  });
}
