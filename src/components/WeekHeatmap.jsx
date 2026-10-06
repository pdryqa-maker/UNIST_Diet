import { CAFETERIA_ORDER, CAFETERIAS, TIME_ORDER, TIMES } from '../lib/menu.js';
import { dayLabel, fmt0, fmt1, scoreTone } from '../lib/format.js';
import { scoreBand } from '../lib/scoring.js';

const SCALE = [
  { tone: 'neg2', label: '≤ 3.0 부적합' },
  { tone: 'neg1', label: '3.1–4.5 주의' },
  { tone: 'mid', label: '4.6–5.4 보통' },
  { tone: 'pos1', label: '5.5–6.9 적합' },
  { tone: 'pos2', label: '≥ 7.0 매우 적합' },
];

export default function WeekHeatmap({ options, dates, selected, onSelect }) {
  const rowsByTime = TIME_ORDER.map((time) => {
    const list = options.filter((o) => o.time === time);
    const keys = [];
    for (const caf of CAFETERIA_ORDER)
      for (const o of list.filter((x) => x.cafeteria === caf))
        if (!keys.some((k) => k.caf === caf && k.variant === o.variant)) keys.push({ caf, variant: o.variant });
    return { time, keys, list };
  }).filter((g) => g.keys.length);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>주간 다이어트 점수표</h2>
          <p className="sub">칸을 누르면 위에서 해당 끼니를 자세히 볼 수 있습니다. 색 + 기호(▲▼)로 평균 대비 위치를 표시합니다.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="heat">
          <thead>
            <tr>
              <th className="row" scope="col">
                식당
              </th>
              {dates.map((d) => {
                const { md, dow } = dayLabel(d);
                return (
                  <th key={d} scope="col">
                    {dow} <span style={{ color: 'var(--muted)' }}>{md}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowsByTime.map(({ time, keys, list }) => [
              <tr key={`${time}-h`}>
                <th className="time" colSpan={dates.length + 1} scope="rowgroup">
                  {TIMES[time].ko}
                </th>
              </tr>,
              ...keys.map(({ caf, variant }) => (
                <tr key={`${time}-${caf}-${variant}`}>
                  <th className="row" scope="row">
                    <span className="caf-name" style={{ fontWeight: 500 }}>
                      {CAFETERIAS[caf].short} {variant}
                    </span>
                  </th>
                  {dates.map((d) => {
                    const o = list.find((x) => x.date === d && x.cafeteria === caf && x.variant === variant);
                    if (!o)
                      return (
                        <td key={d}>
                          <span className="na">–</span>
                        </td>
                      );
                    const band = scoreBand(o.score);
                    const isSel = selected.date === d && selected.time === time;
                    return (
                      <td key={d}>
                        <button
                          className={`tone-${scoreTone(o.score)}`}
                          aria-pressed={isSel}
                          onClick={() => onSelect(d, time)}
                          title={`${CAFETERIAS[caf].ko} ${variant} · ${fmt1(o.score)}점 (${band.ko}) · ${fmt0(o.nutrients.kcal)}kcal\n${o.items.map((i) => i.name).join(', ')}`}
                          aria-label={`${dayLabel(d).dow}요일 ${TIMES[time].ko} ${CAFETERIAS[caf].ko} ${variant} ${fmt1(o.score)}점 ${band.ko}`}
                        >
                          {fmt1(o.score)}
                          <span style={{ fontSize: '0.62rem', marginLeft: 2 }} aria-hidden="true">
                            {band.icon.charAt(0) === '●' ? '' : band.icon.charAt(0)}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
      <div className="scale" aria-label="색 범례">
        {SCALE.map((s) => (
          <span key={s.tone}>
            <i className={`tone-${s.tone}`} />
            {s.label}
          </span>
        ))}
      </div>
    </section>
  );
}
