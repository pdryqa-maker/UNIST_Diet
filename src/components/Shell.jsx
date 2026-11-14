import { TIME_ORDER, TIMES } from '../lib/menu.js';
import { dateTimeLabel, dayLabel, weekRangeLabel } from '../lib/format.js';

const STATUS_TEXT = {
  ok: '밥먹어U 실시간',
  failed: '실시간 연결 실패 · 저장된 식단 사용',
  skipped: '저장된 식단',
};

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={dir === 'prev' ? 'M10.5 2.5 5 8l5.5 5.5' : 'M5.5 2.5 11 8l-5.5 5.5'} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** 데이터 출처와 갱신 시각. 넓은 화면에서는 셸에, 좁은 화면에서는 주석 여백에 놓인다. */
export function DataStatus({ liveStatus, lastUpdated }) {
  return (
    <p className="status">
      <span>
        <span className={`dot ${liveStatus}`} aria-hidden="true" />
        {STATUS_TEXT[liveStatus] ?? STATUS_TEXT.skipped}
      </span>
      <span>갱신 {dateTimeLabel(lastUpdated)}</span>
    </p>
  );
}

export function ShellFrame({ children }) {
  return (
    <header className="shell">
      <div className="shell-in">
        <p className="brand">UNIST Diet</p>
        {children}
      </div>
    </header>
  );
}

export default function Shell({
  weekStarts,
  week,
  weekSource,
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
  liveStatus,
  lastUpdated,
}) {
  const idx = weekStarts.indexOf(week);
  return (
    <ShellFrame>
      <div className="week-nav" role="group" aria-label="주 선택">
        <button className="icon-btn" disabled={idx <= 0} onClick={() => onWeek(weekStarts[idx - 1])} aria-label="이전 주">
          <Chevron dir="prev" />
        </button>
        <span className="week-label">{weekRangeLabel(week)}</span>
        <button
          className="icon-btn"
          disabled={idx >= weekStarts.length - 1}
          onClick={() => onWeek(weekStarts[idx + 1])}
          aria-label="다음 주"
        >
          <Chevron dir="next" />
        </button>
        {weekSource && (
          <span className="shell-chip" title={`식단표 이미지 OCR 데이터: ${weekSource}`}>
            OCR 아카이브
          </span>
        )}
        {week !== thisWeek && weekStarts.includes(thisWeek) && (
          <button className="this-week" onClick={() => onWeek(thisWeek)}>
            이번 주로
          </button>
        )}
      </div>

      <div className="days" role="group" aria-label="요일">
        {dates.map((d) => {
          const { md, dow } = dayLabel(d);
          const isToday = d === today;
          return (
            <button
              key={d}
              className={`day${isToday ? ' is-today' : ''}`}
              aria-pressed={d === date}
              disabled={!datesWithMeals.has(d)}
              onClick={() => onDate(d)}
              title={isToday ? `${md} 오늘` : md}
            >
              {dow}
              <b>{md.split('/')[1]}</b>
              {isToday && <span className="sr-only">오늘</span>}
            </button>
          );
        })}
      </div>

      <div className="meals" role="group" aria-label="식사 시간">
        {TIME_ORDER.map((t) => (
          <button key={t} className="meal" aria-pressed={t === time} disabled={!timesAvailable.has(t)} onClick={() => onTime(t)}>
            {TIMES[t].ko}
          </button>
        ))}
      </div>

      <DataStatus liveStatus={liveStatus} lastUpdated={lastUpdated} />
    </ShellFrame>
  );
}
