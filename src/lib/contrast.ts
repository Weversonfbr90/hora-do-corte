/** Razão de contraste WCAG 2.2 entre duas cores hexadecimais (#RRGGBB). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = (hex.replace("#", "").match(/../g) ?? []).map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** "AAA", "AA", "AA grande" (só texto ≥ 24px ou elementos de interface) ou "Falha". */
export function wcagLevel(ratio: number): "AAA" | "AA" | "AA grande" | "Falha" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA grande";
  return "Falha";
}
