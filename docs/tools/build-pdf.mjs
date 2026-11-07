/**
 * Genera docs/Respuestas_Teoricas_Croper.pdf a partir de los Markdown de docs/
 * (una sola fuente de verdad: si cambia un .md, se regenera el PDF).
 *
 *   npm i --no-save marked@15 puppeteer-core@25 @mermaid-js/mermaid-cli@11
 *   node docs/tools/build-pdf.mjs
 *
 * Variables: CHROME_PATH (default /usr/bin/google-chrome), AUTOR, REPO_URL, DOCS (carpeta docs).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const DOCS = process.env.DOCS ?? resolve(dirname(new URL(import.meta.url).pathname), '..');
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const AUTOR = process.env.AUTOR ?? '';
const REPO_URL = process.env.REPO_URL ?? '';
const tmp = mkdtempSync(join(tmpdir(), 'pdf-'));

const SECCIONES = [
  { archivo: 'ejercicio-3-arquitectura.md', titulo: 'Ejercicio 3 – Arquitectura de microservicios' },
  { archivo: 'ejercicio-4-rendimiento.md', titulo: 'Ejercicio 4 – Optimización de rendimiento web en móviles' },
  { archivo: 'ejercicio-5-seguridad.md', titulo: 'Ejercicio 5 – Seguridad en APIs y cloud' },
  { archivo: 'USO_IA.md', titulo: 'Uso de inteligencia artificial' },
];

// Diagramas Mermaid → PNG de alta resolución (los SVG de Mermaid usan foreignObject)
writeFileSync(join(tmp, 'pp.json'), JSON.stringify({ executablePath: CHROME, args: ['--no-sandbox'] }));
let n = 0;
function mermaidToImg(code) {
  const id = ++n;
  writeFileSync(join(tmp, `d${id}.mmd`), code);
  execFileSync('npx', ['mmdc', '-p', join(tmp, 'pp.json'), '-i', join(tmp, `d${id}.mmd`),
    '-o', join(tmp, `d${id}.png`), '-b', 'white', '-s', '2'], { stdio: 'ignore' });
  const b64 = readFileSync(join(tmp, `d${id}.png`)).toString('base64');
  return `<figure class="diagram"><img src="data:image/png;base64,${b64}" /></figure>`;
}

function render(md) {
  md = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => mermaidToImg(code));
  // El H1 de cada archivo se reemplaza por el título de la sección
  md = md.replace(/^# .*\n/, '');
  // Referencias a archivos de imagen del repo: no aplican en el PDF (el diagrama ya está incrustado)
  md = md.replace(/^> Diagrama también disponible como imagen:.*\n\n?/m, '');
  md = md.replace(/ \(\[imagen\]\([^)]+\)\)/g, '');
  // Enlaces relativos del repositorio: se dejan como texto (en el PDF no navegan)
  md = md.replace(/\[([^\]]+)\]\((?!https?:)[^)]+\)/g, '$1');
  return marked.parse(md);
}

const indice = SECCIONES.map((s, i) => `<li><span>${i + 1}.</span> ${s.titulo}</li>`).join('');
const cuerpo = SECCIONES.map((s) =>
  `<section class="seccion"><h1>${s.titulo}</h1>${render(readFileSync(join(DOCS, s.archivo), 'utf8'))}</section>`,
).join('');

const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>Prueba Técnica Full Stack – Croper</title>
<style>
  @page { size: A4; margin: 20mm 18mm 20mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, 'Segoe UI', system-ui, sans-serif; color: #1a2420; font-size: 10.5pt; line-height: 1.55; margin: 0; }
  .portada { height: 255mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always;
    padding: 18mm 4mm; border-top: 10px solid #15803d; }
  .portada .marca { font-size: 13pt; font-weight: 700; color: #15803d; letter-spacing: .04em; text-transform: uppercase; }
  .portada h1 { font-size: 30pt; line-height: 1.15; margin: 0 0 6mm; color: #0c2418; border: 0; }
  .portada .sub { font-size: 14pt; color: #4b5650; margin: 0; }
  .portada .meta { font-size: 11pt; color: #4b5650; }
  .portada .meta strong { color: #1a2420; }
  .portada ol { list-style: none; padding: 0; margin: 10mm 0 0; font-size: 11.5pt; }
  .portada li { padding: 2.5mm 0; border-bottom: 1px solid #e3e8e5; }
  .portada li span { display: inline-block; width: 8mm; color: #15803d; font-weight: 700; }
  .seccion { page-break-before: always; }
  .seccion:first-of-type { page-break-before: auto; }
  h1 { font-size: 19pt; color: #0c2418; border-bottom: 3px solid #15803d; padding-bottom: 3mm; margin: 0 0 6mm; }
  h2 { font-size: 13.5pt; color: #166534; margin: 8mm 0 3mm; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 6mm 0 2mm; page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  ul, ol { padding-left: 6mm; }
  blockquote { margin: 4mm 0; padding: 3mm 5mm; background: #f1f8f3; border-left: 4px solid #15803d; color: #33413a; }
  blockquote p { margin: 0; }
  code { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 8.8pt; background: #f1f4f2; padding: .5mm 1.2mm; border-radius: 3px; }
  pre { background: #f6f8f7; border: 1px solid #e3e8e5; padding: 3mm; border-radius: 4px; white-space: pre-wrap; font-size: 8.5pt; }
  pre code { background: none; padding: 0; }
  table { width: 100%; border-collapse: collapse; margin: 4mm 0; font-size: 9pt; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th { background: #eaf4ed; color: #0c2418; text-align: left; font-weight: 600; }
  th, td { border: 1px solid #d9e1dc; padding: 1.8mm 2.4mm; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafcfb; }
  hr { border: 0; border-top: 1px solid #e3e8e5; margin: 6mm 0; }
  .diagram { margin: 4mm 0; text-align: center; page-break-inside: avoid; }
  /* Altura acotada para que el diagrama quepa en el espacio libre de la página (sin páginas casi vacías) */
  .diagram img { max-width: 100%; max-height: 165mm; }
  /* Un subtítulo con su párrafo introductorio y su diagrama se mantienen juntos */
  h3:has(+ p + .diagram) { page-break-before: always; }
  a { color: #15803d; text-decoration: none; }
</style></head><body>
<section class="portada">
  <div>
    <div class="marca">Croper · Prueba técnica</div>
  </div>
  <div>
    <h1>Desarrollador Full Stack</h1>
    <p class="sub">Respuestas teóricas: arquitectura, rendimiento y seguridad · Uso de IA</p>
    <ol>${indice}</ol>
  </div>
  <div class="meta">
    ${AUTOR ? `<p><strong>Candidato:</strong> ${AUTOR}</p>` : ''}
    ${REPO_URL ? `<p><strong>Repositorio:</strong> <a href="${REPO_URL}">${REPO_URL}</a></p>` : ''}
    <p><strong>Código:</strong> API NestJS + MongoDB y frontend Angular + NgRx (ver README del repositorio).</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
  </div>
</section>
${cuerpo}
</body></html>`;

writeFileSync(join(tmp, 'doc.html'), html);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file://' + join(tmp, 'doc.html'), { waitUntil: 'load' });
const out = join(DOCS, 'Respuestas_Teoricas_Croper.pdf');
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;font-size:8px;color:#7b8580;padding:0 18mm;display:flex;justify-content:space-between;font-family:sans-serif">
    <span>Prueba técnica Full Stack · Croper</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  margin: { top: '18mm', bottom: '18mm', left: '0', right: '0' },
});
await browser.close();
console.log('PDF generado:', out);
