// 밥먹어U API(https://meal.hexa.pro/v2/menu) 응답을 "식단 옵션" 단위로 평탄화한다.
//
// 식단 옵션 = (날짜, 식사시간, 식당, 메뉴타입, 섹션) 하나. 예: 10/6 점심 기숙사식당 한식 정식.
// 원본 백엔드(mad-unist/unist-meal-backend)의 Menu 모델(place/type/time/content/calorie/date)과
// 같은 단위이며, 지금의 v2 API는 이를 cafeteria → meals → menusByType → sections 로 내려준다.

export const API_BASE = 'https://meal.hexa.pro';

export const CAFETERIAS = {
  DORMITORY: { key: 'DORMITORY', ko: '기숙사식당', short: '기숙사', en: 'Dormitory' },
  STUDENT: { key: 'STUDENT', ko: '학생식당', short: '학생', en: 'Student' },
  FACULTY: { key: 'FACULTY', ko: '교직원식당', short: '교직원', en: 'Faculty' },
};
export const CAFETERIA_ORDER = ['DORMITORY', 'STUDENT', 'FACULTY'];

export const TIMES = {
  BREAKFAST: { key: 'BREAKFAST', ko: '아침' },
  LUNCH: { key: 'LUNCH', ko: '점심' },
  DINNER: { key: 'DINNER', ko: '저녁' },
};
export const TIME_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER'];

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const DAY_KO = { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' };

const MENU_TYPE_KO = { KOREAN: '한식', HALAL: '할랄' };
const SECTION_KO = { REGULAR: '정식', SPECIAL: '일품', CONVENIENCE: '간편식' };

// 샐러드바는 선택 사항이라 공식 앱(meal_client)과 동일하게 분석에서 제외한다.
const SKIPPED_SECTIONS = new Set(['SALAD']);

// 휴무일에는 "추석", "개원기념일" 같은 한 줄짜리 안내만 들어온다.
const CLOSED_RE =
  /휴무|휴점|휴관|공휴일|연휴|추석|설날|명절|한글날|제헌절|개원기념일|광복절|개천절|현충일|어린이날|성탄|크리스마스|부처님|석가|선거|미운영|운영\s*안|운영없|없음|미정/;

export function isClosedOption(items, kcal) {
  if (items.length === 0) return true;
  if (kcal) return false;
  return items.length <= 2 && items.every((it) => CLOSED_RE.test(it.ko));
}

export function optionLabel(opt) {
  const caf = CAFETERIAS[opt.cafeteria]?.ko ?? opt.cafeteria;
  return `${caf} · ${opt.variant}`;
}

function variantName(cafeteria, menuType, sectionType) {
  const section = SECTION_KO[sectionType] ?? sectionType;
  if (cafeteria === 'DORMITORY' && sectionType === 'REGULAR') return MENU_TYPE_KO[menuType] ?? menuType;
  return section;
}

/** 주간 응답 하나({lastUpdated, data})를 식단 옵션 배열로 변환 */
export function flattenWeek(weekStart, week) {
  const out = [];
  for (const caf of week.data ?? []) {
    for (const meal of caf.meals ?? []) {
      for (const group of meal.menusByType ?? []) {
        (group.sections ?? []).forEach((section, idx) => {
          if (SKIPPED_SECTIONS.has(section.sectionType)) return;
          const items = (section.menus ?? [])
            .map((m) => ({ ko: String(m.ko ?? '').trim(), en: m.en ?? null, allergens: m.allergens ?? [] }))
            .filter((m) => m.ko);
          const kcal = typeof section.calorie === 'number' && section.calorie > 0 ? section.calorie : null;
          if (isClosedOption(items, kcal)) return;
          out.push({
            id: [meal.date, meal.timeType, caf.cafeteria, group.menuType, section.sectionType, idx].join('|'),
            weekStart,
            date: meal.date,
            dayOfWeek: meal.dayOfWeek,
            time: meal.timeType,
            cafeteria: caf.cafeteria,
            menuType: group.menuType,
            sectionType: section.sectionType,
            variant: variantName(caf.cafeteria, group.menuType, section.sectionType),
            title: section.sectionTitle?.ko ?? null,
            officialKcal: kcal,
            items,
          });
        });
      }
    }
  }
  return out;
}

/** {[weekStart]: week} 스냅샷 전체를 날짜순 옵션 배열로 */
export function flattenWeeks(weeks) {
  return Object.keys(weeks)
    .sort()
    .flatMap((ws) => flattenWeek(ws, weeks[ws]))
    .sort((a, b) =>
      a.date === b.date
        ? TIME_ORDER.indexOf(a.time) - TIME_ORDER.indexOf(b.time) ||
          CAFETERIA_ORDER.indexOf(a.cafeteria) - CAFETERIA_ORDER.indexOf(b.cafeteria)
        : a.date < b.date ? -1 : 1,
    );
}

// ── 날짜 유틸 (모두 KST 달력 기준 'YYYY-MM-DD' 문자열) ────────────────────

export function kstToday(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekStartOf(iso) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0=일
  return addDays(iso, -((dow + 6) % 7));
}

/** 공식 앱과 같은 기준: ~09:20 아침, ~13:30 점심, 이후 저녁 */
export function currentMealTime(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600e3);
  const minutes = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  if (minutes <= 9 * 60 + 20) return 'BREAKFAST';
  if (minutes <= 13 * 60 + 30) return 'LUNCH';
  return 'DINNER';
}
