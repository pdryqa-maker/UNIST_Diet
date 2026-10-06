import { CAFETERIAS, TIMES } from '../lib/menu.js';
import { CATEGORY_KO } from '../lib/nutrition.js';
import { FEATURES } from '../lib/scoring.js';
import { dayLabel, fmt0, fmt1, signed1 } from '../lib/format.js';
import { CafName, ScoreBadge } from './ScoreBadge.jsx';

export const MACROS = [
  { key: 'carb', ko: '탄수화물', short: '탄수' },
  { key: 'protein', ko: '단백질', short: '단백질' },
  { key: 'fat', ko: '지방', short: '지방' },
];

export function MacroBar({ pct, label }) {
  return (
    <div className="macro-bar" role="img" aria-label={label}>
      {MACROS.map((m) => (
        <span
          key={m.key}
          style={{ width: `${pct[m.key]}%`, background: `var(--m-${m.key})` }}
          title={`${m.ko} ${fmt0(pct[m.key])}%`}
        />
      ))}
    </div>
  );
}

function Factors({ contributions }) {
  return (
    <div className="factors" aria-label="점수 요인 (기준 평균 대비 가감점)">
      {FEATURES.map((f) => {
        const c = contributions[f.key];
        const w = Math.min(50, (Math.abs(c) / 2.5) * 50);
        return (
          <FactorRow key={f.key} label={f.label} c={c} w={w} />
        );
      })}
    </div>
  );
}

function FactorRow({ label, c, w }) {
  return (
    <>
      <span>{label}</span>
      <span className="factor-track">
        <span className={`factor-fill ${c >= 0 ? 'pos' : 'neg'}`} style={{ width: `${w}%` }} />
      </span>
      <span className="factor-val">{signed1(c)}</span>
    </>
  );
}

function OptionCard({ o, isBest }) {
  const caf = CAFETERIAS[o.cafeteria];
  const n = o.nutrients;
  return (
    <article className={`card${isBest ? ' best' : ''}`}>
      <div className="card-top">
        <div>
          <CafName cafeteria={o.cafeteria} label={caf.ko} />
          <span className="variant">· {o.variant}</span>
          {o.title && <div className="title-tag">{o.title}</div>}
          {isBest && <div className="ribbon">★ 이 시간 다이어트 추천</div>}
        </div>
        <ScoreBadge score={o.score} />
      </div>

      <div>
        <span className="kcal">
          {fmt0(n.kcal)}
          <small>kcal {o.kcalSource === 'official' ? '(식당 공시)' : '(추정)'}</small>
        </span>
      </div>

      <MacroBar
        pct={o.energyPct}
        label={`에너지 구성: 탄수화물 ${fmt0(o.energyPct.carb)}%, 단백질 ${fmt0(o.energyPct.protein)}%, 지방 ${fmt0(o.energyPct.fat)}%`}
      />
      <div className="macro-legend">
        {MACROS.map((m) => (
          <span key={m.key}>
            <span className="swatch" style={{ background: `var(--m-${m.key})`, marginRight: 5 }} aria-hidden="true" />
            {m.short} <b>{fmt0(n[m.key])}g</b> ({fmt0(o.energyPct[m.key])}%)
          </span>
        ))}
        <span>
          당류 <b>{fmt0(n.sugar)}g</b>
        </span>
      </div>

      <Factors contributions={o.contributions} />

      <ul className="menu-list">
        {o.items
          .filter((i) => !i.implied)
          .map((i, idx) => (
            <li key={idx} style={i.optional ? { color: 'var(--muted)' } : undefined}>
              {i.name}
            </li>
          ))}
      </ul>

      <details className="items">
        <summary>메뉴별 추정 영양 성분</summary>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>메뉴 (분류 규칙)</th>
                <th>kcal</th>
                <th>탄수</th>
                <th>단백질</th>
                <th>지방</th>
                <th>당류</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((i, idx) => (
                <tr key={idx} className={i.implied ? 'implied' : undefined}>
                  <td>
                    {i.name}
                    <span className="rule">
                      {i.optional ? '선택 항목 · 합계 제외' : `${CATEGORY_KO[i.cat] ?? i.cat} · ${i.parts.length ? i.parts.map((p) => p.rule).join(' + ') : i.rule}`}
                    </span>
                  </td>
                  <td>{fmt0(i.kcal)}</td>
                  <td>{fmt1(i.carb)}</td>
                  <td>{fmt1(i.protein)}</td>
                  <td>{fmt1(i.fat)}</td>
                  <td>{fmt1(i.sugar)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>합계</b>
                  <span className="rule">
                    {o.kcalSource === 'official'
                      ? `메뉴 추정 ${fmt0(o.estKcal)}kcal → 공시 ${fmt0(o.officialKcal)}kcal에 맞춰 ×${o.factor.toFixed(2)} 보정`
                      : `공시 칼로리 없음 → 전체 보정계수 중앙값 ×${o.factor.toFixed(2)} 적용`}
                  </span>
                </td>
                <td>
                  <b>{fmt0(n.kcal)}</b>
                </td>
                <td>{fmt1(n.carb)}</td>
                <td>{fmt1(n.protein)}</td>
                <td>{fmt1(n.fat)}</td>
                <td>{fmt1(n.sugar)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}

export default function MealBoard({ options, date, time, best }) {
  const { md, dow } = dayLabel(date);
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>
            {md}({dow}) {TIMES[time]?.ko} 식단 분석
          </h2>
          <p className="sub">
            점수는 같은 식사시간의 이전 식단 평균을 5.0으로 둔 상대 점수입니다. 막대는 각 요인이 평균 대비 몇 점을 더하고
            뺐는지 보여줍니다.
          </p>
        </div>
      </div>
      {options.length ? (
        <div className="cards">
          {options.map((o) => (
            <OptionCard key={o.id} o={o} isBest={best && o.id === best.id && options.length > 1} />
          ))}
        </div>
      ) : (
        <p className="empty">이 시간에 운영하는 식당이 없습니다.</p>
      )}
    </section>
  );
}
