import React from 'react';
import { Badge, Button, BadgeStatus } from '@/components/ui';
import { QrCode, UserCheck, AlertCircle, FileText } from 'lucide-react';

export interface AttendanceRecord {
  id: string;
  date: string;
  slot_time: string;
  facility: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'CANCELLED';
  check_in_time?: string;
  check_in_method?: 'QR_SCAN' | 'MANUAL_FALLBACK';
  exemption_reason?: string;
}

export interface AttendanceTableProps {
  records: AttendanceRecord[];
  onViewExemption?: (record: AttendanceRecord) => void;
  onDisputeAbsence?: (record: AttendanceRecord) => void;
  className?: string;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onViewExemption,
  onDisputeAbsence,
  className = '',
}) => {
  return (
    <div
      data-ui="attendance-table-container"
      style={{
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        overflow: 'hidden',
      }}
      className={className}
    >
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--ink)', backgroundColor: 'var(--surface-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
            IMMUTABLE TURNSTILE LOGS
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0.15rem 0 0 0' }}>
            Session Attendance Ledger
          </h3>
        </div>

        <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          Showing {records.length} Recorded Sessions
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-tint)', borderBottom: '2px solid var(--ink)' }}>
              <th style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>DATE</th>
              <th style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>SESSION TIME</th>
              <th style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>FACILITY</th>
              <th style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>STATUS</th>
              <th style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>CHECK-IN RECORD</th>
              <th style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => (
              <tr
                key={rec.id}
                style={{
                  borderBottom: '1px solid var(--border-color-faint)',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(28,27,26,0.02)',
                }}
              >
                {/* Date */}
                <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600 }}>
                  {rec.date}
                </td>

                {/* Slot Timing */}
                <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.9rem' }}>
                  {rec.slot_time}
                </td>

                {/* Facility */}
                <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.875rem' }}>
                  {rec.facility}
                </td>

                {/* Status Badge */}
                <td style={{ padding: '0.85rem 1.25rem' }}>
                  <Badge status={rec.status as BadgeStatus} size="sm" />
                </td>

                {/* Check-in Method */}
                <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem' }}>
                  {rec.status === 'PRESENT' || rec.status === 'LATE' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink)' }}>
                      {rec.check_in_method === 'QR_SCAN' ? (
                        <QrCode size={14} color="var(--accent)" />
                      ) : (
                        <UserCheck size={14} color="var(--status-late)" />
                      )}
                      <span className="nums">
                        {rec.check_in_time} ({rec.check_in_method === 'QR_SCAN' ? 'QR Pass' : 'Manual AP'})
                      </span>
                    </div>
                  ) : rec.exemption_reason ? (
                    <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.825rem' }}>
                      Excused: {rec.exemption_reason.slice(0, 24)}...
                    </span>
                  ) : (
                    <span style={{ color: 'var(--faint)', fontSize: '0.825rem' }}>
                      — Unrecorded
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                  {rec.exemption_reason ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewExemption?.(rec)}
                      leftIcon={<FileText size={13} />}
                    >
                      Exemption Note
                    </Button>
                  ) : rec.status === 'ABSENT' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDisputeAbsence?.(rec)}
                      leftIcon={<AlertCircle size={13} color="var(--danger)" />}
                      style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
                    >
                      Dispute
                    </Button>
                  ) : (
                    <span style={{ color: 'var(--faint)', fontSize: '0.8rem' }}>Verified ✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AttendanceTable.displayName = 'AttendanceTable';
