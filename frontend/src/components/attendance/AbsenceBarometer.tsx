import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldX, Flame } from 'lucide-react';

export interface AbsenceBarometerProps {
  consecutiveAbsences: number;
  maxAllowed?: number;
  weeklyStreak?: string;
  onSimulateAbsences?: (count: number) => void;
  className?: string;
}

export const AbsenceBarometer: React.FC<AbsenceBarometerProps> = ({
  consecutiveAbsences,
  maxAllowed = 3,
  weeklyStreak = '4 of 5 sessions attended this week',
  onSimulateAbsences,
  className = '',
}) => {
  // Determine risk level based on university sports council policy:
  // 0 - 1: Good standing (green)
  // 2: Warning (amber)
  // 3: Critical alert (red striped, 1 away from automated slot reclamation)
  // >= 4: Terminated
  const isWarning = consecutiveAbsences === 2;
  const isCritical = consecutiveAbsences === 3;
  const isTerminated = consecutiveAbsences >= 4;

  const statusColor = isTerminated
    ? 'var(--danger)'
    : isCritical
    ? 'var(--danger)'
    : isWarning
    ? 'var(--status-late)'
    : 'var(--accent)';

  const statusBg = isTerminated
    ? 'var(--status-absent-bg)'
    : isCritical
    ? 'var(--status-absent-bg)'
    : isWarning
    ? 'var(--status-late-bg)'
    : 'var(--status-present-bg)';

  return (
    <div
      data-ui="absence-barometer"
      style={{
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
      className={className}
    >
      {/* Top Header & Streak */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
            }}
          >
            RETENTION POLICY MONITOR
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0.2rem 0 0 0',
            }}
          >
            Absence Risk Barometer
          </h3>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: 'var(--surface-tint)',
            border: '1.5px solid var(--ink)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <Flame size={16} color="var(--status-late)" />
          <span>Weekly Streak: {weeklyStreak}</span>
        </div>
      </div>

      {/* Meter Visual Blocks */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--muted)' }}>Consecutive Unexcused Absences:</span>
          <strong>{consecutiveAbsences} / {maxAllowed} Sessions</strong>
        </div>

        {/* 4 Segmented Risk Blocks */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {[1, 2, 3, 4].map((step) => {
            const isFilled = consecutiveAbsences >= step;
            let blockBg = 'var(--surface-tint)';
            let blockBorder = '1.5px solid var(--ink)';

            if (isFilled) {
              if (step <= 1) blockBg = 'var(--status-present)';
              else if (step === 2) blockBg = 'var(--status-late)';
              else if (step === 3) blockBg = 'var(--danger)';
              else blockBg = '#551111';
            }

            return (
              <div
                key={step}
                style={{
                  height: '14px',
                  backgroundColor: blockBg,
                  border: blockBorder,
                  transition: 'background-color 0.2s ease',
                }}
                title={`Absence Step ${step}`}
              />
            );
          })}
        </div>
      </div>

      {/* Dynamic Status Feedback Card */}
      <div
        style={{
          backgroundColor: statusBg,
          border: `2px solid ${statusColor}`,
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        {isTerminated ? (
          <ShieldX size={22} color={statusColor} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : isCritical ? (
          <ShieldAlert size={22} color={statusColor} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : isWarning ? (
          <AlertTriangle size={22} color={statusColor} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <CheckCircle2 size={22} color={statusColor} style={{ flexShrink: 0, marginTop: '2px' }} />
        )}

        <div>
          <strong style={{ fontSize: '0.95rem', color: statusColor, display: 'block', marginBottom: '0.2rem' }}>
            {isTerminated
              ? 'Allocation Forfeited: 4 Consecutive Absences Exceeded'
              : isCritical
              ? 'Critical Warning: 1 Absence Away from Automated Slot Reclamation'
              : isWarning
              ? 'Attendance Warning: 2 Consecutive Absences Recorded'
              : 'Attendance in Good Standing'}
          </strong>

          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: '1.45' }}>
            {isTerminated
              ? 'Your gym slot has been reclaimed and allocated to the next student in the FCFS waitlist. Please visit the Sports Department if you had a medical emergency.'
              : isCritical
              ? 'Under the 3-consecutive absence rule, if you miss your next scheduled workout without an approved leave of absence, your slot will be automatically surrendered.'
              : isWarning
              ? 'You have missed 2 consecutive workout sessions. Missing 1 more without an approved leave will trigger the critical slot forfeiture threshold.'
              : 'You have maintained consistent turnstile attendance with zero penalty warnings. Keep up your streak!'}
          </p>
        </div>
      </div>

      {/* Interactive Review Simulator Toolbar */}
      {onSimulateAbsences && (
        <div
          style={{
            borderTop: '1px dashed var(--border-color-faint)',
            paddingTop: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.785rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            Simulate Risk Level:
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={() => onSimulateAbsences(0)}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                border: '1px solid var(--ink)',
                backgroundColor: consecutiveAbsences === 0 ? 'var(--accent)' : 'var(--surface-tint)',
                color: consecutiveAbsences === 0 ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              0 (Good)
            </button>
            <button
              onClick={() => onSimulateAbsences(2)}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                border: '1px solid var(--ink)',
                backgroundColor: consecutiveAbsences === 2 ? 'var(--status-late)' : 'var(--surface-tint)',
                color: consecutiveAbsences === 2 ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              2 (Warning)
            </button>
            <button
              onClick={() => onSimulateAbsences(3)}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                border: '1px solid var(--ink)',
                backgroundColor: consecutiveAbsences === 3 ? 'var(--danger)' : 'var(--surface-tint)',
                color: consecutiveAbsences === 3 ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              3 (Critical)
            </button>
            <button
              onClick={() => onSimulateAbsences(4)}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                border: '1px solid var(--ink)',
                backgroundColor: consecutiveAbsences >= 4 ? '#551111' : 'var(--surface-tint)',
                color: consecutiveAbsences >= 4 ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              4 (Reclaimed)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

AbsenceBarometer.displayName = 'AbsenceBarometer';
