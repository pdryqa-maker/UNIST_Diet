import { CAFETERIAS } from '../lib/menu.js';
import { fmt0, fmt1, signed1, signOf } from '../lib/format.js';
import { MACROS } from '../lib/macros.js';
import MixBar from './MixBar.jsx';

/** 순위표: 그 주 식당별 평균 점수와 한 끼 평균 영양. */
export default function Standings({ ranking, weekWord }) {
  return (
    <section className="sec" aria-labelledby="stand-title">
      <div className="sec-head">
        <div>
          <h2 id="stand-title">{weekWord} 순위표</h2>
          <p>그 주 모든 식단 점수의 평균입니다. 차는 기준 5.0과의 차이, 영양은 한 끼 평균입니다.</p>
        </div>
        <p className="legend stand-legend" aria-hidden="true">
          {MACROS.map((m) => (
            <span key={m.key}>
              <i style={{ background: `var(--m-${m.key})` }} />
              {m.ko}
            </span>
          ))}
        </p>
      </div>

      {ranking.length ? (
        <div className="table-scroll">
          <table className="stand">
            <thead>
              <tr>
                <th scope="col" className="s-rank">
                  순위
                </th>
                <th scope="col" className="s-name">
                  식당
                </th>
                <th scope="col" className="opt">
                  식단 수
                </th>
                <th scope="col">점수</th>
                <th scope="col">차</th>
                <th scope="col">kcal</th>
                <th scope="col" className="opt">
                  탄수화물
                </th>
                <th scope="col">단백질</th>
                <th scope="col" className="opt">
                  지방
                </th>
                <th scope="col">당류</th>
                <th scope="col" className="opt">
                  단백질 비율
                </th>
                <th scope="col" className="opt s-mix">
                  에너지 구성
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ key, summary }, i) => {
                const diff = summary.score - 5;
                return (
                  <tr key={key}>
                    <td className="s-rank">{i + 1}</td>
                    <td className="s-name">{CAFETERIAS[key].ko}</td>
                    <td className="opt">{summary.n}</td>
                    <td className="s-score">{fmt1(summary.score)}</td>
                    <td className={`s-diff is-${signOf(diff)}`}>{signed1(diff)}</td>
                    <td>{fmt0(summary.kcal)}</td>
                    <td className="opt">
                      {fmt0(summary.carb)}
                      <span className="unit">g</span>
                    </td>
                    <td>
                      {fmt0(summary.protein)}
                      <span className="unit">g</span>
                    </td>
                    <td className="opt">
                      {fmt0(summary.fat)}
                      <span className="unit">g</span>
                    </td>
                    <td>
                      {fmt0(summary.sugar)}
                      <span className="unit">g</span>
                    </td>
                    <td className="opt">
                      {fmt1(summary.pct.protein)}
                      <span className="unit">%</span>
                    </td>
                    <td className="opt s-mix">
                      <MixBar pct={summary.pct} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          <b>이 주에는 식단 데이터가 없습니다.</b>
          위에서 다른 주를 골라 보세요.
        </p>
      )}
    </section>
  );
}
