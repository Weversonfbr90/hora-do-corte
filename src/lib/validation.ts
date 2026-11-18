import { z } from "zod";
import { phoneDigits } from "./format";
import { isValidDate } from "./time";

const name = z
  .string()
  .trim()
  .min(2, "Informe o nome (pelo menos 2 letras).")
  .max(80, "Use no máximo 80 caracteres.");

export const phoneSchema = z
  .string()
  .transform(phoneDigits)
  .refine((d) => d.length === 10 || d.length === 11, "Informe o celular com DDD, ex.: (11) 91234-5678.")
  .refine((d) => !/^0/.test(d), "O DDD não pode começar com 0.");

const email = z.string().trim().toLowerCase().min(1, "Informe o e-mail.").email("E-mail inválido. Confira se tem @ e domínio.");

export const signUpSchema = z.object({
  name,
  phone: phoneSchema,
  email,
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128, "Senha muito longa."),
});

export const emailSchema = z.object({ email });

export const dateSchema = z.string().refine(isValidDate, "Data inválida.");
export const idSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/, "Identificador inválido.");

export const bookingSchema = z.object({
  serviceId: idSchema,
  barberId: idSchema,
  date: dateSchema,
  startMin: z.number().int().min(0).max(24 * 60 - 1),
});

export const phoneBookingSchema = bookingSchema.extend({
  clientName: name,
  clientPhone: phoneSchema,
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço.").max(60, "Use no máximo 60 caracteres."),
  durationMin: z.number().int().min(5, "A duração mínima é 5 minutos.").max(480, "A duração máxima é 8 horas."),
  priceCents: z.number({ error: "Informe o preço." }).int().min(0, "O preço não pode ser negativo.").max(10_000_00, "Preço muito alto."),
});

const minutes = z.number().int().min(0).max(24 * 60);
export const dayScheduleSchema = z.object({
  works: z.boolean(),
  start: minutes,
  end: minutes,
  breakStart: minutes.nullable(),
  breakEnd: minutes.nullable(),
});
export const weekScheduleSchema = z.array(dayScheduleSchema).length(7);

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia.").max(80),
  address: z.string().trim().max(160, "Use no máximo 160 caracteres."),
  phone: z.union([z.literal(""), phoneSchema]),
  slotStepMin: z.union([z.literal(15), z.literal(20), z.literal(30)]),
});

/** Converte erros do Zod em { campo: mensagem }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
