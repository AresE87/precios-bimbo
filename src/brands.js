// Marcas de Grupo Bimbo en Uruguay.
export const BIMBO_BRANDS = [
  'bimbo',
  'los sorchantes',
  'maestro cubano',
  'nutrabien',
  'salmas',
  'tia rosa',
];

function stripAccents(s) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

// Buscamos word-boundary marca dentro del texto del producto, ignorando acentos.
const BRAND_RX = new RegExp(
  '\\b(' + BIMBO_BRANDS.map((b) => b.replace(/\s+/g, '[\\s-]?')).join('|') + ')\\b',
  'i',
);

export function matchedBrand(text) {
  if (!text) return null;
  const norm = stripAccents(text);
  const m = norm.match(BRAND_RX);
  if (!m) return null;
  const found = m[1].toLowerCase().replace(/[\s-]+/g, ' ');
  return BIMBO_BRANDS.find((b) => b === found) ?? found;
}
