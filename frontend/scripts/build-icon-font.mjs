/**
 * Genera un subconjunto de "Material Symbols Rounded" SOLO con los íconos que usa la app.
 *
 *   node scripts/build-icon-font.mjs
 *
 * Por qué: la fuente completa de íconos pesa ~170 KB (2.000+ íconos) y era el recurso
 * más pesado de la página. El subconjunto pesa unos pocos KB y se sirve desde nuestro
 * propio dominio (sin bloquear el render con una petición a fonts.googleapis.com).
 *
 * Al agregar un ícono nuevo: añadirlo a ICONS y volver a ejecutar el script.
 * El script falla si encuentra en las plantillas un <mat-icon> literal que no esté en la lista.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ICONS = [
  // Navegación y acciones
  'add',
  'add_box',
  'check',
  'chevron_right',
  'close',
  'content_copy',
  'delete',
  'edit',
  'edit_note',
  'expand_more',
  'filter_alt_off',
  'filter_list',
  'logout',
  'menu',
  'refresh',
  'search',
  'search_off',
  'visibility',
  'visibility_off',
  // Estados e indicadores
  'cloud_off',
  'error',
  'info',
  'insights',
  'inventory_2',
  'layers',
  'lock',
  'mail',
  'payments',
  'verified_user',
  'warning',
  // Categorías (core/models/product-display.ts)
  'category',
  'eco',
  'grass',
  'handyman',
  'pets',
  'science',
  'water_drop',
];

const OUT = 'src/styles/fonts/material-symbols-rounded.woff2';

// 1. Verifica que todos los íconos literales de las plantillas estén en la lista
function* files(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(html|ts)$/.test(f) && !f.endsWith('.spec.ts')) yield p;
  }
}
const missing = new Set();
for (const file of files('src/app')) {
  for (const [, name] of readFileSync(file, 'utf8').matchAll(
    /<mat-icon[^>]*>\s*([a-z0-9_]+)\s*<\/mat-icon>/g,
  )) {
    if (!ICONS.includes(name)) missing.add(`${name} (${file})`);
  }
}
if (missing.size) {
  console.error('Íconos usados que no están en ICONS:\n  ' + [...missing].join('\n  '));
  process.exit(1);
}

// 2. Pide a Google Fonts el CSS del subconjunto (icon_names debe ir ordenado)
const names = [...new Set(ICONS)].sort().join(',');
const cssUrl =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0' +
  `&icon_names=${names}&display=block`;
// Un User-Agent moderno hace que Google devuelva WOFF2 (el formato más liviano)
const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
};
const css = await (await fetch(cssUrl, { headers })).text();
const fontUrl = css.match(/url\((https:[^)]+)\)/)?.[1];
if (!fontUrl) throw new Error('No se encontró la URL de la fuente en:\n' + css);

// 3. Descarga y guarda la fuente
const font = Buffer.from(await (await fetch(fontUrl)).arrayBuffer());
writeFileSync(OUT, font);
console.log(`${ICONS.length} íconos → ${OUT} (${(font.length / 1024).toFixed(1)} KB)`);
