import React from 'react';
import { Badge } from '@/components/ui';


interface TimetableSlot {
  time: string;
  batch: string;
  facility: string;
  capacity: number;
  trainer: string;
  type: 'Morning' | 'Evening';
}

const SCHEDULE: TimetableSlot[] = [
  {
    time: '06:00 AM – 07:00 AM',
    batch: 'Batch M1',
    facility: 'C. V. Raman Gym',
    capacity: 60,
    trainer: 'Coach Rajesh Kumar',
    type: 'Morning',
  },
  {
    time: '07:00 AM – 08:00 AM',
    batch: 'Batch M2',
    facility: 'C. V. Raman Gym',
    capacity: 60,
    trainer: 'Coach Rajesh Kumar',
    type: 'Morning',
  },
  {
    time: '08:00 AM – 09:00 AM',
    batch: 'Batch M3',
    facility: 'Ganga Fitness Hub',
    capacity: 45,
    trainer: 'Trainer Ananya Verma',
    type: 'Morning',
  },
  {
    time: '04:30 PM – 05:30 PM',
    batch: 'Batch E1',
    facility: 'Krishna Conditioning',
    capacity: 50,
    trainer: 'Trainer S. Murugan',
    type: 'Evening',
  },
  {
    time: '05:30 PM – 06:30 PM',
    batch: 'Batch E2',
    facility: 'C. V. Raman Gym',
    capacity: 60,
    trainer: 'Coach Rajesh Kumar',
    type: 'Evening',
  },
  {
    time: '06:30 PM – 07:30 PM',
    batch: 'Batch E3',
    facility: 'Narmada Strength',
    capacity: 40,
    trainer: 'Trainer Ananya Verma',
    type: 'Evening',
  },
];

export const TimetableCard: React.FC = () => {
  return (
    <div
      data-ui="timetable-card"
      style={{
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        padding: '2rem',
        marginBottom: '3.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
            REGULATED SESSION ROSTER
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', margin: '0.2rem 0 0 0' }}>
            Official Campus Gym Schedule
          </h2>
        </div>
        <Badge status="ACTIVE" size="sm">
          MONDAY – SATURDAY
        </Badge>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
        Each batch strictly enforces capacity limits to ensure athlete safety and uncrowded equipment access.
        Turnstile gates open 10 minutes prior to session start.
      </p>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--ink)', backgroundColor: 'var(--surface-tint)' }}>
              <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>BATCH</th>
              <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>TIMING</th>
              <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>FACILITY</th>
              <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>CAPACITY</th>
              <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>TRAINER ON DUTY</th>
            </tr>
          </thead>
          <tbody>
            {SCHEDULE.map((slot, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--border-color-faint)',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(28,27,26,0.03)',
                }}
              >
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{slot.batch}</td>
                <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  {slot.time}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>{slot.facility}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className="nums" style={{ fontWeight: 600 }}>{slot.capacity}</span> Students
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  {slot.trainer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
