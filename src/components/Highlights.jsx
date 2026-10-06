import { CAFETERIAS, TIMES } from '../lib/menu.js';
import { dayLabel, fmt0, fmt1, signed1 } from '../lib/format.js';
import { CafName, ScoreBadge } from './ScoreBadge.jsx';

export default function Highlights({ best, date, time, weekRanking, weekSummary, isThisWeek }) {
  const { md, dow } = dayLabel(date);
  const top = weekRanking[0];
  const weekWord = isThisWeek ? '이번 주' : '선택한 주';
  return (
    <section className="tiles" aria-label="요약">
      <div className="tile hero">
        <div className="label">
          {md}({dow}) {TIMES[time]?.ko} 다이어트 추천
        </div>
        {best ? (
          <>
            <div className="value">
              {fmt1(best.score)}
              <small>/ 10</small>
            </div>
            <div className="meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'center' }}>
              <CafName cafeteria={best.cafeteria} label={`${CAFETERIAS[best.cafeteria].ko} · ${best.variant}`} />
              <ScoreBadge score={best.score} />
              <span>
                {fmt0(best.nutrients.kcal)} kcal · 단백질 {fmt0(best.nutrients.protein)}g · 당류 {fmt0(best.nutrients.sugar)}g
              </span>
            </div>
          </>
        ) : (
          <div className="value">–</div>
        )}
      </div>

      <div className="tile">
        <div className="label">{weekWord} 다이어트 1위 식당</div>
        {top ? (
          <>
            <div className="value">
              {fmt1(top.summary.score)}
              <small>평균</small>
            </div>
            <div className="meta">
              <CafName cafeteria={top.key} label={CAFETERIAS[top.key].ko} /> · {top.summary.n}개 식단
            </div>
          </>
        ) : (
          <div className="value">–</div>
        )}
      </div>

      <div className="tile">
        <div className="label">{weekWord} 전체 평균 점수</div>
        <div className="value">{fmt1(weekSummary?.score)}</div>
        <div className="meta">
          기준 평균 5.0 대비{' '}
          <b
            style={{
              color: !weekSummary
                ? 'var(--ink)'
                : weekSummary.score - 5 > 0.05
                  ? 'var(--good-text)'
                  : weekSummary.score - 5 < -0.05
                    ? 'var(--bad-text)'
                    : 'var(--ink)',
            }}
          >
            {weekSummary ? signed1(weekSummary.score - 5) : '–'}
          </b>
        </div>
      </div>

      <div className="tile">
        <div className="label">{weekWord} 한 끼 평균</div>
        <div className="value">
          {fmt0(weekSummary?.kcal)}
          <small>kcal</small>
        </div>
        <div className="meta">
          탄수 {fmt0(weekSummary?.pct.carb)}% · 단백질 {fmt0(weekSummary?.pct.protein)}% · 지방 {fmt0(weekSummary?.pct.fat)}%
        </div>
      </div>
    </section>
  );
}
