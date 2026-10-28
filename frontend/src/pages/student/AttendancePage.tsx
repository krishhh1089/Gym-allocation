import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AbsenceBarometer } from '@/components/attendance/AbsenceBarometer';
import { AttendanceTable, AttendanceRecord } from '@/components/attendance/AttendanceTable';
import { Button, Modal } from '@/components/ui';
import {
  ArrowLeft,
  Flame,
  FileText,
  LifeBuoy,
} from 'lucide-react';

const MOCK_ATTENDANCE_LOG: AttendanceRecord[] = [
  {
    id: 'att_01',
    date: '2026-10-28',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'PRESENT',
    check_in_time: '06:03 AM',
    check_in_method: 'QR_SCAN',
  },
  {
    id: 'att_02',
    date: '2026-10-27',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'PRESENT',
    check_in_time: '06:08 AM',
    check_in_method: 'QR_SCAN',
  },
  {
    id: 'att_03',
    date: '2026-10-26',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'LATE',
    check_in_time: '06:17 AM',
    check_in_method: 'MANUAL_FALLBACK',
  },
  {
    id: 'att_04',
    date: '2026-10-24',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'PRESENT',
    check_in_time: '06:02 AM',
    check_in_method: 'QR_SCAN',
  },
  {
    id: 'att_05',
    date: '2026-10-23',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'CANCELLED',
    exemption_reason: 'Inter-University Athletics Meet Participation (Official Dean Excuse #ATH-2026-89)',
  },
  {
    id: 'att_06',
    date: '2026-10-22',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'ABSENT',
  },
  {
    id: 'att_07',
    date: '2026-10-21',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'PRESENT',
    check_in_time: '06:05 AM',
    check_in_method: 'QR_SCAN',
  },
  {
    id: 'att_08',
    date: '2026-10-20',
    slot_time: '06:00 AM – 07:00 AM',
    facility: 'C. V. Raman Gym',
    status: 'PRESENT',
    check_in_time: '06:04 AM',
    check_in_method: 'QR_SCAN',
  },
];

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();

  // Simulated consecutive absence count (default: 0)
  const [consecutiveAbsences, setConsecutiveAbsences] = useState<number>(0);

  // Exemption detail modal
  const [selectedExemptionRecord, setSelectedExemptionRecord] = useState<AttendanceRecord | null>(null);

  const handleDisputeAbsence = (record: AttendanceRecord) => {
    navigate(`/student/complaints?category=Incorrect%20Absence%20Marked&date=${record.date}`);
  };

  return (
    <div
      data-ui="attendance-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2rem 1.5rem 3.5rem 1.5rem',
      }}
    >
      <div className="wrap" style={{ maxWidth: '1000px' }}>
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            paddingBottom: '0.85rem',
            borderBottom: '2px solid var(--ink)',
          }}
        >
          <Link
            to="/student/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </Link>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--muted)',
            }}
          >
            ATTENDANCE RECORD LEDGER #AP22110010045
          </span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
            }}
          >
            SPORTS COUNCIL COMPLIANCE
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--step-head, 2.2rem)',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0.25rem 0 0.5rem 0',
              lineHeight: 1.15,
            }}
          >
            Turnstile Attendance & Absence Log
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', maxWidth: '720px' }}>
            Official check-in records recorded at the turnstile desk scanner. Maintain attendance above 75%
            and ensure you do not accumulate 3 consecutive unexcused absences.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              padding: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
              TERM ATTENDANCE RATE
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.2rem' }}>
              91.3%
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              21 of 23 Sessions Recorded
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              padding: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
              CURRENT ACTIVE STREAK
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Flame size={24} color="var(--status-late)" />
              <span>4 Days</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Consecutive workouts logged
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              padding: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
              PENALTY RISK LEVEL
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: consecutiveAbsences >= 3 ? 'var(--danger)' : 'var(--status-present)', marginTop: '0.2rem' }}>
              {consecutiveAbsences >= 4 ? 'TERMINATED' : consecutiveAbsences === 3 ? 'CRITICAL' : consecutiveAbsences === 2 ? 'WARNING' : 'LOW RISK'}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {consecutiveAbsences} consecutive absences
            </span>
          </div>
        </div>

        {/* Absence Risk Barometer Component */}
        <div style={{ marginBottom: '2.5rem' }}>
          <AbsenceBarometer
            consecutiveAbsences={consecutiveAbsences}
            onSimulateAbsences={(count) => setConsecutiveAbsences(count)}
          />
        </div>

        {/* Attendance Ledger Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          <AttendanceTable
            records={MOCK_ATTENDANCE_LOG}
            onViewExemption={(rec) => setSelectedExemptionRecord(rec)}
            onDisputeAbsence={handleDisputeAbsence}
          />
        </div>

        {/* Dispute / Support Callout */}
        <div
          style={{
            backgroundColor: 'var(--surface-tint)',
            border: '2px solid var(--ink)',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LifeBuoy size={24} color="var(--accent)" />
            <div>
              <strong style={{ fontSize: '1rem' }}>Discrepancy in Your Attendance Record?</strong>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                If you attended a session but were marked absent due to a scanner timeout, submit an audit dispute ticket.
              </p>
            </div>
          </div>

          <Link to="/student/complaints" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="md">
              Submit Attendance Dispute Ticket →
            </Button>
          </Link>
        </div>

        {/* Exemption Detail Modal */}
        <Modal
          isOpen={selectedExemptionRecord !== null}
          onClose={() => setSelectedExemptionRecord(null)}
          title="Official Leave Exemption Note"
          description="SRM University-AP Sports Department Authorized Record"
          footer={
            <Button variant="primary" onClick={() => setSelectedExemptionRecord(null)}>
              Close
            </Button>
          }
        >
          {selectedExemptionRecord && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--surface-tint)',
                  border: '1.5px solid var(--ink)',
                  padding: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                <div>Session Date: <strong>{selectedExemptionRecord.date}</strong></div>
                <div>Scheduled Batch: <strong>{selectedExemptionRecord.slot_time}</strong></div>
                <div>Facility: <strong>{selectedExemptionRecord.facility}</strong></div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--status-present-bg)',
                  border: '1.5px solid var(--accent)',
                  padding: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.35rem' }}>
                  <FileText size={16} /> Exemption Details:
                </div>
                <p style={{ margin: 0, color: 'var(--ink)' }}>
                  {selectedExemptionRecord.exemption_reason}
                </p>
              </div>

              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--muted)' }}>
                * Excused absences do not count against the 3-consecutive absence retention threshold.
              </p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

AttendancePage.displayName = 'AttendancePage';
