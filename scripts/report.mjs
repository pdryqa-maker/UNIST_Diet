// 스냅샷을 분석해 콘솔에 요약한다 (분석 로직 점검용).
// 사용: node scripts/report.mjs [--unmatched] [--items]

import { readFile } from 'node:fs/promises';
import { CAFETERIA_ORDER, CAFETERIAS, TIME_ORDER, flattenWeeks, kstToday, weekStartOf } from '../src/lib/menu.js';
import { analyzeAll } from '../src/lib/nutrition.js';
import { mean, scoreOptions } from '../src/lib/scoring.js';

const args = new Set(process.argv.slice(2));
const snap = JSON.parse(await readFile(new URL('../public/data/menus.json', import.meta.url), 'utf8'));
const flat = flattenWeeks(snap.weeks);
const { options: analyzed, fallbackFactor } = analyzeAll(flat);
const thisWeek = weekStartOf(kstToday());
const { options, baselines } = scoreOptions(analyzed, thisWeek);

const f1 = (x) => (x == null ? '-' : x.toFixed(1));
console.log(`weeks: ${Object.keys(snap.weeks).length}, options: ${options.length}, fallback factor: ${fallbackFactor.toFixed(2)}`);

const allItems = options.flatMap((o) => o.items.filter((i) => !i.optional && !i.implied));
const unmatched = allItems.filter((i) => !i.matched);
console.log(`menu items: ${allItems.length}, rule coverage: ${(100 - (unmatched.length / allItems.length) * 100).toFixed(1)}%`);
const factors = options.filter((o) => o.rawFactor != null).map((o) => o.rawFactor);
console.log(`residual-filled options: ${options.filter((o) => o.residualKcal > 1).length}`);
console.log(`calibration factor: min ${Math.min(...factors).toFixed(2)} / mean ${mean(factors).toFixed(2)} / max ${Math.max(...factors).toFixed(2)}`);

for (const t of TIME_ORDER) {
  const b = baselines[t];
  if (!b) continue;
  console.log(`baseline ${t}: n=${b.n} ${b.from}~${b.to}${b.usedFallback ? ' (fallback: all)' : ''}`);
}

console.log('\n== by cafeteria / variant (all weeks)');
const groups = {};
for (const o of options) (groups[`${o.cafeteria} ${o.variant} ${o.time}`] ??= []).push(o);
for (const [k, list] of Object.entries(groups).sort()) {
  const m = (fn) => mean(list.map(fn));
  console.log(
    `${k.padEnd(28)} n=${String(list.length).padStart(3)} score ${f1(m((o) => o.score))}  kcal ${m((o) => o.nutrients.kcal).toFixed(0)}  ` +
      `C ${m((o) => o.nutrients.carb).toFixed(0)}g P ${m((o) => o.nutrients.protein).toFixed(0)}g F ${m((o) => o.nutrients.fat).toFixed(0)}g S ${m((o) => o.nutrients.sugar).toFixed(0)}g  ` +
      `P% ${f1(m((o) => o.energyPct.protein))} F% ${f1(m((o) => o.energyPct.fat))} C% ${f1(m((o) => o.energyPct.carb))}`,
  );
}

console.log('\n== this week by cafeteria');
for (const c of CAFETERIA_ORDER) {
  const list = options.filter((o) => o.cafeteria === c && o.weekStart === thisWeek);
  console.log(`${CAFETERIAS[c].ko}: n=${list.length} avg score ${f1(mean(list.map((o) => o.score)))}`);
}

if (args.has('--unmatched')) {
  const counts = {};
  for (const i of unmatched) counts[i.name] = (counts[i.name] ?? 0) + 1;
  console.log('\n== unmatched');
  console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${c} ${n}`).join('\n'));
}
if (args.has('--items')) {
  const seen = new Map();
  for (const i of allItems) if (!seen.has(i.name)) seen.set(i.name, i);
  console.log('\n== item → rule');
  for (const i of seen.values()) console.log(`${i.name} → ${i.parts.map((p) => p.rule).join(' + ')}`);
}
