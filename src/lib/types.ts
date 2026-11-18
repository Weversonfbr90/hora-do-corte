// Tipos de domínio compartilhados entre servidor e interface.

export type Role = "cliente" | "barbeiro" | "dono";
export type UserStatus = "ativo" | "suspenso";
export type AppointmentStatus = "agendado" | "concluido" | "falta" | "cancelado";

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  status: UserStatus;
}

/** Expediente de um dia da semana. Horas em minutos desde a meia-noite. */
export interface DaySchedule {
  works: boolean;
  start: number;
  end: number;
  breakStart: number | null;
  breakEnd: number | null;
}

/** Índice 0 = domingo … 6 = sábado */
export type WeekSchedule = [DaySchedule, DaySchedule, DaySchedule, DaySchedule, DaySchedule, DaySchedule, DaySchedule];

export interface Barber {
  id: string;
  name: string;
  active: boolean;
  schedule: WeekSchedule;
  daysOff: string[];
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
}

export interface Appointment {
  id: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  priceCents: number;
  date: string;
  startMin: number;
  endMin: number;
  /** ISO 8601 (UTC) */
  startAt: string;
  status: AppointmentStatus;
  source: "app" | "telefone";
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  slotStepMin: 15 | 20 | 30;
}

export interface Interval {
  start: number;
  end: number;
}

/** Resultado padrão das Server Actions. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const DEFAULT_SETTINGS: ShopSettings = {
  name: "Minha barbearia",
  address: "",
  phone: "",
  slotStepMin: 30,
};

const workday = (): DaySchedule => ({ works: true, start: 9 * 60, end: 19 * 60, breakStart: 12 * 60, breakEnd: 13 * 60 });
const off = (): DaySchedule => ({ works: false, start: 9 * 60, end: 18 * 60, breakStart: null, breakEnd: null });

/** Expediente padrão ao liberar um barbeiro: terça a sábado, 9h–19h, almoço 12h–13h. */
export function defaultSchedule(): WeekSchedule {
  return [off(), off(), workday(), workday(), workday(), workday(), { ...workday(), end: 17 * 60 }];
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  falta: "Faltou",
  cancelado: "Cancelado",
};

export const ROLE_LABEL: Record<Role, string> = {
  cliente: "Cliente",
  barbeiro: "Barbeiro",
  dono: "Dono",
};
