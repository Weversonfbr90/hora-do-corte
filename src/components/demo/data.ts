// Dados de exemplo — fictícios, apenas para a demonstração do Design System.
import type { ChipOption, NavItem, SelectOption, TimeSlot } from "@/components/ui";

export const barbearia = { nome: "Barbearia Exemplo", endereco: "Rua das Palmeiras, 120 — Centro" };

export const servicos: SelectOption[] = [
  { value: "corte", label: "Corte", description: "30 min · R$ 40,00" },
  { value: "barba", label: "Barba", description: "20 min · R$ 30,00" },
  { value: "corte-barba", label: "Corte + barba", description: "50 min · R$ 65,00" },
  { value: "pezinho", label: "Pezinho", description: "10 min · R$ 15,00" },
  { value: "luzes", label: "Luzes", description: "Indisponível esta semana", disabled: true },
];

export const barbeiros = [
  { id: "carlos", nome: "Carlos Mendes", info: "Especialista em degradê", proximo: "Hoje, 14:30" },
  { id: "junior", nome: "Júnior Alves", info: "Barba e navalha", proximo: "Hoje, 16:00" },
  { id: "rafael", nome: "Rafael Souza", info: "De folga hoje", proximo: "Amanhã", folga: true },
];

export const dias: ChipOption[] = [
  { value: "seg", sublabel: "Seg", label: "17" },
  { value: "ter", sublabel: "Ter", label: "18" },
  { value: "qua", sublabel: "Qua", label: "19" },
  { value: "qui", sublabel: "Qui", label: "20" },
  { value: "sex", sublabel: "Sex", label: "21" },
  { value: "sab", sublabel: "Sáb", label: "22" },
  { value: "dom", sublabel: "Dom", label: "23", disabled: true },
];

const ocupados: Record<string, string[]> = {
  seg: ["09:00", "10:30", "11:00", "14:00", "16:30"],
  ter: ["09:30", "10:00", "13:30", "15:00", "15:30", "17:00"],
  qua: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"],
  qui: ["11:30", "14:30"],
  sex: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
  sab: ["09:00", "09:30", "10:00", "10:30", "11:00"],
};

const grade = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

export function horariosDoDia(dia: string): TimeSlot[] {
  const busy = ocupados[dia] ?? [];
  return grade.map((time) => ({ time, available: !busy.includes(time) }));
}

export const agendaDoDia = [
  { hora: "09:00", cliente: "Marcos Lima", servico: "Corte", barbeiro: "Carlos", status: "confirmado" as const },
  { hora: "09:30", cliente: "Pedro Henrique", servico: "Corte + barba", barbeiro: "Júnior", status: "pendente" as const },
  { hora: "10:30", cliente: "Lucas Rocha", servico: "Barba", barbeiro: "Carlos", status: "cancelado" as const },
];

export const navCliente: NavItem[] = [
  { id: "agendar", label: "Agendar", icon: "agenda" },
  { id: "meus", label: "Meus horários", icon: "horario" },
  { id: "perfil", label: "Perfil", icon: "cliente" },
];

export const navDono: NavItem[] = [
  { id: "painel", label: "Painel", icon: "painel" },
  { id: "agenda", label: "Agenda", icon: "agenda" },
  { id: "equipe", label: "Equipe", icon: "equipe" },
  { id: "servicos", label: "Serviços", icon: "servico" },
  { id: "ajustes", label: "Ajustes", icon: "ajustes" },
];
