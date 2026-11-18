import { defineConfig, devices } from "@playwright/test";

/**
 * Testes ponta a ponta. Pré-requisitos:
 *   1) npm run emulators     2) npm run seed     3) npm run dev
 * Usa o Google Chrome instalado na máquina (channel "chrome"): não baixa navegadores.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "off",
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
});
