import { MACROS } from '../lib/macros.js';
import { fmt0 } from '../lib/format.js';

/** 에너지 구성 막대 (탄수화물 · 단백질 · 지방) */
export default function MixBar({ pct }) {
  const label = `에너지 구성: ${MACROS.map((m) => `${m.ko} ${fmt0(pct[m.key])}%`).join(', ')}`;
  return (
    <div className="mix" role="img" aria-label={label}>
      {MACROS.map((m) => (
        <span key={m.key} className={m.key} style={{ flexGrow: Math.max(pct[m.key], 0.5), flexBasis: 0 }} />
      ))}
    </div>
  );
}
