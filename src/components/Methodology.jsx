import { TIME_ORDER, TIMES } from '../lib/menu.js';
import { MAX_FACTOR, REFERENCE_SHARE, RULES } from '../lib/nutrition.js';
import { FEATURES } from '../lib/scoring.js';
import { fmt0, fmt1 } from '../lib/format.js';

export default function Methodology({ baselines, fallbackFactor }) {
  return (
    <section className="panel method" id="method">
      <h2 style={{ color: 'var(--ink)' }}>분석 방법</h2>

      <h3>1. 식단 데이터</h3>
      <p>
        원 백엔드(<code>mad-unist/unist-meal-backend</code>, Django)는 식당이 올린 주간메뉴표 엑셀을 파싱해{' '}
        <code>/menu/v1/menus</code>로 제공했지만 Heroku 서버가 종료되었습니다. 현재 밥먹어U 앱(
        <code>HeXA-UNIST/meal_client</code>)이 쓰는 <code>https://meal.hexa.pro/v2/menu/&lt;주 시작일&gt;</code> API에서 기숙사·학생·교직원
        식당의 아침/점심/저녁 식단을 받습니다. 샐러드바(SALAD)는 선택 사항이라 공식 앱과 같이 제외하고, 공휴일 안내만 있는 끼니는
        건너뜁니다. GitHub Actions가 매일 스냅샷을 갱신하고, 페이지를 열면 이번 주 식단을 API에서 실시간으로 다시 받습니다.
      </p>

      <h3>2. 탄수화물·단백질·지방·당류 추정</h3>
      <ul>
        <li>
          메뉴명마다 조리법·주재료 규칙({RULES.length}개, 예: <code>…돈까스</code>, <code>…찌개</code>, <code>…나물/무침</code>,{' '}
          <code>…아이스티</code>)을 적용해 단체급식 1인분 기준 영양값을 붙입니다. 값은 식품의약품안전처 식품영양성분 DB의 대표 음식값을
          급식 배식량에 맞춘 근삿값입니다.
        </li>
        <li>
          <code>큰그릇)</code>·<code>미니</code> 같은 표기는 양으로, <code>*케찹</code>·<code>&amp;타르S</code>는 소스로, <code>2EA</code>는 개수로
          반영합니다. 밥이 함께 나오는 식단의 면·일품 요리는 반찬 크기(0.5인분)로 봅니다.
        </li>
        <li>
          <b>칼로리 보정</b>: 메뉴별 추정 합계(4·탄수 + 4·단백질 + 9·지방)를 식당이 공시한 칼로리에 맞춰 같은 비율로 늘이거나 줄입니다. 즉
          총 에너지는 공시값, 영양소 구성비는 메뉴 구성에서 나옵니다. 공시 칼로리가 없는 끼니(간편식 등)는 전체 보정계수 중앙값(×
          {fallbackFactor.toFixed(2)})을 씁니다.
        </li>
        <li>
          일품 메뉴처럼 이름 한 줄에 밥·반찬이 생략된 경우 보정계수는 ×{MAX_FACTOR}까지만 키우고, 남는 에너지는 단체급식 평균
          구성비(탄수 {Math.round(REFERENCE_SHARE.carb * 100)}% · 단백질 {Math.round(REFERENCE_SHARE.protein * 100)}% · 지방 {Math.round(REFERENCE_SHARE.fat * 100)}% · 당류{' '}
          {Math.round(REFERENCE_SHARE.sugar * 100)}%)로 채웁니다.
        </li>
      </ul>

      <h3>3. 다이어트 적합도 점수 (0–10, 평균 5)</h3>
      <ul>
        <li>
          지표:{' '}
          {FEATURES.map((f, i) => (
            <span key={f.key}>
              {i > 0 && ' · '}
              {f.label} {f.dir < 0 ? '↓' : '↑'} (가중치 {f.weight})
            </span>
          ))}
          . 칼로리는 낮을수록, 단백질 에너지비는 높을수록, 당류·지방 에너지비는 낮을수록 좋게 봅니다.
        </li>
        <li>
          각 지표를 <b>이전 식단(기준 기간)의 같은 식사시간 분포</b>로 z-점수화해 가중합한 뒤, 그 원점수를 다시 기준 기간 분포로 표준화해{' '}
          <code>점수 = 5 + 2 × z</code>로 옮깁니다. 기준 기간의 평균 식단이 5.0점, 표준편차가 2점이며 0–10으로 자르고 소수점 한 자리로
          반올림합니다.
        </li>
        <li>
          기준 기간:{' '}
          {TIME_ORDER.filter((t) => baselines[t]).map((t, i) => (
            <span key={t}>
              {i > 0 && ' · '}
              {TIMES[t].ko} {baselines[t].from}~{baselines[t].to} ({fmt0(baselines[t].n)}끼
              {baselines[t].usedFallback ? ', 데이터 부족으로 전체 기간 사용' : ''}, 평균 {fmt0(baselines[t].features.kcal.mean)}kcal · 단백질{' '}
              {fmt1(baselines[t].features.protein.mean)}%)
            </span>
          ))}
          . 이번 주 이전에 제공된 모든 식단이며, 데이터가 쌓일수록 늘어납니다.
        </li>
      </ul>

      <h3>한계</h3>
      <p>
        메뉴명만으로 만든 추정치이므로 실제 레시피·배식량과 차이가 있습니다. 점수는 UNIST 식당끼리의 상대 비교용이며 의학적 영양 평가가
        아닙니다. 개인별 적정 섭취량은 성별·체중·활동량에 따라 다릅니다.
      </p>
    </section>
  );
}
