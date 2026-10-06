import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CAFETERIA_ORDER, CAFETERIAS } from '../lib/menu.js';
import { fmt1, scoreTone } from '../lib/format.js';
import { scoreBand } from '../lib/scoring.js';

const tick = { fill: 'var(--muted)', fontSize: 11 };
const shortWeek = (w) => {
  const d = new Date(`${w}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const v = payload[0].value;
  const band = scoreBand(v);
  return (
    <div className="tt">
      <div className="tt-title">{shortWeek(label)} 주</div>
      <div className="tt-row">
        <span className="key" style={{ background: `var(--sig-${scoreTone(v)})`, height: 8, width: 8, borderRadius: 4 }} />
        <b>{fmt1(v)}</b>
        <span>
          {band.icon} {band.ko}
        </span>
      </div>
    </div>
  );
}

// 점 색 = 그 주 점수의 신호(초록 적합 / 회색 보통 / 빨강 부적합)
function SignalDot({ cx, cy, value, r = 4 }) {
  if (value == null || cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={r} fill={`var(--sig-${scoreTone(value)})`} stroke="var(--surface)" strokeWidth={2} />;
}

function Panel({ cafeteria, data, domain, selectedWeek }) {
  const rows = data.map((r) => ({ week: r.week, v: r[cafeteria] }));
  const latest = [...rows].reverse().find((r) => r.v != null);
  return (
    <div className="trend-panel">
      <div className="trend-head">
        <span className="caf-name">{CAFETERIAS[cafeteria].ko}</span>
        {latest && (
          <span className="trend-latest">
            최근 <b>{fmt1(latest.v)}</b>
          </span>
        )}
      </div>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 8, right: 10, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="week" tickFormatter={shortWeek} tick={tick} axisLine={{ stroke: 'var(--axis)' }} tickLine={false} minTickGap={24} />
            <YAxis domain={domain} tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
            <ReferenceLine y={5} stroke="var(--ink-2)" strokeWidth={1} />
            {selectedWeek && <ReferenceLine x={selectedWeek} stroke="var(--surface-3)" strokeWidth={10} />}
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--axis)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--ink-2)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={<SignalDot />}
              activeDot={<SignalDot r={6} />}
              connectNulls
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
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>주별 다이어트 점수 추이</h2>
          <p className="sub">식당별 주간 평균 점수 · 가로선 = 기준 평균 5.0점 · 점 색 = 적합(초록) / 보통(회색) / 부적합(빨강)</p>
        </div>
        <button className="link-btn" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? '차트로 보기' : '표로 보기'}
        </button>
      </div>

      {asTable ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>주 시작</th>
                {CAFETERIA_ORDER.map((k) => (
                  <th key={k}>{CAFETERIAS[k].ko}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.week} style={r.week === selectedWeek ? { fontWeight: 650 } : undefined}>
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
