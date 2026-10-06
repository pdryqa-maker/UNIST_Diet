// HeXA-UNIST/BapuServerlessApi 의 menus/ 아카이브를 스냅샷(public/data/menus.json)에 합친다.
//
// 이 아카이브는 HeXA가 식단표 이미지를 Gemini로 읽어(OCR) 식당별·주별 JSON으로 저장한 것으로,
// 밥먹어U API(2026-06-29~)보다 이전 주(2025-11-24~)까지 담고 있다. API와 겹치는 375끼에서
// 칼로리가 372끼 정확히 일치(나머지 ±1kcal)해 같은 원천으로 보인다.
//
// - API에 이미 있는 주는 건드리지 않는다 (API 쪽이 할랄/간편식/일품 구분과 영문명까지 있어 더 풍부).
// - 파서가 실행 연도를 붙이는 버그로 1월 초 날짜가 전년도로 찍힌 경우, 파일의 주 시작일 기준으로 보정한다.
// - 특정 커밋(PINNED_SHA)에 고정해 받으므로 다시 실행해도 결과가 같다.
//
// 사용: node scripts/import-archive.mjs [커밋SHA|latest]

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const REPO = 'HeXA-UNIST/BapuServerlessApi';
const PINNED_SHA = '5fb3bb8f2e33af97dfd4c0ffadfe13c709fa2ae1';
const OUT = fileURLToPath(new URL('../public/data/menus.json', import.meta.url));

const CAFETERIA = {
  기숙사_식당_한식: ['DORMITORY', 'KOREAN'],
  기숙사_식당_할랄: ['DORMITORY', 'HALAL'],
  학생_식당: ['STUDENT', 'KOREAN'],
  교직원_식당: ['FACULTY', 'KOREAN'],
};
const TIME = { 1: 'BREAKFAST', 2: 'LUNCH', 3: 'DINNER' };
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'unist-diet' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

// OCR은 식단표의 제목·구분선까지 메뉴로 읽는다.
//   '<천원의 아침밥>', '♡즐거운식탁♡', '* 11월의 즐거운식탁 *'  → 섹션 제목
//   '<간편식 25개 한정> 쌀빵/쥬시쿨/후랑크'                     → 여기부터 간편식 섹션 (API의 CONVENIENCE)
const TITLE_RE = /^([<★♡♥☆*].*[>★♡♥☆*]|할랄푸드|\S+식\s*\([\d,]+\))$/;
const CONVENIENCE_RE = /^<([^>]*간편식[^>]*)>\s*(.*)$/;
const cleanTitle = (s) => s.replace(/[<>★♡♥☆*]/g, '').replace(/\s+/g, ' ').trim();

/** 메뉴 목록을 [정식, 간편식] 섹션으로 나눈다. 공시 칼로리는 정식 쪽이다. */
function toSections(menus, calorie) {
  const regular = { sectionType: 'REGULAR', sectionTitle: null, calorie: calorie > 0 ? calorie : null, sectionAllergens: null, menus: [] };
  const sections = [regular];
  let current = regular;
  for (const raw of menus) {
    const name = String(raw).trim();
    const conv = name.match(CONVENIENCE_RE);
    if (conv) {
      current = { sectionType: 'CONVENIENCE', sectionTitle: { ko: cleanTitle(conv[1]), en: null }, calorie: null, sectionAllergens: null, menus: [] };
      sections.push(current);
      if (conv[2]) current.menus.push({ ko: conv[2], en: null, allergens: [] });
    } else if (TITLE_RE.test(name)) {
      current.sectionTitle ??= { ko: cleanTitle(name), en: null };
    } else if (name) {
      current.menus.push({ ko: name, en: null, allergens: [] });
    }
  }
  return sections.filter((s) => s.menus.length);
}

/** 아카이브의 한 줄(식당·날짜·끼니)을 API와 같은 구조로 넣는다 */
function addRow(week, row, weekStart) {
  const mapped = CAFETERIA[row.restaurant_name];
  if (!mapped) throw new Error(`unknown restaurant_name: ${row.restaurant_name}`);
  const [cafeteria, menuType] = mapped;

  let date = row.date;
  if (date < weekStart) date = `${Number(date.slice(0, 4)) + 1}${date.slice(4)}`;
  if (date < weekStart || date > addDays(weekStart, 6)) throw new Error(`date ${row.date} outside week ${weekStart}`);

  let caf = week.data.find((c) => c.cafeteria === cafeteria);
  if (!caf) week.data.push((caf = { cafeteria, meals: [] }));
  const timeType = TIME[row.time];
  let meal = caf.meals.find((m) => m.date === date && m.timeType === timeType);
  if (!meal) {
    const dayOfWeek = DOW[new Date(`${date}T00:00:00Z`).getUTCDay()];
    caf.meals.push((meal = { date, dayOfWeek, timeType, menusByType: [] }));
  }
  meal.menusByType.push({ menuType, sections: toSections(row.menus, row.calorie) });
}

async function main() {
  const arg = process.argv[2] ?? PINNED_SHA;
  const sha =
    arg === 'latest' ? (await getJson(`https://api.github.com/repos/${REPO}/commits?path=menus&per_page=1`))[0].sha : arg;
  const files = (await getJson(`https://api.github.com/repos/${REPO}/contents/menus?ref=${sha}`)).filter((f) =>
    f.name.endsWith('.json'),
  );
  console.log(`${REPO}@${sha.slice(0, 7)}: ${files.length} files`);

  const snapshot = JSON.parse(await readFile(OUT, 'utf8'));
  const archive = {};
  for (const f of files) {
    const weekStart = f.name.match(/(\d{4}-\d{2}-\d{2})\.json$/)?.[1];
    if (!weekStart) continue;
    const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${sha}/menus/${encodeURIComponent(f.name)}`);
    if (!res.ok) throw new Error(`${f.name}: HTTP ${res.status}`);
    const rows = await res.json();
    archive[weekStart] ??= { lastUpdated: null, source: `${REPO}@${sha.slice(0, 7)} (OCR)`, data: [] };
    for (const row of rows) addRow(archive[weekStart], row, weekStart);
  }

  // API에서 받은 주(source 없음)는 유지하고, 이전에 가져온 아카이브 주는 새로 덮어쓴다 (재실행해도 같은 결과).
  let added = 0;
  for (const [weekStart, week] of Object.entries(archive)) {
    const existing = snapshot.weeks[weekStart];
    if (existing && !existing.source?.startsWith(REPO)) continue;
    snapshot.weeks[weekStart] = week;
    added++;
  }
  snapshot.weeks = Object.fromEntries(Object.keys(snapshot.weeks).sort().map((k) => [k, snapshot.weeks[k]]));
  await writeFile(OUT, `${JSON.stringify(snapshot)}\n`);
  console.log(`added ${added} archive weeks (skipped ${Object.keys(archive).length - added} already covered by the API)`);
  console.log(`snapshot now ${Object.keys(snapshot.weeks).length} weeks: ${Object.keys(snapshot.weeks)[0]} ~ ${Object.keys(snapshot.weeks).at(-1)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
