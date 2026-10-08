#!/usr/bin/env node
/**
 * GeoSnap — verifica della dimensione del bundle (Fase 7, Task 7.1).
 *
 * Calcola la dimensione totale **gzippata** dell'output di build (`dist/`) e
 * termina con errore se supera la soglia di 200 KB fissata dai requisiti
 * tecnici (§3.4: bundle gzippato < 200 KB).
 *
 * Uso:
 *   node scripts/check-bundle-size.mjs            # soglia default 200 KB
 *   node scripts/check-bundle-size.mjs --limit-kb 150
 *
 * Nessuna dipendenza esterna: solo moduli Node (`node:fs`, `node:path`,
 * `node:zlib`). Viene eseguito in CI dal workflow `.github/workflows/deploy.yml`
 * dopo `npm run build`.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

// ── Configurazione ──────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const DEFAULT_LIMIT_KB = 200;
const KB = 1024;

/**
 * Legge la soglia (in KB) dall'argomento `--limit-kb`, oppure usa il default.
 */
function readLimitKb(argv) {
  const index = argv.indexOf('--limit-kb');
  if (index === -1) return DEFAULT_LIMIT_KB;
  const raw = argv[index + 1];
  const parsed = Number(raw);
  if (raw === undefined || !Number.isFinite(parsed) || parsed <= 0) {
    console.error(`[check-bundle-size] --limit-kb non valido: ${String(raw)}`);
    process.exit(2);
  }
  return parsed;
}

/**
 * Elenca ricorsivamente tutti i file (non le directory) sotto `dir`.
 */
function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** Formatta un numero di byte come stringa leggibile (KB con 2 decimali). */
function formatKb(bytes) {
  return `${(bytes / KB).toFixed(2)} KB`;
}

// ── Esecuzione ──────────────────────────────────────────────────────────────

const limitKb = readLimitKb(process.argv.slice(2));
const limitBytes = limitKb * KB;

if (!existsSync(DIST)) {
  console.error('[check-bundle-size] Cartella dist/ non trovata: esegui prima `npm run build`.');
  process.exit(2);
}

const files = listFiles(DIST);

if (files.length === 0) {
  console.error('[check-bundle-size] dist/ è vuota: build non valida.');
  process.exit(2);
}

// Livello di compressione default (6): stima realistica del transfer size.
const entries = files
  .map((file) => {
    const content = readFileSync(file);
    return {
      path: relative(DIST, file),
      raw: statSync(file).size,
      gzip: gzipSync(content).length,
    };
  })
  .sort((a, b) => b.gzip - a.gzip);

const totalRaw = entries.reduce((sum, entry) => sum + entry.raw, 0);
const totalGzip = entries.reduce((sum, entry) => sum + entry.gzip, 0);

console.log('[check-bundle-size] dist/ — dimensione per file (gzip):');
for (const entry of entries) {
  console.log(`  ${entry.path.padEnd(34)} ${formatKb(entry.gzip).padStart(11)} gzip`);
}
console.log(
  `  ${'TOTALE'.padEnd(34)} ${formatKb(totalGzip).padStart(11)} gzip` +
    `  (raw ${formatKb(totalRaw)}, ${entries.length} file)`,
);
console.log(`[check-bundle-size] Soglia: ${limitKb.toFixed(2)} KB gzip`);

if (totalGzip > limitBytes) {
  console.error(
    `[check-bundle-size] FAIL: bundle gzippato ${formatKb(totalGzip)} > soglia ${limitKb.toFixed(2)} KB.`,
  );
  process.exit(1);
}

const margin = limitBytes - totalGzip;
console.log(`[check-bundle-size] OK: margine ${formatKb(margin)} sotto la soglia.`);
