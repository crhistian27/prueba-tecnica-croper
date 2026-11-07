/**
 * Auditoría Lighthouse en perfil móvil (Moto G Power, 4G lento, CPU 4x) con caché vacía.
 * Mide /login (sin sesión) y /products (con la sesión del usuario demo).
 *
 *   npm i --no-save lighthouse@13 puppeteer-core@25   # dependencias solo para medir
 *   THROTTLING=devtools node scripts/lighthouse-audit.mjs resultado
 *
 * Variables: BASE (default http://localhost:4200), THROTTLING (simulate | devtools; para
 * comparar versiones usar devtools: la simulación da resultados bimodales en esta app),
 * CHROME_PATH (default /usr/bin/google-chrome). Genera <nombre>-*.html y <nombre>.json.
 */
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4200';
const out = process.argv[2] ?? 'antes';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const port = Number(new URL(browser.wsEndpoint()).port);

// Sesión demo: token real de la API guardado como lo hace la app
const res = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@croper.com', password: 'Admin123*' }),
});
const auth = await res.json();

async function audit(path, withSession) {
  const page = await browser.newPage();
  // Mismo origen pero sin cargar la app (no precalienta la caché)
  await page.goto(`${BASE}/api/health`);
  await page.evaluate(
    (s) => {
      if (s) localStorage.setItem('croper.session', JSON.stringify(s));
      else localStorage.clear();
    },
    withSession
      ? { token: auth.accessToken, expiresAt: Date.now() + 3600e3, user: auth.user }
      : null,
  );
  // Caché HTTP vacía = primera visita desde un celular
  const cdp = await page.createCDPSession();
  await cdp.send('Network.clearBrowserCache');
  const r = await lighthouse(`${BASE}${path}`, {
    port,
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    disableStorageReset: true,
    throttlingMethod: process.env.THROTTLING ?? 'simulate',
  });
  await page.close();
  const name = path.replace(/\W/g, '') || 'root';
  fs.writeFileSync(`${out}-${name}.html`, r.report);
  const a = r.lhr.audits;
  const pick = (id) => a[id]?.displayValue ?? '-';
  return {
    pagina: path,
    rendimiento: Math.round(r.lhr.categories.performance.score * 100),
    accesibilidad: Math.round(r.lhr.categories.accessibility.score * 100),
    buenasPracticas: Math.round(r.lhr.categories['best-practices'].score * 100),
    seo: Math.round(r.lhr.categories.seo.score * 100),
    FCP: pick('first-contentful-paint'),
    LCP: pick('largest-contentful-paint'),
    TBT: pick('total-blocking-time'),
    CLS: pick('cumulative-layout-shift'),
    SpeedIndex: pick('speed-index'),
    transferido: pick('total-byte-weight'),
    recursos: (a['network-requests']?.details?.items ?? []).map(
      (i) =>
        `${Math.round((i.transferSize ?? 0) / 1024)}KB ${i.url.replace(BASE, '').slice(0, 90)}`,
    ),
    renderBlocking: (
      a['render-blocking-insight']?.details?.items ??
      a['render-blocking-resources']?.details?.items ??
      []
    ).map((i) => i.url),
    seoFallos: r.lhr.categories.seo.auditRefs
      .filter((ref) => a[ref.id]?.score === 0)
      .map((ref) => a[ref.id].title),
    oportunidades: Object.values(a)
      .filter((x) => x.details?.type === 'opportunity' && x.score !== null && x.score < 0.9)
      .map((x) => `${x.title} ${x.displayValue ?? ''}`),
    fallosA11y: r.lhr.categories.accessibility.auditRefs
      .filter((ref) => a[ref.id]?.score === 0)
      .map((ref) => a[ref.id].title),
  };
}

const results = [await audit('/login', false), await audit('/products', true)];
console.log(JSON.stringify(results, null, 2));
fs.writeFileSync(`${out}.json`, JSON.stringify(results, null, 2));
await browser.close();
