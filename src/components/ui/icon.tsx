/**
 * Família única de ícones: Lucide (contorno), com traço fino de 1.5px.
 * Importe SEMPRE daqui — nunca direto de "lucide-react" — para manter traço e tamanho consistentes.
 */
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  TriangleAlert,
  ArrowLeft,
  CalendarDays,
  Check,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  LayoutDashboard,
  MapPin,
  Phone,
  Plus,
  Scissors,
  Search,
  Settings,
  User,
  Users,
  X,
  CircleX,
} from "lucide-react";

export const icons = {
  agenda: CalendarDays,
  horario: Clock,
  servico: Scissors,
  cliente: User,
  equipe: Users,
  painel: LayoutDashboard,
  ajustes: Settings,
  local: MapPin,
  telefone: Phone,
  buscar: Search,
  adicionar: Plus,
  confirmar: Check,
  fechar: X,
  voltar: ArrowLeft,
  anterior: ChevronLeft,
  proximo: ChevronRight,
  expandir: ChevronDown,
  sucesso: CircleCheck,
  aviso: TriangleAlert,
  erro: CircleX,
  info: Info,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  /** 20 (padrão, junto a texto) · 24 (navegação) · 16 (dentro de badges). */
  size?: 16 | 20 | 24;
  /** Quando o ícone transmite informação sozinho, passe um rótulo. Sem rótulo, ele é decorativo. */
  label?: string;
}

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  const Component = icons[name];
  return (
    <Component
      size={size}
      strokeWidth={1.5}
      absoluteStrokeWidth
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    />
  );
}
