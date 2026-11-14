import { CAFETERIAS } from '../lib/menu.js';
import { fmt0, fmt1, signed1 } from '../lib/format.js';
import { DataStatus } from './Shell.jsx';

/** 주석 여백: 점수 읽는 법, 그 주 요약, 추정치 고지. 넓은 화면에서는 기록표 오른쪽에 걸린다. */
export default function Notes({ ranking, weekSummary, weekWord, liveStatus, lastUpdated }) {
  return (
    <aside className="notes" aria-label="읽는 법과 요약">
      <section className="note">
        <h2>점수 읽는 법</h2>
        <p>
          기준 5.0은 같은 끼니의 이전 식단 평균입니다. 칼로리·단백질·당류·지방이 평균보다 나은 만큼 더하고 못한 만큼 뺀 합계가 오른쪽
          점수입니다.
        </p>
        <p>
          <a href="#method">분석 방법 자세히</a>
        </p>
      </section>

      <section className="note note-summary">
        <h2>{weekWord} 요약</h2>
        {ranking.length ? (
          <>
            <ol className="mini">
              {ranking.map(({ key, summary }, i) => (
                <li key={key}>
                  <span className="rank">{i + 1}</span>
                  <b>{CAFETERIAS[key].ko}</b>
                  <span className="v">{fmt1(summary.score)}</span>
                </li>
              ))}
            </ol>
            {weekSummary && (
              <dl className="facts">
                <dt>전체 평균 점수</dt>
                <dd>
                  {fmt1(weekSummary.score)} (기준 대비 {signed1(weekSummary.score - 5)})
                </dd>
                <dt>한 끼 평균</dt>
                <dd>{fmt0(weekSummary.kcal)} kcal</dd>
              </dl>
            )}
          </>
        ) : (
          <p>이 주에는 식단 데이터가 없습니다.</p>
        )}
      </section>

      <section className="note">
        <h2>추정치입니다</h2>
        <p>
          kcal은 식당 공시값이고, 탄수화물·단백질·지방·당류는 메뉴명으로 추정한 값입니다. 점수는 UNIST 식당끼리의 상대 비교입니다.
        </p>
        <p>UNIST 공식 서비스가 아닙니다.</p>
        <DataStatus liveStatus={liveStatus} lastUpdated={lastUpdated} />
      </section>
    </aside>
  );
}
