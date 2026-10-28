import React from 'react';
import { Slot } from './SlotCard';
import { Badge } from '@/components/ui';
import { ShieldCheck, ArrowRight, Clock, User, CheckCircle2 } from 'lucide-react';

export interface TransferComparisonLedgerProps {
  currentSlot: Slot;
  targetSlot: Slot;
  className?: string;
}

export const TransferComparisonLedger: React.FC<TransferComparisonLedgerProps> = ({
  currentSlot,
  targetSlot,
  className = '',
}) => {
  return (
    <div
      data-ui="transfer-comparison-ledger"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
      }}
      className={className}
    >
      {/* Protected Transfer Guarantee Banner */}
      <div
        style={{
          backgroundColor: 'var(--status-present-bg)',
          border: '2px solid var(--accent)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div
          style={{
            padding: '0.4rem',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            display: 'inline-flex',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={22} />
        </div>
        <div>
          <strong
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              color: 'var(--accent)',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            The Protected Transfer Guarantee
          </strong>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink)', lineHeight: '1.5' }}>
            Your existing gym allocation remains <strong>100% active and secured</strong>. You will not lose your
            current workout timing unless your transfer application is reviewed and officially confirmed by the Sports Department.
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* CURRENT SLOT CARD */}
        <div
          style={{
            backgroundColor: 'var(--surface-tint)',
            border: '2px solid var(--ink)',
            boxShadow: 'var(--shadow-offset)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--muted)' }}>
              CURRENT ALLOCATION
            </span>
            <Badge status="ACTIVE" size="sm">ACTIVE NOW</Badge>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
            {currentSlot.facility_name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--accent)" />
              <strong style={{ color: 'var(--ink)' }}>{currentSlot.time_display}</strong> ({currentSlot.batch_name})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              <span>Trainer: {currentSlot.trainer_name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--status-present)" />
              <span>Status: Good Standing (Zero Absence Penalties)</span>
            </div>
          </div>
        </div>

        {/* TARGET SLOT CARD */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--accent)',
            boxShadow: 'var(--shadow-lift)',
            padding: '1.5rem',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>
              REQUESTED TARGET ALLOCATION
            </span>
            <Badge status={targetSlot.allocated_count >= targetSlot.total_capacity ? 'WAITLISTED' : 'PRESENT'} size="sm">
              {targetSlot.allocated_count >= targetSlot.total_capacity ? 'FCFS QUEUE' : 'SEATS VACANT'}
            </Badge>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>
            {targetSlot.facility_name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--accent)" />
              <strong style={{ color: 'var(--ink)' }}>{targetSlot.time_display}</strong> ({targetSlot.batch_name})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              <span>Trainer: {targetSlot.trainer_name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRight size={16} color="var(--accent)" />
              <span>
                Occupancy: <strong>{targetSlot.allocated_count} / {targetSlot.total_capacity}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

TransferComparisonLedger.displayName = 'TransferComparisonLedger';
