// Verifica o contraste (WCAG 2.2) entre os pares de tokens usados na interface.
// Uso: npm run contrast
// Sai com erro (código 1) se algum par APROVADO ficar abaixo do mínimo.

const hex = (h) => h.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Pares usados na interface: [descrição, frente, fundo, mínimo]
// 4.5 = texto · 3 = contorno de controle, ícone, foco
const aprovados = [
  ["Texto principal / fundo", "#292524", "#FAF7F2", 4.5],
  ["Texto principal / superfície", "#292524", "#FFFDF9", 4.5],
  ["Texto secundário / fundo", "#635B54", "#FAF7F2", 4.5],
  ["Texto secundário / superfície alternativa", "#635B54", "#F2ECE3", 4.5],
  ["Texto claro / botão principal", "#FAF7F2", "#292524", 4.5],
  ["Texto principal / destaque #ADD2FF", "#292524", "#ADD2FF", 4.5],
  ["Texto principal / destaque hover", "#292524", "#93C4FF", 4.5],
  ["Texto principal / destaque suave", "#292524", "#EAF3FF", 4.5],
  ["Destaque como texto sobre carvão", "#ADD2FF", "#292524", 4.5],
  ["Destaque forte (links) / fundo", "#1E5A9C", "#FAF7F2", 4.5],
  ["Destaque forte (links) / superfície", "#1E5A9C", "#FFFDF9", 4.5],
  ["Anel de foco / fundo", "#1E5A9C", "#FAF7F2", 3],
  ["Anel de foco / superfície alternativa", "#1E5A9C", "#F2ECE3", 3],
  ["Couro (texto) / fundo", "#7A4A2B", "#FAF7F2", 4.5],
  ["Couro (texto) / couro claro", "#7A4A2B", "#F3E5D6", 4.5],
  ["Madeira / fundo", "#5B3F2C", "#FAF7F2", 4.5],
  ["Creme-200 (texto) / carvão", "#E2D8C9", "#292524", 4.5],
  ["Borda de campo / superfície", "#8C8178", "#FFFDF9", 3],
  ["Borda de campo / fundo", "#8C8178", "#FAF7F2", 3],
  ["Sucesso / fundo sucesso", "#2C6B3F", "#E5F1E7", 4.5],
  ["Aviso / fundo aviso", "#7D5300", "#FBF0D6", 4.5],
  ["Erro / fundo erro", "#A8261B", "#FCEBE8", 4.5],
  ["Erro / superfície", "#A8261B", "#FFFDF9", 4.5],
  ["Info / fundo info", "#1E5A9C", "#EAF3FF", 4.5],
];

// Combinações PROIBIDAS: documentadas para mostrar por que foram ajustadas.
const proibidos = [
  ["Destaque #ADD2FF como texto/borda sobre o fundo", "#ADD2FF", "#FAF7F2", 3],
  ["Borda decorativa como contorno de campo", "#E2D8C9", "#FFFDF9", 3],
];

let falhas = 0;
console.log("Combinações aprovadas\n");
for (const [nome, fg, bg, min] of aprovados) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"} ${r.toFixed(2).padStart(5)}:1  (mín. ${min})  ${nome}  ${fg} / ${bg}`);
}
console.log("\nCombinações proibidas (não usar)\n");
for (const [nome, fg, bg, min] of proibidos) {
  console.log(`  ✗   ${ratio(fg, bg).toFixed(2).padStart(5)}:1  (mín. ${min})  ${nome}  ${fg} / ${bg}`);
}

if (falhas) {
  console.error(`\n${falhas} combinação(ões) aprovada(s) abaixo do mínimo.`);
  process.exit(1);
}
console.log("\nTodas as combinações aprovadas atendem à WCAG 2.2 AA.");
