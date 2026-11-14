import { CAFETERIA_ORDER, CAFETERIAS, TIME_ORDER, TIMES } from '../lib/menu.js';
import { dayLabel, fmt0, fmt1, scoreTone } from '../lib/format.js';
import { scoreBand } from '../lib/scoring.js';

const SCALE = [
  { tone: 'pos2', label: '7.0 이상 매우 적합' },
  { tone: 'pos1', label: '5.5–6.9 적합' },
  { tone: 'mid', label: '4.6–5.4 보통' },
  { tone: 'neg1', label: '3.1–4.5 주의' },
  { tone: 'neg2', label: '3.0 이하 부적합' },
];

/** 주간 점수표: 요일 × 끼니 × 식단. 칸을 누르면 그 끼니가 위 기록표에 뜬다. */
export default function WeekTable({ options, dates, selected, onSelect, weekWord }) {
  const groups = TIME_ORDER.map((time) => {
    const list = options.filter((o) => o.time === time);
    const keys = [];
    for (const caf of CAFETERIA_ORDER)
      for (const o of list.filter((x) => x.cafeteria === caf))
        if (!keys.some((k) => k.caf === caf && k.variant === o.variant)) keys.push({ caf, variant: o.variant });
    return { time, keys, list };
  }).filter((g) => g.keys.length);

  return (
    <section className="sec" aria-labelledby="week-title">
      <div className="sec-head">
        <div>
          <h2 id="week-title">{weekWord} 점수표</h2>
          <p>칸을 누르면 그 끼니를 위 기록표에서 자세히 봅니다.</p>
        </div>
      </div>

      {groups.length ? (
        <>
          <table className="week">
            <colgroup>
              <col className="w-row" />
              <col span={dates.length} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">식단</th>
                {dates.map((d) => {
                  const { md, dow } = dayLabel(d);
                  return (
                    <th key={d} scope="col" className={d === selected.date ? 'is-now' : undefined}>
                      {dow}
                      <b>{md.split('/')[1]}</b>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map(({ time, keys, list }) => [
                <tr key={`${time}-h`}>
                  <th className={`time${time === selected.time ? ' is-now' : ''}`} colSpan={dates.length + 1} scope="rowgroup">
                    <span>{TIMES[time].ko}</span>
                  </th>
                </tr>,
                ...keys.map(({ caf, variant }, rowIdx) => (
                  <tr key={`${time}-${caf}-${variant}`}>
                    <th className="rowh" scope="row" title={`${CAFETERIAS[caf].ko} ${variant}`}>
                      {CAFETERIAS[caf].short} {variant}
                    </th>
                    {dates.map((d) => {
                      // 지금 보고 있는 끼니의 칸들은 묶음 전체에 테 하나를 두른다 (index.css .week td.is-now)
                      const now = selected.date === d && selected.time === time;
                      const cellClass = now
                        ? `is-now${rowIdx === 0 ? ' is-first' : ''}${rowIdx === keys.length - 1 ? ' is-last' : ''}`
                        : undefined;
                      const o = list.find((x) => x.date === d && x.cafeteria === caf && x.variant === variant);
                      if (!o)
                        return (
                          <td key={d} className={cellClass}>
                            <span className="na" aria-label="식단 없음">
                              –
                            </span>
                          </td>
                        );
                      const band = scoreBand(o.score);
                      return (
                        <td key={d} className={cellClass}>
                          <button
                            className={`tone-${scoreTone(o.score)}`}
                            aria-pressed={now}
                            onClick={() => onSelect(d, time)}
                            title={`${CAFETERIAS[caf].ko} ${variant} · ${fmt1(o.score)}점 (${band.ko}) · ${fmt0(o.nutrients.kcal)}kcal\n${o.items.map((i) => i.name).join(', ')}`}
                            aria-label={`${dayLabel(d).dow}요일 ${TIMES[time].ko} ${CAFETERIAS[caf].ko} ${variant} ${fmt1(o.score)}점 ${band.ko}`}
                          >
                            {fmt1(o.score)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
          <p className="legend" aria-label="점수 구간">
            {SCALE.map((s) => (
              <span key={s.tone}>
                <i className={`tone-${s.tone}`} aria-hidden="true" />
                {s.label}
              </span>
            ))}
          </p>
        </>
      ) : (
        <p className="empty">
          <b>이 주에는 식단 데이터가 없습니다.</b>
          위에서 다른 주를 골라 보세요.
        </p>
      )}
    </section>
  );
}
