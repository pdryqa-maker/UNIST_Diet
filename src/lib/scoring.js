// 다이어트 적합도 점수 (0.0 ~ 10.0)
//
// 1) 식단마다 4가지 지표를 계산한다.
//      kcal          에너지        (낮을수록 좋음)  가중치 0.35
//      protein %     단백질 에너지비 (높을수록 좋음)  가중치 0.30
//      sugar %       당류 에너지비   (낮을수록 좋음)  가중치 0.20
//      fat %         지방 에너지비   (낮을수록 좋음)  가중치 0.15
// 2) 지표마다 "이전 식단(기준 기간)"의 같은 식사시간(아침/점심/저녁) 분포로 z-점수를 내고,
//    부호를 맞춰 가중합한 값을 원점수로 쓴다.
// 3) 원점수를 다시 기준 기간 분포로 표준화해 5 + 2·z 로 옮긴다.
//    → 기준 기간의 평균 식단 = 5.0점, 표준편차 = 2점. 0~10으로 자르고 소수점 한 자리로 반올림.
//
// 같은 식사시간끼리 비교하는 이유: 아침은 기숙사식당만 운영하고 구성도 달라 점심·저녁과 섞으면 왜곡된다.

export const FEATURES = [
  { key: 'kcal', label: '칼로리', weight: 0.35, dir: -1, get: (o) => o.nutrients.kcal, unit: 'kcal' },
  { key: 'protein', label: '단백질 비율', weight: 0.3, dir: 1, get: (o) => o.energyPct.protein, unit: '%' },
  { key: 'sugar', label: '당류 비율', weight: 0.2, dir: -1, get: (o) => o.energyPct.sugar, unit: '%' },
  { key: 'fat', label: '지방 비율', weight: 0.15, dir: -1, get: (o) => o.energyPct.fat, unit: '%' },
];

const MIN_BASELINE = 20;

const stats = (xs) => {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1)) || 1;
  return { mean, sd, n };
};

const rawScore = (o, featStats) =>
  FEATURES.reduce((acc, f) => acc + f.weight * f.dir * ((f.get(o) - featStats[f.key].mean) / featStats[f.key].sd), 0);

export const clampScore = (x) => Math.round(Math.min(10, Math.max(0, x)) * 10) / 10;

/**
 * @param options analyzeAll()로 영양 분석이 끝난 옵션들
 * @param baselineEnd 이 날짜(미포함) 이전 식단을 기준 기간으로 쓴다 (보통 이번 주 월요일)
 */
export function scoreOptions(options, baselineEnd) {
  const byTime = {};
  for (const o of options) (byTime[o.time] ??= []).push(o);

  const baselines = {};
  const scored = [];
  for (const [time, list] of Object.entries(byTime)) {
    let base = list.filter((o) => o.date < baselineEnd);
    const usedFallback = base.length < MIN_BASELINE;
    if (usedFallback) base = list;

    const featStats = Object.fromEntries(FEATURES.map((f) => [f.key, stats(base.map(f.get))]));
    const rawStats = stats(base.map((o) => rawScore(o, featStats)));
    baselines[time] = {
      n: base.length,
      from: base[0]?.date,
      to: base[base.length - 1]?.date,
      usedFallback,
      features: featStats,
      raw: rawStats,
    };

    for (const o of list) {
      const raw = rawScore(o, featStats);
      const z = (raw - rawStats.mean) / rawStats.sd;
      const contributions = Object.fromEntries(
        FEATURES.map((f) => [f.key, (f.weight * f.dir * ((f.get(o) - featStats[f.key].mean) / featStats[f.key].sd) * 2) / rawStats.sd]),
      );
      scored.push({ ...o, score: clampScore(5 + 2 * z), z, contributions });
    }
  }
  return { options: scored, baselines };
}

export function scoreBand(score) {
  if (score >= 7) return { key: 'great', ko: '매우 적합', icon: '▲▲' };
  if (score >= 5.5) return { key: 'good', ko: '적합', icon: '▲' };
  if (score > 4.5) return { key: 'avg', ko: '보통', icon: '●' };
  if (score > 3) return { key: 'meh', ko: '주의', icon: '▼' };
  return { key: 'bad', ko: '부적합', icon: '▼▼' };
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
