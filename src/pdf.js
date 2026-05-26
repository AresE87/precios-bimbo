import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-extra';

async function latestJson() {
  const dir = 'data/output';
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().reverse();
  if (!files.length) throw new Error('No hay archivos JSON en data/output. Corré "node src/main.js" primero.');
  return join(dir, files[0]);
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildHtml({ items, brands, generatedAt }) {
  // Agrupar por marca
  const byBrand = {};
  for (const it of items) (byBrand[it.brand] ??= []).push(it);
  // Dentro de marca, ordenar por nombre
  for (const k of Object.keys(byBrand)) {
    byBrand[k].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'es'));
  }

  const superColors = {
    tata: '#e5002b',
    disco: '#0070d2',
    devoto: '#f15c22',
    tiendainglesa: '#19744a',
  };

  const fmtBrand = (b) => b.replace(/\b\w/g, (c) => c.toUpperCase());
  const fmtSuper = (s) => ({
    tata: 'Tata',
    disco: 'Disco',
    devoto: 'Devoto',
    tiendainglesa: 'Tienda Inglesa',
  }[s] ?? s);
  const fmtPrice = (p) => (p == null ? '—' : `$ ${p.toLocaleString('es-UY')}`);

  const totals = {
    items: items.length,
    bimbo: items.filter((i) => i.brand === 'bimbo').length,
    perBrand: Object.fromEntries(Object.entries(byBrand).map(([b, arr]) => [b, arr.length])),
    perSuper: items.reduce((acc, i) => ((acc[i.super] = (acc[i.super] ?? 0) + 1), acc), {}),
  };

  const sections = Object.entries(byBrand)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([brand, arr]) => {
      const rows = arr
        .map((it) => `
          <tr>
            <td class="prod">${escape(it.name)}</td>
            <td><span class="pill" style="background:${superColors[it.super] ?? '#888'}">${fmtSuper(it.super)}</span></td>
            <td class="price">${fmtPrice(it.price)}</td>
          </tr>`)
        .join('');
      return `
        <section class="brand">
          <h2>${escape(fmtBrand(brand))} <span class="count">${arr.length}</span></h2>
          <table>
            <thead><tr><th>Producto</th><th>Super</th><th class="price">Precio</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join('');

  const date = new Date(generatedAt).toLocaleString('es-UY', { dateStyle: 'long', timeStyle: 'short' });

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Precios Bimbo Uruguay</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 11px; margin: 0; }
  header { border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 18px; }
  header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
  header .sub { color: #555; font-size: 11px; }
  .summary { display: flex; gap: 16px; margin: 14px 0 18px; flex-wrap: wrap; }
  .summary .box { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: #fafafa; }
  .summary .box b { display: block; font-size: 16px; }
  .summary .box span { color: #666; font-size: 10px; }
  section.brand { margin-bottom: 22px; break-inside: avoid; }
  section.brand h2 { font-size: 14px; margin: 0 0 6px; padding: 6px 10px; background: #1a1a1a; color: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; }
  section.brand h2 .count { font-size: 11px; background: #fff; color: #1a1a1a; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #f1f1f1; padding: 6px 8px; text-align: left; font-weight: 600; border-bottom: 1px solid #ccc; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.prod { width: 60%; }
  td.price, th.price { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .pill { display: inline-block; color: #fff; font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: .04em; }
  footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #888; text-align: center; }
</style></head><body>
  <header>
    <h1>Precios Grupo Bimbo · Supermercados Uruguay</h1>
    <div class="sub">Generado: ${escape(date)} · Tata, Disco, Devoto, Tienda Inglesa</div>
  </header>

  <div class="summary">
    <div class="box"><b>${totals.items}</b><span>productos totales</span></div>
    ${Object.entries(totals.perSuper).map(([s, n]) => `<div class="box"><b>${n}</b><span>${fmtSuper(s)}</span></div>`).join('')}
  </div>

  <p style="font-size:10px;color:#666;margin:0 0 14px">
    <b>Marcas relevadas:</b> ${brands.map(fmtBrand).join(' · ')}
  </p>

  ${sections}

  <footer>Datos relevados automáticamente de los sitios web oficiales de cada supermercado.</footer>
</body></html>`;
}

async function main() {
  const jsonPath = process.argv[2] || (await latestJson());
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  console.log(`Input: ${jsonPath} (${data.items.length} productos)`);

  const html = buildHtml(data);
  const htmlPath = jsonPath.replace(/\.json$/, '.html');
  const pdfPath = jsonPath.replace(/\.json$/, '.pdf');
  await writeFile(htmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
  await browser.close();

  console.log(`✓ HTML: ${htmlPath}`);
  console.log(`✓ PDF:  ${pdfPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
