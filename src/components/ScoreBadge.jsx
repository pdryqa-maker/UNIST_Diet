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

export function CafName({ cafeteria, label }) {
  return (
    <span className="caf-name">
      <span className="swatch" style={{ background: `var(--caf-${cafeteria})` }} aria-hidden="true" />
      {label}
    </span>
  );
}
