/** 4000 → "R$ 40,00" */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
}

/** "R$ 40,00" | "40" | "40,5" → 4000 | 4050 (NaN se inválido) */
export function parsePrice(input: string): number {
  const clean = input.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!clean) return NaN;
  const value = Number(clean);
  return Number.isFinite(value) ? Math.round(value * 100) : NaN;
}

/** 50 → "50 min" · 90 → "1h30" */
export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** Só dígitos. */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** "11912345678" → "(11) 91234-5678" */
export function formatPhone(input: string): string {
  const d = phoneDigits(input).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
