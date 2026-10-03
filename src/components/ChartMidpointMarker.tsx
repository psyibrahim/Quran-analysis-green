import React from 'react';
import { ReferenceLine } from 'recharts';

interface ChartMidpointMarkerProps {
  y: number;
  label?: string;
  showLine?: boolean;
}

/**
 * Midpoint marker for Cartesian charts (Recharts)
 * Draws a subtle dashed horizontal guideline and renders a distinct small red dot
 * directly on the Y-axis column at the 50% midpoint with a "50%" badge.
 */
export const ChartMidpointMarker: React.FC<ChartMidpointMarkerProps> = ({
  y,
  label = '50%',
  showLine = true
}) => {
  if (y === undefined || y === null || isNaN(y)) return null;

  return (
    <ReferenceLine
      y={y}
      stroke={showLine ? '#ef4444' : 'transparent'}
      strokeDasharray="3 3"
      strokeWidth={1.2}
      strokeOpacity={0.65}
      ifOverflow="extendDomain"
      label={(props: any) => {
        const { viewBox } = props;
        if (!viewBox) return null;
        const cx = viewBox.x ?? viewBox.x1 ?? 0;
        const cy = viewBox.y ?? viewBox.y1 ?? 0;
        const hasSpaceOnLeft = cx >= 22;

        return (
          <g className="recharts-y-midpoint-marker pointer-events-none">
            {/* Glowing subtle ring */}
            <circle
              cx={cx}
              cy={cy}
              r={6.5}
              fill="none"
              stroke="#ef4444"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
            {/* Small red dot on the Y-axis column */}
            <circle
              cx={cx}
              cy={cy}
              r={3.5}
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            {/* 50% label badge */}
            <text
              x={hasSpaceOnLeft ? cx - 6 : cx + 8}
              y={cy + 3.5}
              textAnchor={hasSpaceOnLeft ? 'end' : 'start'}
              fill="#ef4444"
              fontSize={9}
              fontWeight="bold"
              fontFamily="IBM Plex Mono, ui-monospace, monospace"
            >
              {label}
            </text>
          </g>
        );
      }}
    />
  );
};
