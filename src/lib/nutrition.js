// 메뉴명 → 탄수화물/단백질/지방/당류 추정기
//
// 밥먹어U는 식단별 총 칼로리만 제공한다. 그래서
//   1) 메뉴명 하나하나를 조리법·주재료 규칙(RULES)에 매칭해 단체급식 1인분 기준 C/P/F/당류(g)를 추정하고,
//   2) 같은 식단의 추정 합계 kcal(=4C+4P+9F)이 공식 칼로리와 같아지도록 전체를 같은 비율로 보정한다.
// 즉 "총 에너지"는 식당이 공시한 값을, "영양소 비율"은 메뉴 구성으로 추정한 값을 쓴다.
//
// 1인분 값은 식품의약품안전처 식품영양성분DB의 대표 음식값을 단체급식 배식량(밥 210g, 국 250ml,
// 주찬 100g 안팎, 부찬 50~70g)에 맞춰 반올림한 근삿값이다. 실측치가 아닌 추정치다.

// n = [탄수화물, 단백질, 지방, 당류] (g / 1인분). 당류는 탄수화물에 포함된다.
const r = (label, cat, re, n, opts = {}) => ({ label, cat, re, n, ...opts });

// 순서가 곧 우선순위다. 위에서부터 처음 맞는 규칙 하나만 쓴다.
export const RULES = [
  // ── 추가밥: 공시 칼로리에 포함되어 있다 (면 요리 221끼 비교 — 추가밥이 붙은 104끼는 공시값이
  //    메뉴 추정보다 밥 한 공기만큼(+262kcal) 높고, 밥을 더하면 차이가 −14kcal로 사라진다).
  //    면·일품 요리는 그대로 한 그릇으로 보고 밥만 더한다 (isRice가 '추가'로 시작하는 밥을 제외).
  r('추가 밥', 'grain', /^추가.*밥/, [68, 6, 1, 0]),

  // ── 음료·디저트 (다른 규칙의 키워드와 겹치는 경우가 많아 먼저 본다)
  r('아이스크림·푸딩·젤리', 'dessert', /아이스크림|아이스바|콘아이스|푸딩|젤리|빙수|셔벗|샤베트/, [18, 2, 4, 15]),
  r('무가당 차', 'drink', /(옥수수|보리|둥굴레|결명자|녹|현미|헛개|우엉|페퍼민트|루이보스|캐모마일|자스민|메밀|홍)차$|냉녹차|생수|아메리카노|에스프레소|페퍼민트/, [0, 0, 0, 0]),
  r('단백질 음료', 'drink', /(단백질|프로틴)\s*(드링크|음료|쉐이크|우유)/, [10, 12, 2, 8]),
  r('가공유', 'drink', /(초코|딸기|바나나|커피|모카|메론|멜론)우유|코코아|핫초코|라떼/, [26, 6, 6, 22]),
  r('우유·두유', 'drink', /우유|두유/, [10, 6, 6, 9]),
  r('아이스티·가당 음료', 'drink', /아이스티|아이스[^크바]|에이드|후르츠티|매실|매샷|오미자|복분자|석류|유자차|레몬차|모과차|레모네이드|쿨피스|쥬시쿨|탄산|사이다|콜라|슬러시|스무디|음료/, [19, 0, 0, 18]),
  r('미숫가루', 'drink', /미숫가루/, [20, 4, 2, 12]),
  r('무가당 차(기타)', 'drink', /차$|캐모마일|히비스커스/, [0, 0, 0, 0]),
  r('주스', 'drink', /주스|쥬스/, [22, 0.5, 0, 20]),
  r('식혜·수정과·화채', 'drink', /식혜|식헤|수정과|화채/, [26, 1, 0, 22]),
  r('떠먹는 요거트', 'dessert', /바이오|요거트|요플레|그릭|떠먹는/, [16, 4, 3, 13]),
  r('요구르트(병)', 'drink', /요구르트|야쿠르트|요쿠르트/, [12, 1, 0.1, 11], { unit: true }),
  r('맛탕', 'dessert', /맛탕/, [36, 1.5, 6, 15]),
  r('츄러스', 'dessert', /츄러스|츄로스/, [26, 2, 10, 9]),
  r('호떡', 'dessert', /호떡/, [30, 3, 7, 12]),
  r('약과·한과', 'dessert', /약과|한과|유과|양갱/, [30, 1, 6, 15]),
  r('빵·베이커리', 'dessert', /빵|소보로|소보루|카스텔라|카스테라|케이크|케익|머핀|쿠키|도넛|도너츠|와플|크로와상|크루아상|패스츄리|페스츄리|파이$|브라우니|마카롱|스콘|베이글|토스트|샌드위치|모닝롤/, [40, 6, 9, 15]),
  r('에너지바·시리얼', 'dessert', /에너지바|[시씨]리얼바|[시씨]리얼$|그래놀라바|프로틴바|단백질바|초코바|오란다/, [22, 3, 6, 10]),
  r('떡', 'dessert', /송편|인절미|백설기|꿀떡|절편|시루떡|가래떡$/, [30, 2, 0.5, 6]),
  r('초콜릿', 'dessert', /초콜릿|초콜렛|초코렛/, [15, 2, 9, 13]),
  r('쌀과자·스낵', 'dessert', /과자|스낵|팝콘|뻥튀기|크래커|누룽지칩|크리스피/, [18, 1, 3, 4]),
  r('견과류', 'dessert', /^(?!.*(멸치|조림|볶음)).*(견과|호두|땅콩|캐슈|아몬드)/, [6, 5, 12, 2]),
  // 과일은 이름이 과일로 시작하는 단품만 (감자'두부'의 자두, 후르츠'샐러드' 같은 오매칭 방지)
  r('과일', 'fruit', /^(?!.*(샐러드|무침|조림|볶음|찌개|짜글이|국$|탕$))(컵|생|제철|한입|냉동)?(사과|바나나|감귤|귤|리치|블루베리|용과|오렌지|수박|키위|포도|청포도|딸기|참외|파인애플|망고|복숭아|자몽|방울토마토|멜론|과일|후르츠|천혜향|한라봉|자두|체리)/, [15, 0.5, 0.2, 12]),

  // ── 한 그릇 요리 (밥이 함께 나오면 반찬 크기로 본다: bowl)
  r('짜장면', 'bowl', /짜장면|짜계치|짜파/, [92, 18, 16, 10], { bowl: true }),
  r('짬뽕', 'bowl', /짬뽕(?!.*국)/, [75, 20, 12, 4], { bowl: true }),
  r('라면·라볶이', 'bowl', /라면|라멘|라볶이/, [62, 10, 15, 4], { bowl: true }),
  r('크림 파스타', 'bowl', /크림.*(파스타|스파게티)|까르보/, [62, 15, 24, 5], { bowl: true }),
  r('샐러드 파스타', 'side', /(샐러드|냉).*(파스타|스파게티)|(파스타|스파게티).*샐러드/, [28, 6, 8, 5]),
  r('스파게티·파스타', 'bowl', /파스타|스파게티|그라탕|라자냐|마카로니(?!.*샐러드)/, [68, 16, 12, 9], { bowl: true }),
  r('쌀국수', 'bowl', /쌀국수/, [60, 18, 6, 3], { bowl: true }),
  r('우동', 'bowl', /우동(?!.*국물)(?!.*샐러드)/, [70, 12, 7, 5], { bowl: true }),
  r('떡국·만둣국', 'bowl', /떡국|만둣국|만두국/, [70, 15, 10, 2], { bowl: true }),
  r('볶음밥·오므라이스', 'bowl', /볶음밥|필라프|오므라이스|리조또/, [80, 13, 15, 4], { bowl: true }),
  r('덮밥·비빔밥', 'bowl', /덮밥|비빔밥|컵반|라이스|(가츠|규|텐|사케|부타|오야코|에비)동$|돈부리|부리또|타코/, [88, 20, 14, 7], { bowl: true }),

  // ── 국·찌개·탕 (이름 끝으로 판단)
  r('스프', 'soup', /(스프|수프|차우더)$/, [14, 3, 7, 4]),
  r('부대찌개', 'soup', /부대찌개|햄.*찌개/, [12, 12, 14, 3]),
  r('찌개', 'soup', /(찌개|전골|짜글이)$/, [8, 10, 8, 2]),
  r('탕·해장국', 'soup', /(탕|해장국|곰탕|설렁탕|육개장|닭개장|파개장|국밥)$/, [8, 16, 10, 2]),
  r('고기 국', 'soup', /(소고기|쇠고기|돼지|닭|돈육|사골|갈비|차돌|우삼겹|오리).*(국|국물)$/, [5, 8, 5, 1]),
  r('국', 'soup', /(국|국물)$/, [5, 4, 2, 1]),

  // ── 밥·면 (단품)
  r('버거·또띠아', 'bowl', /버거|또띠아|토르티야|퀘사디아|피자|핫도그|콘도그/, [40, 12, 14, 6]),
  r('김밥·주먹밥', 'grain', /김밥|주먹밥|유부초밥/, [38, 5, 4, 2]),
  r('죽', 'grain', /죽$/, [35, 5, 3, 1]),
  r('밥', 'grain', /밥$/, [68, 6, 1, 0]),
  r('면사리·당면', 'side', /사리$|당면$|우동면$/, [20, 0.5, 0.2, 0.5]),
  r('면 요리', 'bowl', /냉면|막국수|소바|모밀|국수|쫄면|비빔면|칼국수|수제비|소면|\S면$|냉$/, [72, 12, 6, 9], { bowl: true }),
  r('떡볶이·떡강정', 'side', /떡볶이|떡강정|소떡/, [42, 5, 6, 13]),

  // ── 튀김
  r('계란후라이', 'side', /(계란|달걀|에그)\s*(후라이|프라이)/, [0.5, 6, 7, 0], { unit: true }),
  r('두부 강정', 'side', /두부.*강정/, [16, 9, 11, 9]),
  r('돈까스', 'main', /돈까스|돈카츠|돈가스|등심까스|치즈까스|돈카츠/, [26, 22, 24, 4]),
  r('치킨까스', 'main', /치킨까스|치킨가스|치킨카츠/, [22, 20, 18, 2]),
  r('생선까스', 'main', /생선까스|생선가스|피쉬/, [20, 14, 16, 1]),
  r('새우까스·커틀렛', 'main', /새우까스|새우가스|커틀렛|커틀릿/, [22, 10, 16, 1]),
  r('새우튀김(개)', 'side', /새우튀김/, [9, 6, 6, 0.5], { unit: true }),
  r('달콤한 소스 튀김', 'main', /깐풍|탕수|강정|유린기|양념치킨|칠리새우|치킨볼|팝콘치킨/, [26, 16, 18, 14]),
  r('치킨·닭튀김', 'main', /치킨|닭튀김|후라이드|텐더|가라아게/, [14, 20, 18, 2]),
  r('너겟', 'side', /너겟/, [13, 9, 12, 1]),
  r('고로케', 'side', /고로케|크로켓|크로겟/, [22, 4, 12, 3]),
  r('만두·춘권·김말이', 'side', /만두|춘권|사모사|김말이|잡채말이|딤섬|교자/, [24, 5, 11, 2]),
  r('핫바·어묵튀김', 'side', /핫바|어묵튀김|어묵바|뿌링볼/, [15, 6, 8, 3]),
  r('튀김(기타)', 'side', /튀김|까스$|가스$|카츠$|해[쉬시]브라운/, [18, 5, 12, 1]),

  // ── 덮밥 소스 (카레·짜장·하이라이스)
  r('카레·짜장 소스', 'main', /카레|(?<!치)커리|짜장|하이스/, [18, 6, 6, 5]),

  // ── 샐러드
  r('마요 샐러드', 'side', /(마카로니|감자|콘|코울슬로|콜슬로|옥수수|사라다|에그|단호박|고구마|으깬).*샐러드|사라다|코울슬로|콜슬로/, [14, 2, 9, 5]),
  r('단백질 샐러드', 'side', /(닭|치킨|참치|햄|베이컨|맛살|크래미|연어|두부|리코타).*샐러드/, [6, 8, 6, 3]),
  r('채소 샐러드', 'veg', /샐러드/, [5, 1, 3, 3]),

  // ── 육류·수산·달걀·두부 주찬
  r('볶음고추장', 'sauce', /볶음고추장|약고추장/, [6, 2, 2, 4]),
  r('함박·떡갈비·미트볼', 'main', /함박|떡갈비|너비아니|미트볼|산적|동그랑땡|완자|스테이크|폭찹/, [12, 14, 15, 7]),
  r('잡채', 'side', /잡채(?!말이)/, [25, 4, 6, 4]),
  r('수육·보쌈', 'main', /수육|보쌈|편육/, [2, 20, 18, 0]),
  r('계란 장조림', 'side', /(계란|메추리알|달걀).*장조림/, [3, 6, 5, 3], { unit: true }),
  r('고기 장조림', 'side', /장조림/, [5, 14, 6, 5]),
  r('돼지고기 요리', 'main', /제육|두루치기|불백|돼지|돈육|동파육|돈장|주물럭|오삼|삼겹|목살|항정|갈비찜|등갈비|김치찜/, [10, 18, 16, 7]),
  r('소고기 요리', 'main', /소고기|쇠고기|불고기|우삼겹|차돌|소불|육전|갈비/, [8, 18, 13, 6]),
  r('오리 요리', 'main', /오리/, [5, 15, 18, 3]),
  r('닭고기 요리', 'main', /닭|계육/, [8, 20, 8, 5]),
  r('소시지·햄', 'side', /소시지|소세지|비엔나|후랑크|프랑크|스팸|햄|베이컨/, [6, 7, 14, 2]),
  r('순대', 'side', /순대/, [18, 6, 5, 1]),
  r('생선 조림·찜', 'main', /(고등어|삼치|임연수|가자미|꽁치|갈치|연어|조기|동태|명태|코다리|병어|메로|볼락|생선).*(조림|찜|강정)/, [6, 16, 6, 5]),
  r('생선구이', 'main', /고등어|삼치|임연수|가자미|꽁치|갈치|연어|조기|동태|명태|코다리|병어|메로|볼락|생선/, [1, 18, 10, 0]),
  r('참치 요리', 'side', /참치/, [5, 12, 6, 3]),
  r('오징어·해물 요리', 'main', /오징어|쭈꾸미|주꾸미|낙지|문어|해물|새우|홍합|바지락|꼬막|조개|관자/, [10, 14, 4, 6]),
  r('멸치·쥐어채 볶음', 'side', /멸치|쥐어채|진미채|명엽채|건새우|뱅어포/, [8, 6, 3, 5]),
  r('마파두부', 'main', /마파/, [8, 12, 12, 3]),
  r('두부 요리', 'side', /두부|유부/, [5, 9, 7, 3]),
  r('구운 달걀(개)', 'side', /구운란|맥반석/, [0.5, 6, 5, 0.2], { unit: true }),
  r('달걀 요리', 'side', /계란|달걀|에그|메추리알|스크램블|오믈렛/, [2, 8, 8, 1]),
  r('어묵 요리', 'side', /어묵|오뎅|맛살|크래미|가마보꼬/, [11, 5, 4, 4]),
  r('콩 요리', 'side', /콩(조림|자반)|검정콩|검은콩|병아리콩|강낭콩|콩비지|콩$/, [10, 6, 3, 6]),

  // ── 채소·기타 반찬
  r('전·부침·전병', 'side', /전병|부침|빈대떡|지짐|[^\s]전$/, [18, 5, 8, 2]),
  r('곤약', 'veg', /곤약/, [3, 0.3, 1.5, 2]),
  r('묵', 'veg', /묵/, [9, 1, 1, 1]),
  r('장아찌·피클·단무지', 'pickle', /피클|단무지|장아찌|절임|쌈무|오복|궁채|무말랭이|고추지|깻잎|지$|젓갈/, [4, 0.5, 0.3, 3]),
  r('김치·겉절이', 'kimchi', /김치|깍두기|석박지|섞박지|겉절이|얼절이|총각|동치미|나박/, [3, 1, 0.3, 1.5]),
  r('김·김자반', 'side', /김$|김구이|김자반|도시락김|파래김|김가루/, [1, 1, 1.5, 0]),
  r('감자·고구마·옥수수', 'side', /감자|고구마|옥수수|콘$|단호박|밤/, [18, 2, 4, 4]),
  r('나물·무침', 'veg', /나물|무침|생채|숙회|버무리|냉채|쌈$|숙주|시금치|콩나물|비빔야채/, [4, 1.5, 2, 1.5]),
  r('채소 볶음', 'veg', /볶음|소테/, [6, 2, 4, 2]),
  r('채소 조림', 'veg', /조림/, [11, 2, 1, 6]),
  r('채소 구이·찜', 'veg', /구이|찜/, [5, 2, 2, 1]),
  r('채소(생·데침)', 'veg', /브로콜리|[컬콜]리플라워|청경채|연근|파채|겨울초|양배추|양파|오이|당근|파프리카|채소|야채|상추|고추|피망|버섯|호박|가지|무$|쌈/, [4, 1.5, 0.3, 2]),
  r('미역·해초', 'veg', /미역|해초|다시마|꼬시래기|톳|파래|매생이/, [4, 1, 1, 2.5]),
];

// 메뉴 뒤에 *, & 로 붙는 소스·드레싱 (보조 구성에만 적용)
export const SAUCES = [
  r('케첩', 'sauce', /케찹|케첩/, [5, 0.2, 0, 4]),
  r('타르타르 소스', 'sauce', /타르/, [2, 0.2, 8, 1]),
  r('칠리 소스', 'sauce', /칠리/, [7, 0, 0, 6]),
  r('허니머스타드', 'sauce', /머스타드|머스터드/, [6, 0.3, 4, 5]),
  r('강정 소스', 'sauce', /강정/, [8, 0, 0, 7]),
  r('드레싱', 'sauce', /D$|드레싱|마요|케요|사우전|오리엔탈|발사믹/, [3, 0.2, 5, 3]),
  r('초장·초간장', 'sauce', /초장|초간장/, [4, 0.3, 0, 3]),
  r('쌈장·양념장·간장', 'sauce', /쌈장|양념장|간장|장$/, [2, 0.8, 0.5, 1.2]),
  r('김가루·깨', 'sauce', /김가루|깨$/, [0.5, 0.5, 0.8, 0]),
  r('잼', 'sauce', /잼$/, [10, 0, 0, 9]),
  r('소스', 'sauce', /소스|S$/, [5, 0.3, 1, 4]),
];

const UNKNOWN = r('기타 반찬(추정)', 'unknown', /.^/, [6, 3, 3, 2]);

export const CATEGORY_KO = {
  drink: '음료', dessert: '디저트', fruit: '과일', bowl: '일품', soup: '국·찌개',
  grain: '밥', side: '반찬', main: '주찬', veg: '채소', pickle: '절임', kimchi: '김치', sauce: '소스',
  unknown: '미분류', implied: '추정 보충',
};

export const kcalOf = ({ carb, protein, fat }) => 4 * carb + 4 * protein + 9 * fat;

const ZERO = { carb: 0, protein: 0, fat: 0, sugar: 0 };
const toNut = ([carb, protein, fat, sugar], k = 1) => ({ carb: carb * k, protein: protein * k, fat: fat * k, sugar: sugar * k });
const addNut = (a, b) => ({ carb: a.carb + b.carb, protein: a.protein + b.protein, fat: a.fat + b.fat, sugar: a.sugar + b.sugar });
const scaleNut = (a, k) => toNut([a.carb, a.protein, a.fat, a.sugar], k);

/**
 * 메뉴명 하나를 해석한다.
 *  - "큰그릇)", "한그릇)" 접두어 → 한 그릇 요리(주식) / "미니", "꼬마" → 0.5인분
 *  - "(소고기,당면,...)" 같은 괄호 설명 제거
 *  - "2EA" → 개수 (unit 규칙에만 곱함)
 *  - "감자고로케*케찹", "생선까스&타르S" → 본 메뉴 + 소스. "&"로 이어진 두 번째 요리는 0.6인분
 */
export function parseMenuName(raw) {
  let s = String(raw).trim();
  let portion = 1;
  let bowlPrefix = false;
  // OCR 데이터에는 '한그릇매콤파닭개장'처럼 괄호가 빠진 표기도 있다.
  const prefix = s.match(/^(큰그릇|한그릇)\)?\s*/) ?? s.match(/^(큰|미니|소)\)\s*/);
  if (prefix) {
    if (prefix[1] === '미니' || prefix[1] === '소') portion = 0.5;
    else {
      bowlPrefix = true;
      if (prefix[1].startsWith('큰')) portion = 1.2;
    }
    s = s.slice(prefix[0].length);
  }
  if (/^(미니|꼬마)/.test(s)) {
    portion *= 0.5;
    s = s.replace(/^(미니|꼬마)/, '');
  }
  s = s.replace(/\([^)]*\)?/g, '').trim();
  let count = null;
  const cm = s.match(/(\d+)\s*(EA|ea|개|P|pcs|입)/);
  if (cm) {
    count = Number(cm[1]);
    s = s.replace(cm[0], '').trim();
  }
  const parts = s.split(/[*&+]/).map((t) => t.trim()).filter(Boolean);
  return { main: parts[0] ?? s, extras: parts.slice(1), portion, bowlPrefix, count };
}

const matchRule = (rules, name) => rules.find((rule) => rule.re.test(name));

/**
 * 메뉴 하나의 영양 성분 추정.
 * ctx.hasRice: 같은 식단에 밥이 따로 있으면 면·일품 요리는 반찬 크기(0.5)로 본다.
 */
export function estimateItem(raw, ctx = {}) {
  const p = parseMenuName(raw);
  // '크림소스'처럼 소스만 단독으로 온 경우도 소스 규칙으로 본다.
  const rule = matchRule(RULES, p.main) ?? matchRule(SAUCES, p.main) ?? UNKNOWN;
  // '돈제한판(돈까스+제육우동)'처럼 이름만으론 모르겠지만 괄호 안이 구성 요리 목록이면 그걸로 추정
  const combo = String(raw).match(/\(([^)]*[+&][^)]*)\)/);
  if (rule === UNKNOWN && combo) return { ...estimateItem(combo[1], ctx), name: raw };
  let k = p.portion;
  if (rule.bowl && !p.bowlPrefix && ctx.hasRice) k *= 0.5;
  if (rule.unit && p.count) k *= p.count;
  let nut = toNut(rule.n, k);
  const parts = [{ name: p.main, rule: rule.label, cat: rule.cat }];

  for (const extra of p.extras) {
    const sauce = matchRule(SAUCES, extra);
    if (sauce) {
      nut = addNut(nut, toNut(sauce.n));
      parts.push({ name: extra, rule: sauce.label, cat: 'sauce' });
      continue;
    }
    const dish = matchRule(RULES, extra) ?? UNKNOWN;
    nut = addNut(nut, toNut(dish.n, 0.6));
    parts.push({ name: extra, rule: dish.label, cat: dish.cat });
  }

  return {
    name: raw,
    rule: rule.label,
    cat: rule.cat,
    matched: rule !== UNKNOWN,
    parts,
    ...nut,
    kcal: kcalOf(nut),
  };
}

// 메뉴명으로 설명되지 않는 에너지는 보정계수를 MAX_FACTOR까지만 키우고 나머지를 단체급식 평균 구성비로 배분한다.
// 예: 학생식당 일품 '숯불향닭다리구이' 한 줄에 공식 1,507kcal — 밥·반찬이 생략된 표기라 주메뉴를 8배로 늘리면 왜곡된다.
export const MAX_FACTOR = 1.6;
export const REFERENCE_SHARE = { carb: 0.55, protein: 0.16, fat: 0.29, sugar: 0.08 };
const residualNut = (kcal) => ({
  carb: (kcal * REFERENCE_SHARE.carb) / 4,
  protein: (kcal * REFERENCE_SHARE.protein) / 4,
  fat: (kcal * REFERENCE_SHARE.fat) / 9,
  sugar: (kcal * REFERENCE_SHARE.sugar) / 4,
});

const isRice = (name) => {
  const { main } = parseMenuName(name);
  return /밥$/.test(main) && !/^추가/.test(main) && !/볶음밥|비빔밥|덮밥|국밥|김밥|주먹밥|초밥/.test(main);
};

/**
 * 식단 옵션 하나를 분석한다.
 * calibration: 공식 칼로리가 없으면 다른 식단들의 보정계수 중앙값(fallbackFactor)을 쓴다.
 */
export function analyzeOption(opt, fallbackFactor = 1) {
  const hasRice = opt.items.some((i) => isRice(i.ko));
  const items = opt.items.map((i) => ({ ...estimateItem(i.ko, { hasRice }), en: i.en }));
  const raw = items.reduce(addNut, ZERO);
  const estKcal = kcalOf(raw);
  const rawFactor = opt.officialKcal && estKcal > 0 ? opt.officialKcal / estKcal : null;
  let factor = fallbackFactor;
  let residualKcal = 0;
  if (opt.officialKcal) {
    factor = rawFactor == null ? 0 : Math.min(rawFactor, MAX_FACTOR);
    residualKcal = Math.max(0, opt.officialKcal - estKcal * factor);
  }
  const total = addNut(scaleNut(raw, factor), residualNut(residualKcal));
  const kcal = opt.officialKcal ?? kcalOf(total);
  const scaledItems = items.map((i) => ({ ...i, ...scaleNut(i, factor), kcal: i.kcal * factor }));
  if (residualKcal > 1) {
    scaledItems.push({
      name: '표기되지 않은 구성 (밥·반찬 등)',
      rule: '단체급식 평균 구성비로 배분',
      cat: 'implied',
      matched: true,
      implied: true,
      parts: [],
      ...residualNut(residualKcal),
      kcal: residualKcal,
    });
  }
  return {
    ...opt,
    items: scaledItems,
    estKcal,
    factor,
    rawFactor,
    residualKcal,
    kcalSource: opt.officialKcal ? 'official' : 'estimated',
    coverage: items.length ? items.filter((i) => i.matched).length / items.length : 1,
    nutrients: { kcal, carb: total.carb, protein: total.protein, fat: total.fat, sugar: total.sugar },
    energyPct: {
      carb: kcal ? ((4 * total.carb) / kcal) * 100 : 0,
      protein: kcal ? ((4 * total.protein) / kcal) * 100 : 0,
      fat: kcal ? ((9 * total.fat) / kcal) * 100 : 0,
      sugar: kcal ? ((4 * total.sugar) / kcal) * 100 : 0,
    },
  };
}

const median = (xs) => {
  if (!xs.length) return 1;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** 전체 옵션 분석: 공식 kcal이 있는 식단에서 보정계수 중앙값을 구해 나머지에 적용 */
export function analyzeAll(options) {
  const first = options.map((o) => analyzeOption(o));
  const fallback = median(first.filter((o) => o.rawFactor != null).map((o) => o.rawFactor));
  return {
    fallbackFactor: fallback,
    options: first.map((o, i) => (o.kcalSource === 'official' ? o : analyzeOption(options[i], fallback))),
  };
}
