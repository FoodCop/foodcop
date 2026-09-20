'use client';

// Small hand-rolled SVG radar/pentagon chart - no charting library in this
// project (see Fingerprint's own inline-SVG approach in FoodDnaSection),
// and a fixed small axis count (5, for Flavor Balance) doesn't need one.
export type RadarAxis = {
  label: string;
  /** 0-1, already normalized. */
  value: number;
  color?: string;
};

const SIZE = 220;
const CENTER = SIZE / 2;
const MAX_RADIUS = 82;
const RINGS = [0.25, 0.5, 0.75, 1];

function pointFor(index: number, count: number, radiusFraction: number): { x: number; y: number } {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const r = MAX_RADIUS * radiusFraction;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

function polygonPoints(count: number, radiusFraction: number, values?: number[]): string {
  return Array.from({ length: count }, (_, i) => {
    const frac = values ? values[i] * radiusFraction : radiusFraction;
    const { x, y } = pointFor(i, count, frac);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export default function RadarChart({
  axes,
  animate = true,
  fillColor = '#F1C74D',
  ariaLabel = 'Flavor balance radar chart',
}: {
  axes: RadarAxis[];
  animate?: boolean;
  fillColor?: string;
  ariaLabel?: string;
}) {
  const count = axes.length;
  const values = axes.map((a) => Math.max(0, Math.min(1, a.value)));

  return (
    <div className="radar-chart">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="auto" role="img" aria-label={ariaLabel}>
        {RINGS.map((r) => (
          <polygon key={r} points={polygonPoints(count, r)} className="radar-chart__ring" />
        ))}
        {axes.map((_, i) => {
          const { x, y } = pointFor(i, count, 1);
          return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} className="radar-chart__spoke" />;
        })}
        <polygon
          points={polygonPoints(count, 1, animate ? values : values.map(() => 0))}
          className="radar-chart__fill"
          style={{ fill: `${fillColor}55`, stroke: fillColor }}
        />
        {axes.map((axis, i) => {
          const { x, y } = pointFor(i, count, animate ? values[i] : 0);
          return <circle key={i} cx={x} cy={y} r={3.5} className="radar-chart__dot" style={{ fill: fillColor }} />;
        })}
        {axes.map((axis, i) => {
          const { x, y } = pointFor(i, count, 1.28);
          return (
            <text
              key={axis.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-chart__label"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
