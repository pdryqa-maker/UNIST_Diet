import { CAFETERIAS } from '../lib/menu.js';
import { fmt0, fmt1 } from '../lib/format.js';
import { scoreBand } from '../lib/scoring.js';
import { MACROS, MacroBar } from './MealBoard.jsx';
import { CafName } from './ScoreBadge.jsx';

export function Ranking({ ranking, weekWord }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{weekWord} 식당별 다이어트 적합도</h2>
          <p className="sub">해당 주 모든 끼니·메뉴 점수의 평균 (높을수록 다이어트에 적합)</p>
        </div>
      </div>
      {ranking.length ? (
        <>
          <div className="rank">
            {ranking.map(({ key, summary }, i) => (
              <RankRow key={key} rank={i + 1} cafeteria={key} summary={summary} />
            ))}
          </div>
          <p className="ref-note">세로선 = 기준 평균 5.0점 · 막대 범위 0–10점</p>
        </>
      ) : (
        <p className="empty">데이터가 없습니다.</p>
      )}
    </section>
  );
}

function RankRow({ rank, cafeteria, summary }) {
  const band = scoreBand(summary.score);
  return (
    <>
      <CafName cafeteria={cafeteria} label={`${rank}. ${CAFETERIAS[cafeteria].ko}`} />
      <div className="rank-track" title={`${CAFETERIAS[cafeteria].ko} 평균 ${fmt1(summary.score)}점 (${summary.n}개 식단)`}>
        <span className="bar" style={{ width: `${summary.score * 10}%`, background: `var(--caf-${cafeteria})` }} />
        <span className="ref" style={{ left: '50%' }} aria-hidden="true" />
      </div>
      <span className="rank-val">
        {fmt1(summary.score)}{' '}
        <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--ink-2)' }}>
          {band.icon} {band.ko}
        </span>
      </span>
    </>
  );
}

export function NutrientCompare({ ranking, weekWord }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{weekWord} 식당별 한 끼 평균 영양</h2>
          <p className="sub">막대 = 에너지 구성비(탄수화물·단백질·지방). 다이어트엔 단백질 비율이 높고 당류가 낮을수록 유리합니다.</p>
        </div>
        <div className="legend" aria-label="범례">
          {MACROS.map((m) => (
            <span key={m.key}>
              <span className="swatch" style={{ background: `var(--m-${m.key})` }} aria-hidden="true" />
              {m.ko}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {ranking.map(({ key, summary }) => (
          <div key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, auto) 1fr', gap: 12, alignItems: 'center' }}>
            <CafName cafeteria={key} label={CAFETERIAS[key].ko} />
            <MacroBar
              pct={summary.pct}
              label={`${CAFETERIAS[key].ko}: 탄수화물 ${fmt0(summary.pct.carb)}%, 단백질 ${fmt0(summary.pct.protein)}%, 지방 ${fmt0(summary.pct.fat)}%`}
            />
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>식당</th>
              <th>kcal</th>
              <th>탄수화물</th>
              <th>단백질</th>
              <th>지방</th>
              <th>당류</th>
              <th>단백질 비율</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map(({ key, summary }) => (
              <tr key={key}>
                <td>{CAFETERIAS[key].ko}</td>
                <td>{fmt0(summary.kcal)}</td>
                <td>{fmt0(summary.carb)}g</td>
                <td>{fmt0(summary.protein)}g</td>
                <td>{fmt0(summary.fat)}g</td>
                <td>{fmt0(summary.sugar)}g</td>
                <td>{fmt1(summary.pct.protein)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
