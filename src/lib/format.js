import { DAY_KO, DAYS } from './menu.js';

export const fmt0 = (x) => (x == null || Number.isNaN(x) ? '–' : Math.round(x).toLocaleString('ko-KR'));
export const fmt1 = (x) => (x == null || Number.isNaN(x) ? '–' : x.toFixed(1));
export const signed1 = (x) => (x > 0.04 ? `+${x.toFixed(1)}` : x < -0.04 ? x.toFixed(1) : '0.0');

export function dayLabel(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = DAYS[(d.getUTCDay() + 6) % 7];
  return { md: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, dow: DAY_KO[dow] };
}

export function weekRangeLabel(weekStart) {
  const s = new Date(`${weekStart}T00:00:00Z`);
  const e = new Date(s);
  e.setUTCDate(s.getUTCDate() + 6);
  return `${s.getUTCFullYear()}.${s.getUTCMonth() + 1}.${s.getUTCDate()} – ${e.getUTCMonth() + 1}.${e.getUTCDate()}`;
}

export function dateTimeLabel(isoDateTime) {
  if (!isoDateTime) return '–';
  const d = new Date(isoDateTime);
  const k = new Date(d.getTime() + 9 * 3600e3);
  const pad = (n) => String(n).padStart(2, '0');
  return `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}

/** 점수 → 발산형(diverging) 색 단계. 5점(기준 평균)이 중립 회색. */
export function scoreTone(score) {
  if (score == null) return 'none';
  if (score >= 7) return 'pos2';
  if (score >= 5.5) return 'pos1';
  if (score > 4.5) return 'mid';
  if (score > 3) return 'neg1';
  return 'neg2';
}
