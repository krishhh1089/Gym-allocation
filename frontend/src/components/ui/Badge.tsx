import React from 'react';

export type BadgeStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'ACTIVE'
  | 'WAITLISTED'
  | 'PENDING'
  | 'RECLAIMED'
  | 'CANCELLED'
  | 'NEUTRAL';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  size?: BadgeSize;
  dot?: boolean;
}

const statusConfig: Record<
  BadgeStatus,
  { bg: string; text: string; border: string; dotColor: string }
> = {
  PRESENT: {
    bg: 'var(--status-present-bg)',
    text: 'var(--status-present)',
    border: 'var(--status-present)',
    dotColor: 'var(--status-present)',
  },
  ACTIVE: {
    bg: 'var(--status-present-bg)',
    text: 'var(--status-present)',
    border: 'var(--status-present)',
    dotColor: 'var(--status-present)',
  },
  ABSENT: {
    bg: 'var(--status-absent-bg)',
    text: 'var(--status-absent)',
    border: 'var(--status-absent)',
    dotColor: 'var(--status-absent)',
  },
  CANCELLED: {
    bg: 'var(--status-absent-bg)',
    text: 'var(--status-absent)',
    border: 'var(--status-absent)',
    dotColor: 'var(--status-absent)',
  },
  LATE: {
    bg: 'var(--status-late-bg)',
    text: 'var(--status-late)',
    border: 'var(--status-late)',
    dotColor: 'var(--status-late)',
  },
  WAITLISTED: {
    bg: 'var(--status-waitlist-bg)',
    text: 'var(--status-waitlist)',
    border: 'var(--status-waitlist)',
    dotColor: 'var(--status-waitlist)',
  },
  PENDING: {
    bg: 'var(--status-pending-bg)',
    text: 'var(--status-pending)',
    border: 'var(--status-pending)',
    dotColor: 'var(--status-pending)',
  },
  RECLAIMED: {
    bg: 'var(--status-reclaimed-bg)',
    text: 'var(--status-reclaimed)',
    border: 'var(--status-reclaimed)',
    dotColor: 'var(--status-reclaimed)',
  },
  NEUTRAL: {
    bg: 'var(--surface-tint)',
    text: 'var(--ink)',
    border: 'var(--border-color)',
    dotColor: 'var(--muted)',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  status = 'NEUTRAL',
  size = 'md',
  dot = true,
  children,
  className = '',
  style,
  ...props
}) => {
  const config = statusConfig[status] || statusConfig.NEUTRAL;

  const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: {
      padding: '0.15rem 0.45rem',
      fontSize: '0.7rem',
      letterSpacing: '0.06em',
      gap: '0.35rem',
    },
    md: {
      padding: '0.25rem 0.65rem',
      fontSize: '0.785rem',
      letterSpacing: '0.08em',
      gap: '0.45rem',
    },
  };

  return (
    <span
      data-ui="badge"
      data-status={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        borderRadius: '0px',
        backgroundColor: config.bg,
        color: config.text,
        border: `1.5px solid ${config.border}`,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...sizeStyles[size],
        ...style,
      }}
      className={`gym-badge ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: size === 'sm' ? '5px' : '7px',
            height: size === 'sm' ? '5px' : '7px',
            borderRadius: '50%',
            backgroundColor: config.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      <span>{children || status}</span>
    </span>
  );
};

Badge.displayName = 'Badge';
