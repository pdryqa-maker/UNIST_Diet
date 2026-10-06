// 대시보드 데이터 로딩: 저장된 스냅샷(public/data/menus.json) + 밥먹어U API 실시간 조회를 합친 뒤
// 영양 분석(nutrition.js)과 점수화(scoring.js)를 수행한다.

import { API_BASE, flattenWeeks, kstToday, weekStartOf } from './menu.js';
import { analyzeAll } from './nutrition.js';
import { scoreOptions } from './scoring.js';

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

const hasMeals = (week) => (week?.data ?? []).some((c) => (c.meals ?? []).length > 0);

export async function loadDataset({ live = true } = {}) {
  let snapshot = { weeks: {} };
  try {
    snapshot = await getJson(`${import.meta.env.BASE_URL}data/menus.json`);
  } catch {
    // 스냅샷이 없어도 실시간 데이터만으로 동작한다.
  }
  const weeks = { ...snapshot.weeks };

  let liveStatus = 'skipped';
  if (live) {
    try {
      const current = await getJson(`${API_BASE}/v2/menu`);
      if (hasMeals(current)) weeks[current.week.startDate] = { lastUpdated: current.lastUpdated, data: current.data };
      if (current.week.nextWeekStart) {
        const next = await getJson(`${API_BASE}/v2/menu/${current.week.nextWeekStart}`);
        if (hasMeals(next)) weeks[next.week.startDate] = { lastUpdated: next.lastUpdated, data: next.data };
      }
      liveStatus = 'ok';
    } catch {
      liveStatus = 'failed';
    }
  }

  if (!Object.keys(weeks).length) throw new Error('식단 데이터를 불러오지 못했습니다.');
  return buildDataset(weeks, liveStatus);
}

export function buildDataset(weeks, liveStatus = 'skipped', now = new Date()) {
  const today = kstToday(now);
  const thisWeek = weekStartOf(today);
  const { options: analyzed, fallbackFactor } = analyzeAll(flattenWeeks(weeks));
  const { options, baselines } = scoreOptions(analyzed, thisWeek);
  const lastUpdated = Object.values(weeks)
    .map((w) => w.lastUpdated)
    .filter(Boolean)
    .sort()
    .pop();
  return {
    options,
    baselines,
    fallbackFactor,
    weekStarts: [...new Set(options.map((o) => o.weekStart))].sort(),
    // API에서 받은 주는 source가 없고, HeXA 아카이브(OCR)에서 가져온 주는 출처 문자열이 있다.
    weekSources: Object.fromEntries(Object.entries(weeks).map(([k, w]) => [k, w.source ?? null])),
    today,
    thisWeek,
    lastUpdated,
    liveStatus,
  };
}
