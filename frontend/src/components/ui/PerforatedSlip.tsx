import React from 'react';

export interface PerforatedSlipProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  stub?: React.ReactNode;
  children: React.ReactNode;
  notchPosition?: 'top' | 'middle' | 'bottom';
  className?: string;
}

export const PerforatedSlip: React.FC<PerforatedSlipProps> = ({
  header,
  stub,
  children,
  notchPosition = 'bottom',
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      data-ui="perforated-slip"
      style={{
        backgroundColor: 'var(--card-paper, #e8e5e0)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        userSelect: 'none',
        ...style,
      }}
      className={`gym-perforated-slip ${className}`}
      {...props}
    >
      {/* Optional Pass Header / Watermark */}
      {header && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '2px solid var(--ink)',
            backgroundColor: 'var(--surface-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {header}
        </div>
      )}

      {/* Main Body */}
      <div
        style={{
          padding: '1.25rem',
          flex: 1,
        }}
      >
        {children}
      </div>

      {/* Perforation Line with Side Notches */}
      {stub && (
        <>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              margin: '0.25rem 0',
            }}
          >
            {/* Left Notch */}
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg)',
                borderRight: '2px solid var(--ink)',
                marginLeft: '-9px',
                zIndex: 2,
              }}
              aria-hidden="true"
            />

            {/* Perforation Dashed Line */}
            <div
              style={{
                flex: 1,
                borderBottom: '2px dashed rgba(28, 27, 26, 0.4)',
                height: '1px',
              }}
              aria-hidden="true"
            />

            {/* Right Notch */}
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg)',
                borderLeft: '2px solid var(--ink)',
                marginRight: '-9px',
                zIndex: 2,
              }}
              aria-hidden="true"
            />
          </div>

          {/* Tear-Off Stub */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--surface-tint)',
              fontSize: '0.85rem',
            }}
          >
            {stub}
          </div>
        </>
      )}
    </div>
  );
};

PerforatedSlip.displayName = 'PerforatedSlip';
