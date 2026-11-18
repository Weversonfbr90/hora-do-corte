/**
 * Regras do Firestore: o navegador não acessa NENHUM dado diretamente,
 * nem logado. Todo acesso passa pelo servidor, que aplica as permissões.
 */
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-hora-do-corte",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host, port: Number(port) },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe("regras do Firestore", () => {
  for (const col of ["users", "appointments", "barbers", "services", "barberDays", "settings"]) {
    it(`nega leitura e escrita direta em "${col}" (anônimo e logado)`, async () => {
      const anon = env.unauthenticatedContext().firestore();
      const logged = env.authenticatedContext("qualquer-uid").firestore();
      await assertFails(anon.collection(col).doc("x").get());
      await assertFails(logged.collection(col).doc("x").get());
      await assertFails(logged.collection(col).get());
      await assertFails(logged.collection(col).doc("x").set({ hack: true }));
    });
  }

  it("um usuário logado não lê o próprio perfil direto (só pelo servidor)", async () => {
    const me = env.authenticatedContext("u1").firestore();
    await assertFails(me.collection("users").doc("u1").get());
    await assertFails(me.collection("appointments").where("clientId", "==", "u1").get());
  });
});
