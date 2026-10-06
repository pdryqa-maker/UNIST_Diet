import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CAFETERIA_ORDER, CAFETERIAS } from '../lib/menu.js';
import { fmt1 } from '../lib/format.js';

const tick = { fill: 'var(--muted)', fontSize: 12 };
const shortWeek = (w) => {
  const d = new Date(`${w}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt">
      <div className="tt-title">{shortWeek(label)} 주</div>
      {[...payload]
        .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
        .map((p) => (
          <div className="tt-row" key={p.dataKey}>
            <span className="key" style={{ background: `var(--caf-${p.dataKey})` }} />
            <b>{fmt1(p.value)}</b>
            <span>{CAFETERIAS[p.dataKey].ko}</span>
          </div>
        ))}
    </div>
  );
}

function EndLabel({ data, dataKey }) {
  return function Label(props) {
    const { x, y, index } = props;
    let last = data.length - 1;
    while (last >= 0 && data[last][dataKey] == null) last--;
    if (index !== last) return null;
    return (
      <text x={x + 8} y={y} dy={4} fontSize={12} fill="var(--ink-2)">
        {CAFETERIAS[dataKey].short}
      </text>
    );
  };
}

export default function TrendChart({ data, selectedWeek }) {
  const [asTable, setAsTable] = useState(false);
  const values = data.flatMap((r) => CAFETERIA_ORDER.map((k) => r[k]).filter((v) => v != null));
  const lo = Math.max(0, Math.floor(Math.min(4, ...values)));
  const hi = Math.min(10, Math.ceil(Math.max(6, ...values)));

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>주별 다이어트 점수 추이</h2>
          <p className="sub">식당별 주간 평균 점수 · 가로선 = 기준 기간 평균 5.0점 · 음영 = 선택한 주</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="legend" aria-label="범례">
            {CAFETERIA_ORDER.map((k) => (
              <span key={k}>
                <span style={{ width: 14, height: 2, background: `var(--caf-${k})`, display: 'inline-block' }} aria-hidden="true" />
                {CAFETERIAS[k].ko}
              </span>
            ))}
          </div>
          <button className="link-btn" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? '차트로 보기' : '표로 보기'}
          </button>
        </div>
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
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 52, bottom: 4, left: -16 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="week" tickFormatter={shortWeek} tick={tick} axisLine={{ stroke: 'var(--axis)' }} tickLine={false} minTickGap={16} />
              <YAxis domain={[lo, hi]} tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
              <ReferenceLine y={5} stroke="var(--ink-2)" strokeWidth={1} />
              {selectedWeek && <ReferenceLine x={selectedWeek} stroke="var(--axis)" strokeWidth={8} strokeOpacity={0.35} />}
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--axis)', strokeWidth: 1 }} />
              {CAFETERIA_ORDER.map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={`var(--caf-${k})`}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ r: 4, fill: `var(--caf-${k})`, stroke: 'var(--surface)', strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                  label={EndLabel({ data, dataKey: k })}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
