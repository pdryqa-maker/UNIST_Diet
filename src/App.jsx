import { useEffect, useMemo, useState } from 'react';
import { loadDataset } from './lib/dataset.js';
import { bestOf, byCafeteria, summarize, weekDates, weeklyTrend } from './lib/aggregate.js';
import { CAFETERIA_ORDER, TIME_ORDER, currentMealTime } from './lib/menu.js';
import { dateTimeLabel } from './lib/format.js';
import FilterBar from './components/FilterBar.jsx';
import Highlights from './components/Highlights.jsx';
import MealBoard from './components/MealBoard.jsx';
import WeekHeatmap from './components/WeekHeatmap.jsx';
import { NutrientCompare, Ranking } from './components/CafeteriaComparison.jsx';
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
    const slot = weekOpts
      .filter((o) => o.date === date && o.time === time)
      .sort((a, b) => CAFETERIA_ORDER.indexOf(a.cafeteria) - CAFETERIA_ORDER.indexOf(b.cafeteria));
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

  if (error) return <div className="app loading">⚠️ {error}</div>;
  if (!ds || !view) return <div className="app loading">식단을 불러와 분석하는 중…</div>;

  const isThisWeek = week === ds.thisWeek;
  const weekWord = isThisWeek ? '이번 주' : '선택한 주';

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🥗 UNIST Diet</h1>
          <p>기숙사·학생·교직원 식당 식단의 탄수화물·단백질·지방·당류를 추정하고 다이어트 적합도를 0–10점으로 매깁니다.</p>
        </div>
        <div className="status">
          <span>
            <span className={`dot ${ds.liveStatus}`} aria-hidden="true" />
            {ds.liveStatus === 'ok' ? '밥먹어U API 실시간 연결' : ds.liveStatus === 'failed' ? 'API 연결 실패 · 저장된 스냅샷 사용' : '저장된 스냅샷'}
          </span>
          <span>식단 갱신 {dateTimeLabel(ds.lastUpdated)}</span>
          <a href="#method">분석 방법</a>
        </div>
      </header>

      <FilterBar
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
      />

      <Highlights
        best={view.best}
        date={view.date}
        time={view.time}
        weekRanking={view.ranking}
        weekSummary={view.weekSummary}
        isThisWeek={isThisWeek}
      />

      <MealBoard options={view.slot} date={view.date} time={view.time} best={view.best} />

      <WeekHeatmap
        options={view.weekOpts}
        dates={view.dates}
        selected={{ date: view.date, time: view.time }}
        onSelect={(d, t) => {
          setWantedDate(d);
          setWantedTime(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <div className="grid-2 section-gap">
        <Ranking ranking={view.ranking} weekWord={weekWord} />
        <NutrientCompare ranking={view.ranking} weekWord={weekWord} />
      </div>

      <TrendChart data={trend} selectedWeek={week} />

      <Methodology baselines={ds.baselines} fallbackFactor={ds.fallbackFactor} />

      <footer className="footer">
        식단 출처: 밥먹어U (<a href="https://github.com/HeXA-UNIST/meal_client">HeXA-UNIST/meal_client</a>, 원 백엔드{' '}
        <a href={REPO_URL}>mad-unist/unist-meal-backend</a>) · 영양 성분은 메뉴명 기반 추정치입니다.
      </footer>
    </div>
  );
}
