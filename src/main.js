import { scrapeTata } from './scrapers/tata.js';
import { scrapeTiendaInglesa } from './scrapers/tiendainglesa.js';
import { scrapeDisco, scrapeDevoto } from './scrapers/blazor.js';
import { BIMBO_BRANDS } from './brands.js';
import { writeFile, mkdir } from 'node:fs/promises';

const SCRAPERS = [
  { name: 'tata',          fn: scrapeTata },
  { name: 'tiendainglesa', fn: scrapeTiendaInglesa },
  { name: 'disco',         fn: scrapeDisco },
  { name: 'devoto',        fn: scrapeDevoto },
];

async function runOne(name, fn) {
  const t0 = Date.now();
  try {
    const items = await fn(BIMBO_BRANDS);
    const ms = Date.now() - t0;
    console.log(`✓ ${name.padEnd(15)} | ${String(items.length).padStart(3)} productos | ${(ms / 1000).toFixed(1)}s`);
    return { name, items, ok: true };
  } catch (err) {
    const ms = Date.now() - t0;
    console.error(`✗ ${name.padEnd(15)} | ERROR (${(ms / 1000).toFixed(1)}s): ${err.message}`);
    return { name, items: [], ok: false, error: err.message };
  }
}

console.log(`Marcas a buscar: ${BIMBO_BRANDS.join(', ')}\n`);
const results = await Promise.all(SCRAPERS.map((s) => runOne(s.name, s.fn)));
const all = results.flatMap((r) => r.items);

await mkdir('data/output', { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const csvPath = `data/output/bimbo_${stamp}.csv`;
const jsonPath = `data/output/bimbo_${stamp}.json`;

// CSV: Producto / Marca / Precio (más super y url para utilidad)
const headers = ['producto', 'marca', 'precio', 'super', 'url'];
const csvLines = [headers.join(',')];
const sorted = [...all].sort((a, b) => {
  const k = (x) => `${x.brand}|${x.name.toLowerCase()}|${x.super}`;
  return k(a).localeCompare(k(b), 'es');
});
for (const item of sorted) {
  const row = [item.name, item.brand, item.price ?? '', item.super, item.url ?? ''];
  csvLines.push(row.map((v) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(','));
}
await writeFile(csvPath, csvLines.join('\n'));
await writeFile(jsonPath, JSON.stringify({ brands: BIMBO_BRANDS, generatedAt: new Date().toISOString(), items: sorted }, null, 2));

console.log(`\nTotal: ${all.length} productos`);
console.log(`Archivos: ${csvPath}\n           ${jsonPath}\n`);

// Resumen por marca
console.log('Por marca:');
const byBrand = {};
for (const i of all) (byBrand[i.brand] ??= []).push(i);
for (const [brand, items] of Object.entries(byBrand)) {
  const supers = new Set(items.map((x) => x.super));
  console.log(`  ${brand.padEnd(18)} | ${String(items.length).padStart(3)} items | en: ${[...supers].join(', ')}`);
}

console.log('\nPor super:');
for (const r of results) {
  console.log(`  ${r.name.padEnd(15)} | ${String(r.items.length).padStart(3)} items`);
}
