import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';
import { scenarios } from './scenarios.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require.resolve('playwright'); }
catch { playwright = require.resolve('playwright', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean) }); }
const { chromium } = require(playwright);
const output = path.resolve(process.env.U08_QA_OUTPUT || path.join(root, 'tmp/u08-qa'));
await mkdir(output, { recursive: true });
for (const filename of ['login.html', 'dashboard.html', 'specialties.html', 'specialty-form.html', 'js/shell.js']) {
  await readFile(path.join(root, filename));
}
const { server, url } = await startServer();
let browser;
const results = [];
const KEY = 'dsw_u4_specialties_v1';

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.NACHO_CHROMIUM_PATH ? { executablePath: process.env.NACHO_CHROMIUM_PATH } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    ignoreDefaultArgs: ['--disable-back-forward-cache'],
  });
  for (let index = 0; index < scenarios.length; index++) {
    const scenario = scenarios[index];
    let context;
    let page;
    const consoleErrors = [];
    const pageErrors = [];
    const failedResources = [];
    const externalRequests = new Set();
    const started = Date.now();
    const helper = {
      assert, url, KEY,
      get page() { return page; },
      async open({ route = 'dashboard.html', records, raw, authenticated = true, viewport = { width: 1366, height: 900 } } = {}) {
        context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
        page = await context.newPage();
        page.setDefaultTimeout(7000);
        page.on('pageerror', (error) => pageErrors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
        page.on('response', (response) => { if (response.status() >= 400) failedResources.push(`${response.status()} ${new URL(response.url()).pathname}`); });
        page.on('request', (request) => { if (new URL(request.url()).origin !== url) externalRequests.add(request.url()); });
        await page.goto(`${url}/login.html`);
        if (authenticated) {
          await page.locator('#username').fill('admin');
          await page.locator('#password').fill('admin123');
          await page.locator('button[type="submit"]').click();
          await page.waitForURL('**/dashboard.html');
        }
        if (raw !== undefined || records !== undefined) {
          await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: KEY, value: raw ?? JSON.stringify(records) });
        }
        await page.goto(`${url}/${route}`);
      },
      async all() { return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), KEY); },
      async raw() { return page.evaluate((key) => localStorage.getItem(key), KEY); },
      async fill(name, description, state = 'true') {
        await page.locator('#name').fill(name);
        await page.locator('#description').fill(description);
        await page.locator('#isActive').selectOption(state);
      },
      async save() { await page.locator('#save-button').click(); },
      async saved() {
        await page.waitForURL((target) => target.pathname === '/specialties.html');
        await page.locator('#notice').filter({ hasText: 'Especialidad guardada correctamente.' }).waitFor({ state: 'visible' });
        assert.equal(new URL(page.url()).search, '');
      },
      async panelCount(expected) {
        await page.goto(`${url}/dashboard.html`);
        assert.equal(await page.locator('#active-specialties-count').textContent(), String(expected));
      },
      async screenshot(filename) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(output, filename), fullPage: true });
      },
    };
    const result = { id: `QA${String(index + 1).padStart(2, '0')}`, name: scenario.name, expected: scenario.expected };
    try {
      await scenario.run(helper);
      assert.deepEqual(pageErrors, [], 'Excepciones de JavaScript');
      assert.deepEqual(failedResources, [], 'Recursos HTTP faltantes');
      assert.deepEqual([...externalRequests], [], 'Solicitudes externas o al backend');
      assert.deepEqual(consoleErrors, [], 'Errores de consola');
      result.result = 'PASS';
    } catch (error) {
      result.result = 'FAIL';
      result.detail = error.message;
      result.consoleErrors = consoleErrors;
      result.pageErrors = pageErrors;
    } finally {
      if (context) await context.close();
    }
    result.durationMs = Date.now() - started;
    results.push(result);
    console.log(`${result.id} ${result.result} ${result.name}${result.detail ? `: ${result.detail}` : ''}`);
  }
  const sourceHashes = {};
  for (const filename of ['login.html','login.js','login_style.css','dashboard.html','dashboard.js','dashboard_style.css','specialties.html','specialties.js','specialties_style.css','specialty-form.html','specialty-form.js','specialty-form_style.css','style.css','js/session.js','js/shell.js','js/specialties-store.js']) {
    sourceHashes[filename] = createHash('sha256').update(await readFile(path.join(root, filename))).digest('hex');
  }
  const baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const report = {
    timestamp: new Date().toISOString(), browser: `Chromium ${browser.version()}`, platform: process.platform,
    baseCommit, viewports: ['1366 x 900', '375 x 812'], fixtures: false,
    scope: 'Login, shell, panel, store, listado y formulario reales del repositorio, servidos por HTTP sin sustitutos.',
    sourceHashes, passed: results.filter((item) => item.result === 'PASS').length, total: results.length, results,
  };
  await writeFile(path.join(output, 'resultados-u08.json'), `${JSON.stringify(report, null, 2)}\n`);
  const clean = (value) => String(value).replaceAll('|', '/').replaceAll('\n', ' ');
  await writeFile(path.join(output, 'resultados-u08.md'), `# Pruebas integradas U08\n\nFecha UTC: ${report.timestamp}\n\nNavegador: ${report.browser} (${report.platform})\n\nBase: ${baseCommit}\n\n${report.scope}\n\n**No se usan fixtures.** Cada caso inicia un contexto nuevo y accede mediante el login real cuando requiere sesión.\n\n| Caso | Prueba | Resultado esperado | Resultado |\n| --- | --- | --- | --- |\n${results.map((item) => `| ${item.id} | ${clean(item.name)} | ${clean(item.expected)} | ${item.result}${item.detail ? `: ${clean(item.detail)}` : ''} |`).join('\n')}\n\nTotal: ${report.passed}/${report.total}.\n`);
  console.log(`Total: ${report.passed}/${report.total}. Reporte: ${output}`);
  if (report.passed !== report.total) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
