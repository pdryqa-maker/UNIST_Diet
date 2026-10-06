// 밥먹어U API에서 주간 식단을 모아 public/data/menus.json 스냅샷으로 저장한다.
//
// - 이번 주(+공개됐다면 다음 주)부터 과거로 한 주씩 거슬러 올라가며, 빈 주가 연속 8번 나오면 멈춘다.
// - 기존 스냅샷과 병합하므로 API에서 오래된 주가 사라져도 기록은 남는다 (= 점수 표준화의 기준 기간).
// - 데이터가 그대로면 파일 내용도 그대로라, GitHub Actions에서 변경이 있을 때만 커밋된다.
//
// 사용: node scripts/fetch-menus.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://meal.hexa.pro/v2/menu';
const OUT = fileURLToPath(new URL('../public/data/menus.json', import.meta.url));
const MAX_EMPTY_STREAK = 8;
const MAX_WEEKS_BACK = 104;

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function getJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

async function readSnapshot() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    return { weeks: {} };
  }
}

const hasMeals = (week) => (week.data ?? []).some((c) => (c.meals ?? []).length > 0);

async function main() {
  const snapshot = await readSnapshot();
  const weeks = { ...snapshot.weeks };
  const store = (json) => {
    if (!hasMeals(json)) return false;
    weeks[json.week.startDate] = { lastUpdated: json.lastUpdated, data: json.data };
    return true;
  };

  const current = await getJson(API);
  const currentWeek = current.week.startDate;
  store(current);
  console.log(`current week ${currentWeek}: ${hasMeals(current) ? 'ok' : 'empty'}`);

  if (current.week.nextWeekStart) {
    const next = await getJson(`${API}/${current.week.nextWeekStart}`);
    console.log(`next week ${current.week.nextWeekStart}: ${store(next) ? 'ok' : 'empty'}`);
  }

  let start = addDays(currentWeek, -7);
  let emptyStreak = 0;
  for (let i = 0; i < MAX_WEEKS_BACK && emptyStreak < MAX_EMPTY_STREAK; i++, start = addDays(start, -7)) {
    const json = await getJson(`${API}/${start}`);
    if (store(json)) {
      emptyStreak = 0;
      console.log(`week ${start}: ok`);
    } else {
      emptyStreak++;
    }
  }

  const sorted = Object.fromEntries(Object.keys(weeks).sort().map((k) => [k, weeks[k]]));
  const out = {
    source: API,
    note: '밥먹어U(HeXA-UNIST/meal_client) 공개 API 응답 중 data 필드를 주(월요일 시작) 단위로 보관한 스냅샷',
    weeks: sorted,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(out)}\n`);
  console.log(`saved ${Object.keys(sorted).length} weeks → public/data/menus.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
