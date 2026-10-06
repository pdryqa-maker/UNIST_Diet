import { CAFETERIA_ORDER } from './menu.js';
import { mean } from './scoring.js';

const avg = (list, fn) => mean(list.map(fn));

/** 옵션 목록의 평균 영양·점수 요약 */
export function summarize(list) {
  if (!list.length) return null;
  const kcal = avg(list, (o) => o.nutrients.kcal);
  const carb = avg(list, (o) => o.nutrients.carb);
  const protein = avg(list, (o) => o.nutrients.protein);
  const fat = avg(list, (o) => o.nutrients.fat);
  const sugar = avg(list, (o) => o.nutrients.sugar);
  return {
    n: list.length,
    score: avg(list, (o) => o.score),
    kcal,
    carb,
    protein,
    fat,
    sugar,
    pct: {
      carb: avg(list, (o) => o.energyPct.carb),
      protein: avg(list, (o) => o.energyPct.protein),
      fat: avg(list, (o) => o.energyPct.fat),
      sugar: avg(list, (o) => o.energyPct.sugar),
    },
  };
}

export function byCafeteria(list) {
  return CAFETERIA_ORDER.map((key) => ({ key, summary: summarize(list.filter((o) => o.cafeteria === key)) })).filter(
    (row) => row.summary,
  );
}

/** 주별 식당 평균 점수 (추이 차트용) */
export function weeklyTrend(options) {
  const weeks = [...new Set(options.map((o) => o.weekStart))].sort();
  return weeks.map((week) => {
    const row = { week };
    for (const key of CAFETERIA_ORDER) {
      const list = options.filter((o) => o.weekStart === week && o.cafeteria === key);
      row[key] = list.length ? Math.round(avg(list, (o) => o.score) * 10) / 10 : null;
    }
    return row;
  });
}

export const bestOf = (list) => list.reduce((best, o) => (!best || o.score > best.score ? o : best), null);

/** 주 안의 날짜 7개 */
export function weekDates(weekStart) {
  const d = new Date(`${weekStart}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}
