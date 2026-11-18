import type { BadgeTone } from "@/components/ui";
import type { AppointmentStatus } from "@/lib/types";

export const statusTone: Record<AppointmentStatus, BadgeTone> = {
  agendado: "info",
  concluido: "success",
  falta: "warning",
  cancelado: "danger",
};
