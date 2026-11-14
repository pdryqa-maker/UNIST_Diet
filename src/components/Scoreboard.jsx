import { useState } from 'react';
import { CAFETERIAS, TIMES } from '../lib/menu.js';
import { CATEGORY_KO } from '../lib/nutrition.js';
import { FEATURES, scoreBand } from '../lib/scoring.js';
import { dateLong, fmt0, fmt1, signed1, signOf } from '../lib/format.js';
import { MACROS } from '../lib/macros.js';
import MixBar from './MixBar.jsx';

// 라인스코어 열 머리. scoring.js의 지표 이름에서 '비율'을 뗀 짧은 이름.
const FACTOR_SHORT = { kcal: '칼로리', protein: '단백질', sugar: '당류', fat: '지방' };

function Caret() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.5 5.5 8 11l5.5-5.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Lineup({ o }) {
  return (
    <div className="lineup">
      <div className="lineup-in">
        <div className="lineup-body">
          <div className="mix-row">
            <MixBar pct={o.energyPct} />
            <p className="mix-legend">
              {MACROS.map((m) => (
                <span key={m.key}>
                  <span className="key" style={{ background: `var(--m-${m.key})` }} aria-hidden="true" />
                  {m.ko} {fmt0(o.energyPct[m.key])}%
                </span>
              ))}
              <span>에너지 기준</span>
            </p>
          </div>
          <table className="lines">
            <thead>
              <tr>
                <th scope="col">메뉴별 추정 · 분류 규칙</th>
                <th scope="col">kcal</th>
                <th scope="col">탄수화물</th>
                <th scope="col">단백질</th>
                <th scope="col">지방</th>
                <th scope="col">당류</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((i, idx) => {
                const rule = `${CATEGORY_KO[i.cat] ?? i.cat} · ${i.parts.length ? i.parts.map((p) => p.rule).join(' + ') : i.rule}`;
                return (
                  <tr key={idx} className={i.implied ? 'implied' : undefined}>
                    <td>
                      <div className="item">
                        <span className="name">{i.name}</span>
                        <span className="rule" title={rule}>
                          {rule}
                        </span>
                      </div>
                    </td>
                    <td>{fmt0(i.kcal)}</td>
                    <td>{fmt1(i.carb)}</td>
                    <td>{fmt1(i.protein)}</td>
                    <td>{fmt1(i.fat)}</td>
                    <td>{fmt1(i.sugar)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="calib">
            {o.kcalSource === 'official'
              ? `메뉴 추정 합계 ${fmt0(o.estKcal)}kcal을 식당 공시 ${fmt0(o.officialKcal)}kcal에 맞춰 ×${o.factor.toFixed(2)} 보정한 값입니다.`
              : `공시 칼로리가 없어 전체 보정계수 중앙값 ×${o.factor.toFixed(2)}를 적용한 값입니다.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ o, rank, isBest, open, onToggle, lineupId }) {
  const caf = CAFETERIAS[o.cafeteria];
  const n = o.nutrients;
  const band = scoreBand(o.score);
  const scoreText = fmt1(o.score);
  return (
    <>
      <tr role="row" className={`row${open ? ' is-open' : ''}`} onClick={onToggle}>
        <td role="cell" className="c-who">
          <div className="who">
            <span className="rank">
              {rank}
              <span className="sr-only">위</span>
            </span>
            <button type="button" className="who-btn" aria-expanded={open} aria-controls={lineupId}>
              {caf.ko}
              <Caret />
            </button>
            <div className="who-meta">
              <span>
                {o.variant}
                {o.title ? ` · ${o.title}` : ''}
              </span>
              {isBest && <span className="pick">추천</span>}
            </div>
          </div>
        </td>
        <td role="cell" className="c-menu">
          {o.items
            .filter((i) => !i.implied)
            .map((i) => i.name)
            .join(' · ')}
        </td>
        <td role="cell" className="c-kcal" data-label="kcal">
          <span className="v">{fmt0(n.kcal)}</span>
          {o.kcalSource !== 'official' && <span className="est">추정</span>}
        </td>
        {MACROS.map((m) => (
          <td role="cell" key={m.key} className="c-g" data-label={m.short}>
            <span className="v">{fmt0(n[m.key])}</span>
          </td>
        ))}
        <td role="cell" className="c-g" data-label="당">
          <span className="v">{fmt0(n.sugar)}</span>
        </td>
        <td role="cell" className="c-ls c-base" data-label="기준">
          <span className="v">5.0</span>
        </td>
        {FEATURES.map((f) => {
          const c = o.contributions[f.key];
          return (
            <td role="cell" key={f.key} className={`c-ls is-${signOf(c)}`} data-label={FACTOR_SHORT[f.key]}>
              <span className="v">{signed1(c)}</span>
            </td>
          );
        })}
        <td role="cell" className="c-total" title={`${scoreText}점 · ${band.ko}`}>
          <span className={`score${scoreText.length > 3 ? ' is-wide' : ''}`}>{scoreText}</span>
          <span className="sr-only">점, {band.ko}</span>
        </td>
      </tr>
      {open && (
        <tr role="row" className="lineup-row" id={lineupId}>
          <td role="cell" colSpan={13}>
            <Lineup o={o} />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * 한 끼의 기록표. 식단마다 한 행이고, 기준 5.0에 지표별 가감점이 더해져 오른쪽 끝 점수가 된다.
 * 행을 누르면 메뉴별 추정 기록이 펼쳐진다. 태블릿 폭 이상에서는 처음에 1위 행이 펼쳐져 있고,
 * 펼친 기록이 화면 한 장을 넘는 휴대폰 폭에서는 식단끼리의 비교가 먼저 보이도록 모두 접어 둔다.
 * (부모가 key로 날짜·끼니를 넘겨, 끼니가 바뀌면 펼침 상태가 초기화된다.)
 */
const WIDE = '(min-width: 720px)';

export default function Scoreboard({ options, date, time, best }) {
  const [openId, setOpenId] = useState(() => (window.matchMedia(WIDE).matches ? (best?.id ?? null) : null));
  const hasChoice = options.length > 1;

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-head">
        <h1 id="board-title">
          {date ? dateLong(date) : ''} {TIMES[time]?.ko}
        </h1>
        {options.length > 0 && (
          <p>
            식단 {options.length}개{hasChoice ? ' · 점수 높은 순' : ''}
          </p>
        )}
        <p className="board-note">영양은 메뉴명 기반 추정치 · UNIST 비공식 서비스</p>
      </div>

      {options.length ? (
        <table className="box" role="table">
          <colgroup>
            <col className="w-who" />
            <col />
            <col className="w-kcal" />
            <col className="w-g" span={4} />
            <col className="w-ls" span={5} />
            <col className="w-total" />
          </colgroup>
          <thead role="rowgroup">
            <tr role="row" className="groups">
              <td role="presentation" colSpan={3} />
              <th role="columnheader" colSpan={4} scope="colgroup">
                <span className="g-label">추정 영양 g</span>
              </th>
              <th role="columnheader" colSpan={5} scope="colgroup">
                <span className="g-label">평균 대비 가감점</span>
              </th>
              <td role="presentation" />
            </tr>
            <tr role="row">
              <th role="columnheader" scope="col" className="h-who">
                식당 · 식단
              </th>
              <th role="columnheader" scope="col" className="h-menu">
                메뉴
              </th>
              <th role="columnheader" scope="col" className="h-n">
                kcal
              </th>
              {MACROS.map((m) => (
                <th role="columnheader" scope="col" key={m.key} className="h-n">
                  <abbr title={m.ko}>{m.short}</abbr>
                </th>
              ))}
              <th role="columnheader" scope="col" className="h-n">
                <abbr title="당류">당</abbr>
              </th>
              <th role="columnheader" scope="col" className="h-ls">
                기준
              </th>
              {FEATURES.map((f) => (
                <th role="columnheader" scope="col" key={f.key} className="h-ls">
                  {FACTOR_SHORT[f.key]}
                </th>
              ))}
              <th role="columnheader" scope="col" className="h-total">
                점수
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {options.map((o, i) => (
              <Row
                key={o.id}
                o={o}
                rank={i + 1}
                isBest={hasChoice && best?.id === o.id}
                open={openId === o.id}
                onToggle={() => setOpenId((cur) => (cur === o.id ? null : o.id))}
                lineupId={`lineup-${i}`}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">
          <b>이 끼니에는 운영하는 식당이 없습니다.</b>
          위에서 다른 요일이나 끼니를 골라 보세요.
        </p>
      )}
    </section>
  );
}
