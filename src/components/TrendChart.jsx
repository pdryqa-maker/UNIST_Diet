import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CAFETERIA_ORDER, CAFETERIAS } from '../lib/menu.js';
import { fmt1, scoreTone } from '../lib/format.js';
import { scoreBand } from '../lib/scoring.js';

const tick = { fill: 'var(--ink-2)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-num)' };
const shortWeek = (w) => {
  const d = new Date(`${w}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const v = payload[0].value;
  return (
    <div className="tt">
      <div className="tt-title">{shortWeek(label)} 주</div>
      <div className="tt-row">
        <span className="tt-key" style={{ background: `var(--sig-${scoreTone(v)})` }} />
        <b>{fmt1(v)}</b>
        <span>{scoreBand(v).ko}</span>
      </div>
    </div>
  );
}

// 점 색 = 그 주 점수의 구간 (초록 적합 / 회색 보통 / 빨강 부적합)
function SignalDot({ cx, cy, value, r = 4 }) {
  if (value == null || cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={r} fill={`var(--sig-${scoreTone(value)})`} stroke="var(--paper)" strokeWidth={2} />;
}

function Panel({ cafeteria, data, domain, selectedWeek }) {
  const rows = data.map((r) => ({ week: r.week, v: r[cafeteria] }));
  // 머리의 숫자는 노란 띠가 가리키는 주(지금 보고 있는 주)의 값이다. 순위표·주석 여백의 숫자와 같아야 한다.
  const viewed = rows.find((r) => r.week === selectedWeek);
  return (
    <div className="trend-panel">
      <div className="trend-head">
        <span className="name">{CAFETERIAS[cafeteria].ko}</span>
        {selectedWeek && (
          <span className="trend-latest">
            {shortWeek(selectedWeek)} 주<b>{fmt1(viewed?.v)}</b>
          </span>
        )}
      </div>
      <div className="trend-plot">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--rule)" vertical={false} />
            <XAxis dataKey="week" tickFormatter={shortWeek} tick={tick} axisLine={{ stroke: 'var(--ink)' }} tickLine={false} minTickGap={24} />
            <YAxis domain={domain} ticks={[domain[0], 5, domain[1]]} tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
            {selectedWeek && <ReferenceLine x={selectedWeek} stroke="var(--hi)" strokeWidth={12} />}
            <ReferenceLine y={5} stroke="var(--ink-2)" strokeWidth={1} strokeDasharray="4 3" />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--ink-2)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--ink)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={<SignalDot />}
              activeDot={<SignalDot r={6} />}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function TrendChart({ data, selectedWeek }) {
  const [asTable, setAsTable] = useState(false);
  const values = data.flatMap((r) => CAFETERIA_ORDER.map((k) => r[k]).filter((v) => v != null));
  const domain = [Math.max(0, Math.floor(Math.min(4, ...values))), Math.min(10, Math.ceil(Math.max(6, ...values)))];

  return (
    <section className="sec" aria-labelledby="trend-title">
      <div className="sec-head">
        <div>
          <h2 id="trend-title">주별 점수 추이</h2>
          <p>식당별 주간 평균 점수입니다. 점선은 기준 5.0, 점 색은 점수 구간, 노란 띠와 오른쪽 위 숫자는 지금 보고 있는 주입니다. 식단이 없던 주는 선이 끊깁니다.</p>
        </div>
        <button className="btn" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          표로 보기
        </button>
      </div>

      {asTable ? (
        <div className="table-scroll">
          <table className="plain">
            <thead>
              <tr>
                <th scope="col">주 시작</th>
                {CAFETERIA_ORDER.map((k) => (
                  <th key={k} scope="col">
                    {CAFETERIAS[k].ko}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.week} className={r.week === selectedWeek ? 'is-now' : undefined}>
                  <td>{r.week}</td>
                  {CAFETERIA_ORDER.map((k) => (
                    <td key={k}>{fmt1(r[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="trend-grid">
          {CAFETERIA_ORDER.map((k) => (
            <Panel key={k} cafeteria={k} data={data} domain={domain} selectedWeek={selectedWeek} />
          ))}
        </div>
      )}
    </section>
  );
}
