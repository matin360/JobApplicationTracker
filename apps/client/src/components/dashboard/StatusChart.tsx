import { useState } from 'react';
import { APPLICATION_STATUSES } from '../../applications';
import type { ApplicationStatus } from '../../applications';

interface StatusChartProps {
  statusCounts: Record<ApplicationStatus, number>;
}

// Layout constants for the horizontal bar chart.
const BAR_HEIGHT = 20;
const ROW_GAP = 12;
const LABEL_WIDTH = 96;
const VALUE_GAP = 8;
const CHART_WIDTH = 520;
const BAR_COLOR = '#3b6bb0';
const BAR_COLOR_HOVER = '#2d5590';

// Right-rounded bar path: square at the baseline (left), 4px rounded data-end (right).
function barPath(x: number, y: number, width: number, height: number): string {
  const radius = Math.min(4, width);
  return [
    `M ${x} ${y}`,
    `h ${Math.max(0, width - radius)}`,
    `a ${radius} ${radius} 0 0 1 ${radius} ${radius}`,
    `v ${height - radius * 2}`,
    `a ${radius} ${radius} 0 0 1 ${-radius} ${radius}`,
    `h ${-Math.max(0, width - radius)}`,
    'Z'
  ].join(' ');
}

// Single-series horizontal bar chart of application counts by status.
// One hue (magnitude, not identity), values labeled at every bar tip, no legend.
const StatusChart = ({ statusCounts }: StatusChartProps) => {
  const [hovered, setHovered] = useState<ApplicationStatus | null>(null);

  const max = Math.max(...APPLICATION_STATUSES.map((status) => statusCounts[status] ?? 0));
  const height = APPLICATION_STATUSES.length * (BAR_HEIGHT + ROW_GAP) - ROW_GAP;
  const plotWidth = CHART_WIDTH - LABEL_WIDTH - 40;

  if (max === 0) {
    return <p className="page-subtitle">No applications yet — the chart will fill in as you add them.</p>;
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${height}`}
      role="img"
      aria-label="Applications by status"
      style={{ width: '100%', height: 'auto' }}
    >
      {APPLICATION_STATUSES.map((status, index) => {
        const count = statusCounts[status] ?? 0;
        const y = index * (BAR_HEIGHT + ROW_GAP);
        const width = max > 0 ? (count / max) * plotWidth : 0;

        return (
          <g
            key={status}
            onMouseEnter={() => setHovered(status)}
            onMouseLeave={() => setHovered(null)}
          >
            <text
              x={LABEL_WIDTH - 10}
              y={y + BAR_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="central"
              style={{ fontSize: '12px', fill: '#45506b' }}
            >
              {status}
            </text>
            {count > 0 ? (
              <path
                d={barPath(LABEL_WIDTH, y, Math.max(width, 4), BAR_HEIGHT)}
                fill={hovered === status ? BAR_COLOR_HOVER : BAR_COLOR}
              />
            ) : (
              <line
                x1={LABEL_WIDTH}
                y1={y + BAR_HEIGHT / 2}
                x2={LABEL_WIDTH + 2}
                y2={y + BAR_HEIGHT / 2}
                stroke="#ccd4e0"
                strokeWidth={BAR_HEIGHT}
              />
            )}
            <text
              x={LABEL_WIDTH + Math.max(width, 4) + VALUE_GAP}
              y={y + BAR_HEIGHT / 2}
              dominantBaseline="central"
              style={{ fontSize: '12px', fontWeight: 600, fill: '#172033' }}
            >
              {count}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default StatusChart;
