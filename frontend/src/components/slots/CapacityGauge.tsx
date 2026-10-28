import React from 'react';

export interface CapacityGaugeProps {
  allocated: number;
  total: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const CapacityGauge: React.FC<CapacityGaugeProps> = ({
  allocated,
  total,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((allocated / total) * 100)) : 0;
  const isFull = allocated >= total;
  const isNearFull = percentage >= 85 && !isFull;

  // Determine progress bar fill color
  const fillColor = isFull
    ? 'var(--danger)'
    : isNearFull
    ? 'var(--status-late)'
    : 'var(--accent)';

  const barHeight = size === 'sm' ? '6px' : '10px';

  return (
    <div
      data-ui="capacity-gauge"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
      className={className}
    >
      {showLabel && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: size === 'sm' ? '0.785rem' : '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--muted)',
          }}
        >
          <span>
            Occupancy:{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {allocated} / {total}
            </strong>
          </span>
          <span style={{ fontWeight: 600, color: fillColor }}>
            {isFull ? 'FULL (WAITLIST)' : `${percentage}% Filled`}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={allocated}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Slot occupancy capacity"
        style={{
          width: '100%',
          height: barHeight,
          backgroundColor: 'var(--surface-tint)',
          border: '1.5px solid var(--ink)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: fillColor,
            transition: 'width 0.3s var(--ease-out)',
          }}
        />
      </div>
    </div>
  );
};

CapacityGauge.displayName = 'CapacityGauge';
