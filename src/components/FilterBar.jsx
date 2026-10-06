import { TIME_ORDER, TIMES } from '../lib/menu.js';
import { dayLabel, weekRangeLabel } from '../lib/format.js';

export default function FilterBar({
  weekStarts,
  week,
  onWeek,
  thisWeek,
  dates,
  datesWithMeals,
  date,
  onDate,
  today,
  timesAvailable,
  time,
  onTime,
}) {
  const idx = weekStarts.indexOf(week);
  return (
    <nav className="filters" aria-label="기간 선택">
      <div className="week-nav">
        <button className="icon-btn" disabled={idx <= 0} onClick={() => onWeek(weekStarts[idx - 1])} aria-label="이전 주">
          ‹
        </button>
        <span className="label">{weekRangeLabel(week)}</span>
        <button
          className="icon-btn"
          disabled={idx >= weekStarts.length - 1}
          onClick={() => onWeek(weekStarts[idx + 1])}
          aria-label="다음 주"
        >
          ›
        </button>
        {week !== thisWeek && weekStarts.includes(thisWeek) && (
          <button className="link-btn" onClick={() => onWeek(thisWeek)}>
            이번 주
          </button>
        )}
      </div>

      <div className="chips" role="group" aria-label="요일">
        {dates.map((d) => {
          const { md, dow } = dayLabel(d);
          return (
            <button
              key={d}
              className={`chip${d === today ? ' today' : ''}`}
              aria-pressed={d === date}
              disabled={!datesWithMeals.has(d)}
              onClick={() => onDate(d)}
              title={d === today ? '오늘' : undefined}
            >
              {dow}
              <small>{md}</small>
            </button>
          );
        })}
      </div>

      <div className="seg" role="group" aria-label="식사 시간">
        {TIME_ORDER.map((t) => (
          <button key={t} aria-pressed={t === time} disabled={!timesAvailable.has(t)} onClick={() => onTime(t)}>
            {TIMES[t].ko}
          </button>
        ))}
      </div>
    </nav>
  );
}
