import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Test di coerenza della configurazione di build e deploy (Fase 7, Task 7.1).
 *
 * Verifica che il workflow GitHub Actions, il base path di Vite, il manifest
 * PWA e la soglia del bundle restino allineati: una modifica non coordinata di
 * uno di questi file romperebbe il deploy su GitHub Pages (project page
 * servita sotto `/GeoSnap/`).
 *
 * Riferimento: §12.2 dei Requisiti Tecnici MVP1.
 */

const root = resolve(__dirname, '../..');

const workflow = readFileSync(resolve(root, '.github/workflows/deploy.yml'), 'utf-8');
const viteConfig = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');
const bundleScript = readFileSync(resolve(root, 'scripts/check-bundle-size.mjs'), 'utf-8');

const manifest = JSON.parse(
  readFileSync(resolve(root, 'public/manifest.webmanifest'), 'utf-8'),
) as { start_url: string; scope: string; display: string };

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8')) as {
  scripts: Record<string, string>;
};

describe('deploy.yml — workflow GitHub Actions (Fase 7, Task 7.1)', () => {
  // ── Trigger ──────────────────────────────────────────────────────────────

  it('si attiva su push in main e manualmente', () => {
    expect(workflow).toContain('push:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('workflow_dispatch:');
  });

  // ── Permessi ─────────────────────────────────────────────────────────────

  it('dichiara i permessi minimi per Pages (contents/pages/id-token)', () => {
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
  });

  // ── Pipeline di build ────────────────────────────────────────────────────

  it('installa le dipendenze con npm ci', () => {
    expect(workflow).toContain('npm ci');
  });

  it('esegue le verifiche di qualità prima della build', () => {
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm run format:check');
    expect(workflow).toContain('npm run test');
  });

  it('esegue la build statica con vite', () => {
    expect(workflow).toContain('npm run build');
    expect(packageJson.scripts.build).toBe('vite build');
  });

  it('verifica il bundle gzip dopo la build e prima dell’upload', () => {
    expect(workflow).toContain('npm run check:bundle');
    const buildAt = workflow.indexOf('npm run build');
    const checkAt = workflow.indexOf('npm run check:bundle');
    const uploadAt = workflow.indexOf('actions/upload-pages-artifact');
    expect(buildAt).toBeGreaterThan(-1);
    expect(checkAt).toBeGreaterThan(buildAt);
    expect(uploadAt).toBeGreaterThan(checkAt);
  });

  // ── Pubblicazione ────────────────────────────────────────────────────────

  it('pubblica dist/ con le azioni ufficiali GitHub Pages', () => {
    expect(workflow).toContain('actions/upload-pages-artifact@v3');
    expect(workflow).toContain('path: dist');
    expect(workflow).toContain('actions/deploy-pages@v4');
  });

  it('il job di deploy dipende dal job di build', () => {
    expect(workflow).toContain('needs: build');
    expect(workflow).toContain('name: github-pages');
  });
});

describe('coerenza base path di build e PWA (Fase 7, Task 7.1)', () => {
  it("vite.config.ts usa base '/GeoSnap/' in build", () => {
    expect(viteConfig).toMatch(/base:[^\n]*'\/GeoSnap\/'/);
  });

  it('manifest.webmanifest punta allo stesso base path', () => {
    expect(manifest.start_url).toBe('/GeoSnap/');
    expect(manifest.scope).toBe('/GeoSnap/');
  });

  it('manifest.webmanifest è standalone (PWA installabile)', () => {
    expect(manifest.display).toBe('standalone');
  });
});

describe('soglia del bundle gzip (Fase 7, Task 7.1)', () => {
  it('lo script di verifica usa la soglia di 200 KB', () => {
    expect(bundleScript).toContain('DEFAULT_LIMIT_KB = 200');
  });

  it('package.json espone lo script check:bundle', () => {
    expect(packageJson.scripts['check:bundle']).toBe('node scripts/check-bundle-size.mjs');
  });
});
