import { describe, expect, it } from "vitest";
import { formatDuration, formatPhone, formatPrice, parsePrice } from "@/lib/format";
import {
  addDays,
  canClientChange,
  formatDateLong,
  isWithinBookingWindow,
  minutesToTime,
  timeToMinutes,
  toInstant,
  weekday,
  zonedNow,
} from "@/lib/time";
import { signUpSchema } from "@/lib/validation";

describe("fuso horário (America/Sao_Paulo)", () => {
  it("converte data + hora local para UTC (-03:00)", () => {
    expect(toInstant("2026-11-18", 9 * 60 + 30).toISOString()).toBe("2026-11-18T12:30:00.000Z");
  });

  it("calcula 'agora' no fuso da barbearia, inclusive perto da meia-noite UTC", () => {
    // 02:00 UTC de 19/11 = 23:00 de 18/11 em São Paulo
    expect(zonedNow(new Date("2026-11-19T02:00:00Z"))).toEqual({ date: "2026-11-18", minutes: 23 * 60 });
  });

  it("soma dias atravessando meses e anos", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("dia da semana e formatação em pt-BR", () => {
    expect(weekday("2026-11-18")).toBe(3);
    expect(formatDateLong("2026-11-18")).toBe("quarta-feira, 18 de novembro");
  });

  it("horas ↔ minutos", () => {
    expect(minutesToTime(570)).toBe("09:30");
    expect(timeToMinutes("18:45")).toBe(1125);
    expect(timeToMinutes("25:00")).toBeNaN();
  });
});

describe("regras de prazo", () => {
  const start = new Date("2026-11-18T15:00:00Z");
  it("cliente muda com 2 horas ou mais de antecedência", () => {
    expect(canClientChange(start, new Date("2026-11-18T13:00:00Z"))).toBe(true); // exatamente 2h
    expect(canClientChange(start, new Date("2026-11-18T13:00:01Z"))).toBe(false);
  });
  it("janela de agendamento: hoje até 30 dias", () => {
    expect(isWithinBookingWindow("2026-11-17", "2026-11-17")).toBe(true);
    expect(isWithinBookingWindow("2026-12-17", "2026-11-17")).toBe(true);
    expect(isWithinBookingWindow("2026-12-18", "2026-11-17")).toBe(false);
    expect(isWithinBookingWindow("2026-11-16", "2026-11-17")).toBe(false);
  });
});

describe("formatação", () => {
  it("preço em reais", () => {
    expect(formatPrice(4000)).toBe("R$ 40,00");
    expect(parsePrice("40,50")).toBe(4050);
    expect(parsePrice("R$ 1.200,00")).toBe(120000);
    expect(parsePrice("abc")).toBeNaN();
  });
  it("duração e celular", () => {
    expect(formatDuration(50)).toBe("50 min");
    expect(formatDuration(90)).toBe("1h30");
    expect(formatPhone("11912345678")).toBe("(11) 91234-5678");
  });
});

describe("validação do cadastro", () => {
  const ok = { name: "Ana Souza", phone: "(11) 91234-5678", email: "Ana@Exemplo.com ", password: "12345678" };
  it("aceita dados válidos e normaliza e-mail e celular", () => {
    const r = signUpSchema.parse(ok);
    expect(r.email).toBe("ana@exemplo.com");
    expect(r.phone).toBe("11912345678");
  });
  it("exige todos os campos essenciais", () => {
    const r = signUpSchema.safeParse({ name: "", phone: "123", email: "x", password: "1" });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["name", "phone", "email", "password"]));
  });
});
