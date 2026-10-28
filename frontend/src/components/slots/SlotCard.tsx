import React from 'react';
import { CapacityGauge } from './CapacityGauge';
import { Badge, Button } from '@/components/ui';
import { Clock, User, ArrowRight, CheckCircle2, Users, AlertCircle } from 'lucide-react';

export interface Slot {
  id: string;
  facility_id: string;
  facility_name: string;
  batch_name: string;
  start_time: string;
  end_time: string;
  time_display: string;
  allocated_count: number;
  total_capacity: number;
  waitlist_count: number;
  trainer_name: string;
  period: 'morning' | 'evening';
}

export interface SlotCardProps {
  slot: Slot;
  isCurrentSlot?: boolean;
  isPendingTransfer?: boolean;
  hasExistingAllocation?: boolean;
  onApply?: (slot: Slot) => void;
  onRequestTransfer?: (slot: Slot) => void;
  onJoinWaitlist?: (slot: Slot) => void;
  className?: string;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  isCurrentSlot = false,
  isPendingTransfer = false,
  hasExistingAllocation = false,
  onApply,
  onRequestTransfer,
  onJoinWaitlist,
  className = '',
}) => {
  const isFull = slot.allocated_count >= slot.total_capacity;
  const availableSeats = Math.max(0, slot.total_capacity - slot.allocated_count);

  return (
    <div
      data-ui="slot-card"
      data-slot-id={slot.id}
      style={{
        backgroundColor: isCurrentSlot ? 'var(--surface-tint)' : 'var(--surface)',
        border: isCurrentSlot ? '2.5px solid var(--accent)' : '2px solid var(--ink)',
        boxShadow: isCurrentSlot ? 'var(--shadow-lift)' : 'var(--shadow-offset)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1.25rem',
        position: 'relative',
        transition: 'transform var(--t-hover) var(--ease-out)',
      }}
      className={className}
    >
      {/* Top Metadata */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {slot.period.toUpperCase()} BATCH · {slot.batch_name}
          </span>

          {isCurrentSlot ? (
            <Badge status="ACTIVE" size="sm">
              YOUR CURRENT SLOT
            </Badge>
          ) : isPendingTransfer ? (
            <Badge status="PENDING" size="sm">
              TRANSFER PENDING
            </Badge>
          ) : isFull ? (
            <Badge status="WAITLISTED" size="sm">
              WAITLIST OPEN ({slot.waitlist_count} Queued)
            </Badge>
          ) : (
            <Badge status="PRESENT" size="sm">
              {availableSeats} SEATS OPEN
            </Badge>
          )}
        </div>

        {/* Slot Time Header */}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Clock size={20} color="var(--accent)" />
          <span>{slot.time_display}</span>
        </h3>

        {/* Facility & Trainer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
          <div>
            Facility: <strong>{slot.facility_name}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={14} /> Trainer: <span>{slot.trainer_name}</span>
          </div>
        </div>

        {/* Occupancy Gauge */}
        <CapacityGauge
          allocated={slot.allocated_count}
          total={slot.total_capacity}
          size="md"
        />
      </div>

      {/* Action Footer */}
      <div style={{ paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color-faint)' }}>
        {isCurrentSlot ? (
          <Button variant="outline" size="md" fullWidth disabled leftIcon={<CheckCircle2 size={16} />}>
            Active Attendance Roster
          </Button>
        ) : isPendingTransfer ? (
          <Button variant="outline" size="md" fullWidth disabled leftIcon={<AlertCircle size={16} />}>
            Request Awaiting Review
          </Button>
        ) : isFull ? (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => onJoinWaitlist?.(slot)}
            leftIcon={<Users size={16} color="var(--status-waitlist)" />}
          >
            Join FCFS Waitlist ({slot.waitlist_count} In Queue)
          </Button>
        ) : hasExistingAllocation ? (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => onRequestTransfer?.(slot)}
            rightIcon={<ArrowRight size={16} />}
          >
            Request Transfer to Slot
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onApply?.(slot)}
            rightIcon={<ArrowRight size={16} />}
          >
            Apply for Slot Allocation
          </Button>
        )}
      </div>
    </div>
  );
};

SlotCard.displayName = 'SlotCard';
