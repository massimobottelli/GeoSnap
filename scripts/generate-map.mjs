#!/usr/bin/env node
/**
 * GeoSnap — pipeline di generazione dei dati geografici (build-time).
 *
 * Genera `src/data/europe-shapes.json` a partire dai dati Natural Earth
 * (world-atlas, 110m) con proiezione Equal Earth.
 *
 * Uso: node scripts/generate-map.mjs
 *
 * Non modificare `src/data/europe-shapes.json` a mano: si rigenera da qui.
 * Dipendenze (devDependencies): world-atlas, topojson-client, d3-geo
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import { geoEqualEarth, geoPath } from 'd3-geo';

// ── Configurazione ──────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'node_modules/world-atlas/countries-110m.json');
const OUTPUT = resolve(ROOT, 'src/data/europe-shapes.json');
const W = 960;
const H = 700;
const PAD = 20;

// ── ISO 3166-1 numeric → alpha-3 (stringhe, con zeri iniziali) ─────────────

const NUM_TO_A3 = new Map([
  ['008', 'ALB'],
  ['020', 'AND'],
  ['040', 'AUT'],
  ['056', 'BEL'],
  ['070', 'BIH'],
  ['100', 'BGR'],
  ['112', 'BLR'],
  ['191', 'HRV'],
  ['196', 'CYP'],
  ['203', 'CZE'],
  ['208', 'DNK'],
  ['233', 'EST'],
  ['246', 'FIN'],
  ['250', 'FRA'],
  ['276', 'DEU'],
  ['300', 'GRC'],
  ['304', 'GRL'],
  ['336', 'VAT'],
  ['348', 'HUN'],
  ['352', 'ISL'],
  ['372', 'IRL'],
  ['380', 'ITA'],
  ['428', 'LVA'],
  ['438', 'LIE'],
  ['440', 'LTU'],
  ['442', 'LUX'],
  ['470', 'MLT'],
  ['492', 'MCO'],
  ['498', 'MDA'],
  ['499', 'MNE'],
  ['528', 'NLD'],
  ['578', 'NOR'],
  ['616', 'POL'],
  ['620', 'PRT'],
  ['642', 'ROU'],
  ['643', 'RUS'],
  ['674', 'SMR'],
  ['688', 'SRB'],
  ['703', 'SVK'],
  ['705', 'SVN'],
  ['724', 'ESP'],
  ['752', 'SWE'],
  ['756', 'CHE'],
  ['792', 'TUR'],
  ['804', 'UKR'],
  ['807', 'MKD'],
  ['826', 'GBR'],
]);

// ── Nomi italiani (stessi di nations.ts) ────────────────────────────────────

const NAMES = new Map([
  ['ALB', 'Albania'],
  ['AND', 'Andorra'],
  ['AUT', 'Austria'],
  ['BEL', 'Belgio'],
  ['BIH', 'Bosnia-Erzegovina'],
  ['BGR', 'Bulgaria'],
  ['BLR', 'Bielorussia'],
  ['HRV', 'Croazia'],
  ['CYP', 'Cipro'],
  ['CZE', 'Repubblica Ceca'],
  ['DNK', 'Danimarca'],
  ['EST', 'Estonia'],
  ['FIN', 'Finlandia'],
  ['FRA', 'Francia'],
  ['DEU', 'Germania'],
  ['GRC', 'Grecia'],
  ['GRL', 'Groenlandia'],
  ['VAT', 'Città del Vaticano'],
  ['HUN', 'Ungheria'],
  ['ISL', 'Islanda'],
  ['IRL', 'Irlanda'],
  ['ITA', 'Italia'],
  ['KOS', 'Kosovo'],
  ['LVA', 'Lettonia'],
  ['LIE', 'Liechtenstein'],
  ['LTU', 'Lituania'],
  ['LUX', 'Lussemburgo'],
  ['MLT', 'Malta'],
  ['MCO', 'Monaco'],
  ['MDA', 'Moldavia'],
  ['MNE', 'Montenegro'],
  ['NLD', 'Paesi Bassi'],
  ['NOR', 'Norvegia'],
  ['POL', 'Polonia'],
  ['PRT', 'Portogallo'],
  ['ROU', 'Romania'],
  ['RUS', 'Russia'],
  ['SMR', 'San Marino'],
  ['SRB', 'Serbia'],
  ['SVK', 'Slovacchia'],
  ['SVN', 'Slovenia'],
  ['ESP', 'Spagna'],
  ['SWE', 'Svezia'],
  ['CHE', 'Svizzera'],
  ['TUR', 'Turchia'],
  ['UKR', 'Ucraina'],
  ['MKD', 'Macedonia del Nord'],
  ['GBR', 'Regno Unito'],
]);

const PLAYABLE = new Set([
  'ALB',
  'AUT',
  'BEL',
  'BLR',
  'BIH',
  'BGR',
  'HRV',
  'DNK',
  'EST',
  'FIN',
  'FRA',
  'DEU',
  'GRC',
  'IRL',
  'ISL',
  'ITA',
  'LVA',
  'LTU',
  'MKD',
  'MDA',
  'MNE',
  'NOR',
  'NLD',
  'POL',
  'PRT',
  'GBR',
  'CZE',
  'ROU',
  'SRB',
  'SVK',
  'SVN',
  'ESP',
  'SWE',
  'CHE',
  'UKR',
  'HUN',
]);

// Escluse dal fit della proiezione (troppo grandi, distorcono l'Europa)
const FIT_EXCLUDE = new Set(['RUS', 'TUR', 'GRL']);

// ── Pipeline ────────────────────────────────────────────────────────────────

function main() {
  console.log('GeoSnap — generazione dati geografici (Fase 1, Task 1.2)');

  // 1. Carica TopoJSON
  const topo = JSON.parse(readFileSync(INPUT, 'utf-8'));

  // 2. Converti in GeoJSON
  const allFC = feature(topo, topo.objects.countries);

  // 3. Filtra nazioni europee
  const euroFeatures = [];
  for (const f of allFC.features) {
    const a3 = NUM_TO_A3.get(String(f.id));
    if (a3) {
      f.properties = { ...f.properties, alpha3: a3 };
      euroFeatures.push(f);
    }
    // Kosovo: id undefined nel dataset 110m, match per nome
    if (f.id === undefined && f.properties?.name === 'Kosovo') {
      f.properties = { ...f.properties, alpha3: 'KOS' };
      euroFeatures.push(f);
    }
  }
  console.log(`  Trovate ${euroFeatures.length} nazioni europee`);

  // 4. FeatureCollection per il fit (Europa core)
  const fitFC = {
    type: 'FeatureCollection',
    features: euroFeatures.filter((f) => !FIT_EXCLUDE.has(f.properties.alpha3)),
  };

  // 5. Proiezione Equal Earth centrata sull'Europa
  const projection = geoEqualEarth().fitExtent(
    [
      [PAD, PAD],
      [W - PAD, H - PAD],
    ],
    fitFC,
  );
  const pathGen = geoPath(projection);

  // 6. Genera path e metriche
  const countries = {};
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const f of euroFeatures) {
    const a3 = f.properties.alpha3;
    const pathD = pathGen(f);
    if (!pathD) {
      console.warn(`  ⚠ ${a3}: nessun path, saltata`);
      continue;
    }

    const [[bx0, by0], [bx1, by1]] = pathGen.bounds(f);
    const ctr = pathGen.centroid(f);
    const area = pathGen.area(f);

    if (!FIT_EXCLUDE.has(a3)) {
      minX = Math.min(minX, bx0);
      minY = Math.min(minY, by0);
      maxX = Math.max(maxX, bx1);
      maxY = Math.max(maxY, by1);
    }

    countries[a3] = {
      name: NAMES.get(a3) ?? a3,
      playable: PLAYABLE.has(a3),
      pathD,
      bbox: [+bx0.toFixed(2), +by0.toFixed(2), +(bx1 - bx0).toFixed(2), +(by1 - by0).toFixed(2)],
      centroid: [+ctr[0].toFixed(2), +ctr[1].toFixed(2)],
      area: +area.toFixed(2),
    };
  }

  // 7. viewBox
  const viewBox = [
    Math.round(minX - PAD),
    Math.round(minY - PAD),
    Math.round(maxX - minX + 2 * PAD),
    Math.round(maxY - minY + 2 * PAD),
  ];

  // 8. Output
  const output = { projection: 'EqualEarth', viewBox, countries };
  const json = JSON.stringify(output, null, 2);
  writeFileSync(OUTPUT, json, 'utf-8');

  const kb = Math.round((Buffer.byteLength(json) / 1024) * 10) / 10;
  const playable = Object.values(countries).filter((c) => c.playable).length;
  console.log(`  Output: ${OUTPUT}`);
  console.log(
    `  Dimensione: ${kb} KB | Nazioni: ${Object.keys(countries).length} (giocabili: ${playable})`,
  );
  console.log(`  viewBox: [${viewBox.join(', ')}]`);
  console.log('  ✅ Generazione completata');
}

main();
