import { fmt1, scoreTone } from '../lib/format.js';
import { scoreBand } from '../lib/scoring.js';

export function ScoreBadge({ score, large = false }) {
  const band = scoreBand(score);
  return (
    <span
      className={`score tone-${scoreTone(score)}`}
      style={large ? { fontSize: '1.25rem' } : undefined}
      title={`다이어트 적합도 ${fmt1(score)}점 (기준 평균 5.0)`}
    >
      {fmt1(score)}
      <span className="band">
        {band.icon} {band.ko}
      </span>
    </span>
  );
}

// 식당은 색이 아니라 이름으로 구분한다 (초록·빨강은 점수 신호 전용).
export function CafName({ label }) {
  return <span className="caf-name">{label}</span>;
}
