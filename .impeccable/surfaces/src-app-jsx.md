---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# 대시보드 (src/App.jsx)

## Scope

단일 페이지 대시보드 전체. Visitor mode: Operate. 리디자인(기존 다크 대시보드 시각 세계 교체), 코드 주도(code-led) 빌드.

## Audience and job

다이어트 중인 UNIST 구성원이 식사 직전에 "지금 어느 식당에서 먹을지"를 고른다. 결정에 쓰는 정보는 점수, 메뉴, 영양 수치이며 셋을 한 번에 본다. 휴대폰과 데스크톱 동등.

피해야 할 인상(사용자 확인): 무거운 분석 툴, 가볍고 장난스러움, 흔한 다크 대시보드.

## Direction contract

THESIS: 한 끼는 그 시간 식단들의 한 판이다. 점수가 어떻게 났는지(기준 5.0에 칼로리·단백질·당류·지방 가감점)를 라인스코어 한 줄로 읽고, 합계가 오른쪽 끝의 큰 숫자로 끝난다. 거부하는 기본형: KPI 타일과 식당별 카드 그리드로 짠 대시보드.

OWN-WORLD: 스포츠 지면의 박스스코어와 순위표. 차가운 종이색 바탕 #EEF0F4, 잉크 #0F1320, 코발트 셸 띠 #1D3BD1. 형광펜 노랑 #FFE04A는 "지금 보고 있는 것"(선택한 요일·끼니·행·주간표 칸) 전용. 가감점은 초록/빨강에 +/− 기호를 함께 쓴다. 숫자는 굵은 콘덴스드(Barlow Condensed), 한글은 고딕(Pretendard). 카드·그림자·둥근 상자 없이 3px 잉크 괘선과 1px 행 괘선으로만 구획한다.

STORY: 열면 이 끼니의 식단이 점수순으로 서 있고 1위 행이 펼쳐져 메뉴별 추정 영양까지 보인다. 한 줄에서 점수·메뉴·수치를 비교해 갈 식당을 정한다. 더 궁금하면 아래 주간 점수표, 순위표, 추이, 분석 방법으로 내려간다.

FIRST VIEWPORT: 상단 고정 파란 띠에 워드마크, 주 이동, 요일 7칸, 끼니 3칸, 데이터 상태. 그 아래 "M월 D일 X요일 끼니" 제목과 "식단 n개 · 점수 높은 순". 본문은 폭을 지키는 기록표: 식당·식단 | 메뉴 | kcal | 탄·단·지·당 g | 기준·칼로리·단백질·당류·지방 | 점수(약 92px). 1위 행은 선택 상태(흰 바탕, 점수 칸 노랑)로 메뉴별 추정표가 펼쳐져 있다. 데스크톱 오른쪽 280px 주석 여백에 점수 읽는 법, 이번 주 요약, 추정치 고지. 좁은 화면에서는 행이 여러 줄로 접히되 점수가 행 오른쪽 위에서 가장 크다. 주 동작은 행을 눌러 펼치기.

SIGNATURE INTERACTION: 라인스코어 행 펼치기. 행을 누르면 그 식단의 메뉴별 기록이 아래로 펼쳐지고 노란 선택 표시가 그 행으로 옮겨간다. 모션은 한 축(세로 펼침과 선택 색 전환), 180ms 안팎의 ease-out, reduced-motion에서는 즉시.

FORM: 스포츠 지면 박스스코어/순위표. 근거 후보 7개 중 4번째. seed:b3d4e2828ebb7aaa

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Raised lines (declined challengers' disciplines)

- 점수 숫자는 크기 대비만으로 위계를 세운다(상자 없음).
- 같은 라벨을 두 번 쓰지 않는다. 넓은 화면에서 영양소 이름은 열 머리에 한 번만.
- 노랑은 "지금 보고 있는 것"에만 쓴다.
- 표는 고정 폭을 지키고 남는 너비는 주석 여백이 된다.

## Critique reference

`.impeccable/mocks/decision/assigned.html` (사용자가 고른 첫 화면 스케치, 1440×900).

## Unresolved

- 점수 구간 라벨(매우 적합~부적합) 표기 방식은 빌드에서 정한다.
