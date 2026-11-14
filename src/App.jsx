import { useEffect, useMemo, useState } from 'react';
import { loadDataset } from './lib/dataset.js';
import { bestOf, byCafeteria, summarize, weekDates, weeklyTrend } from './lib/aggregate.js';
import { CAFETERIA_ORDER, TIME_ORDER, currentMealTime } from './lib/menu.js';
import Shell, { ShellFrame } from './components/Shell.jsx';
import Scoreboard from './components/Scoreboard.jsx';
import Notes from './components/Notes.jsx';
import WeekTable from './components/WeekTable.jsx';
import Standings from './components/Standings.jsx';
import TrendChart from './components/TrendChart.jsx';
import Methodology from './components/Methodology.jsx';

const REPO_URL = 'https://github.com/mad-unist/unist-meal-backend';

function pickDate(datesWithMeals, today, wanted) {
  if (wanted && datesWithMeals.has(wanted)) return wanted;
  if (datesWithMeals.has(today)) return today;
  return [...datesWithMeals].sort()[0] ?? null;
}

function pickTime(timesAvailable, isToday, wanted) {
  if (wanted && timesAvailable.has(wanted)) return wanted;
  const preferred = isToday ? currentMealTime() : 'LUNCH';
  if (timesAvailable.has(preferred)) return preferred;
  return TIME_ORDER.find((t) => timesAvailable.has(t)) ?? 'LUNCH';
}

// 점수 높은 순. 동점이면 식당 순서를 따른다.
const byScore = (a, b) => b.score - a.score || CAFETERIA_ORDER.indexOf(a.cafeteria) - CAFETERIA_ORDER.indexOf(b.cafeteria);

function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

export default function App() {
  const [ds, setDs] = useState(null);
  const [error, setError] = useState(null);
  const [week, setWeek] = useState(null);
  const [wantedDate, setWantedDate] = useState(null);
  const [wantedTime, setWantedTime] = useState(null);

  useEffect(() => {
    loadDataset()
      .then((d) => {
        setDs(d);
        setWeek(d.weekStarts.includes(d.thisWeek) ? d.thisWeek : d.weekStarts.at(-1));
      })
      .catch((e) => setError(e.message));
  }, []);

  const view = useMemo(() => {
    if (!ds || !week) return null;
    const weekOpts = ds.options.filter((o) => o.weekStart === week);
    const datesWithMeals = new Set(weekOpts.map((o) => o.date));
    const date = pickDate(datesWithMeals, ds.today, wantedDate);
    const timesAvailable = new Set(weekOpts.filter((o) => o.date === date).map((o) => o.time));
    const time = pickTime(timesAvailable, date === ds.today, wantedTime);
    const slot = weekOpts.filter((o) => o.date === date && o.time === time).sort(byScore);
    return {
      weekOpts,
      dates: weekDates(week),
      datesWithMeals,
      date,
      time,
      timesAvailable,
      slot,
      best: bestOf(slot),
      ranking: byCafeteria(weekOpts).sort((a, b) => b.summary.score - a.summary.score),
      weekSummary: summarize(weekOpts),
    };
  }, [ds, week, wantedDate, wantedTime]);

  const trend = useMemo(() => (ds ? weeklyTrend(ds.options) : []), [ds]);

  if (error)
    return (
      <>
        <ShellFrame />
        <main className="page">
          <div className="state" role="alert">
            <h1>식단을 불러오지 못했습니다</h1>
            <p>저장된 식단과 밥먹어U API 모두에서 데이터를 받지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>
            <p>원인: {error}</p>
            <button className="btn" onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </div>
        </main>
      </>
    );

  if (!ds || !view)
    return (
      <>
        <ShellFrame />
        <main className="page">
          <div className="state" role="status">
            <p>식단을 불러와 분석하는 중입니다.</p>
          </div>
        </main>
      </>
    );

  const weekWord = week === ds.thisWeek ? '이번 주' : '선택한 주';

  return (
    <>
      <Shell
        weekStarts={ds.weekStarts}
        week={week}
        weekSource={ds.weekSources[week]}
        onWeek={(w) => {
          setWeek(w);
          setWantedDate(null);
        }}
        thisWeek={ds.thisWeek}
        dates={view.dates}
        datesWithMeals={view.datesWithMeals}
        date={view.date}
        onDate={setWantedDate}
        today={ds.today}
        timesAvailable={view.timesAvailable}
        time={view.time}
        onTime={setWantedTime}
        liveStatus={ds.liveStatus}
        lastUpdated={ds.lastUpdated}
      />

      <main className="page">
        <Scoreboard key={`${view.date}-${view.time}`} options={view.slot} date={view.date} time={view.time} best={view.best} />

        <Notes
          ranking={view.ranking}
          weekSummary={view.weekSummary}
          weekWord={weekWord}
          liveStatus={ds.liveStatus}
          lastUpdated={ds.lastUpdated}
        />

        <WeekTable
          options={view.weekOpts}
          dates={view.dates}
          selected={{ date: view.date, time: view.time }}
          weekWord={weekWord}
          onSelect={(d, t) => {
            setWantedDate(d);
            setWantedTime(t);
            scrollToTop();
          }}
        />

        <Standings ranking={view.ranking} weekWord={weekWord} />

        <TrendChart data={trend} selectedWeek={week} />

        <Methodology baselines={ds.baselines} fallbackFactor={ds.fallbackFactor} />

        <footer className="footer">
          <p>
            식단 출처: 밥먹어U (<a href="https://github.com/HeXA-UNIST/meal_client">HeXA-UNIST/meal_client</a>, 원 백엔드{' '}
            <a href={REPO_URL}>mad-unist/unist-meal-backend</a>)
          </p>
          <p>
            영양 성분은 메뉴명 기반 추정치입니다. <b>UNIST 공식 서비스가 아닙니다.</b>
          </p>
        </footer>
      </main>
    </>
  );
}
