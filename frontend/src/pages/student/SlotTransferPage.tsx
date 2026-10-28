import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Slot } from '@/components/slots/SlotCard';
import { TransferComparisonLedger } from '@/components/slots/TransferComparisonLedger';
import { Button, Badge } from '@/components/ui';
import {
  ArrowLeft,
  AlertCircle,
  Send,
  XCircle,
} from 'lucide-react';

const CURRENT_SLOT: Slot = {
  id: 's_ram_m1',
  facility_id: 'raman',
  facility_name: 'C. V. Raman Indoor Gym',
  batch_name: 'Batch M1',
  start_time: '06:00',
  end_time: '07:00',
  time_display: '06:00 AM – 07:00 AM',
  allocated_count: 58,
  total_capacity: 60,
  waitlist_count: 0,
  trainer_name: 'Coach Rajesh Kumar',
  period: 'morning',
};

const ELIGIBLE_TARGET_SLOTS: Slot[] = [
  {
    id: 's_ram_e2',
    facility_id: 'raman',
    facility_name: 'C. V. Raman Indoor Gym',
    batch_name: 'Batch E2 (Evening)',
    start_time: '17:45',
    end_time: '18:45',
    time_display: '05:45 PM – 06:45 PM',
    allocated_count: 60,
    total_capacity: 60,
    waitlist_count: 14,
    trainer_name: 'Coach Rajesh Kumar',
    period: 'evening',
  },
  {
    id: 's_gan_m1',
    facility_id: 'ganga',
    facility_name: 'Ganga Fitness Hub',
    batch_name: 'Batch G-M1 (Functional)',
    start_time: '06:00',
    end_time: '07:00',
    time_display: '06:00 AM – 07:00 AM',
    allocated_count: 35,
    total_capacity: 45,
    waitlist_count: 0,
    trainer_name: 'Trainer Ananya Verma',
    period: 'morning',
  },
  {
    id: 's_kri_e1',
    facility_id: 'krishna',
    facility_name: 'Krishna Conditioning',
    batch_name: 'Batch K-E1 (Athletics)',
    start_time: '17:30',
    end_time: '18:30',
    time_display: '05:30 PM – 06:30 PM',
    allocated_count: 50,
    total_capacity: 50,
    waitlist_count: 9,
    trainer_name: 'Trainer S. Murugan',
    period: 'evening',
  },
  {
    id: 's_nar_e1',
    facility_id: 'narmada',
    facility_name: 'Narmada Strength',
    batch_name: 'Batch N-E1 (Mobility)',
    start_time: '18:00',
    end_time: '19:00',
    time_display: '06:00 PM – 07:00 PM',
    allocated_count: 39,
    total_capacity: 40,
    waitlist_count: 0,
    trainer_name: 'Trainer Ananya Verma',
    period: 'evening',
  },
];

export const SlotTransferPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetIdParam = searchParams.get('targetSlotId');

  // Selected target slot
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    targetIdParam || ELIGIBLE_TARGET_SLOTS[0].id
  );

  // Form states
  const [reason, setReason] = useState<string>('Academic Class Timetable Clash');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const targetSlot =
    ELIGIBLE_TARGET_SLOTS.find((s) => s.id === selectedTargetId) || ELIGIBLE_TARGET_SLOTS[0];

  const isTargetFull = targetSlot.allocated_count >= targetSlot.total_capacity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleWithdraw = () => {
    setIsSubmitted(false);
  };

  return (
    <div
      data-ui="slot-transfer-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2rem 1.5rem 3.5rem 1.5rem',
      }}
    >
      <div className="wrap" style={{ maxWidth: '920px' }}>
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
            to="/student/slots"
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
            <ArrowLeft size={16} /> Return to Slot Browser
          </Link>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--muted)',
            }}
          >
            PROTECTED TRANSFER ENGINE #SEC-TR04
          </span>
        </div>

        {/* Header */}
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
            STUDENT ALLOCATION SERVICE
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
            Protected Slot Transfer Request
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', maxWidth: '750px' }}>
            Request a transfer to a different batch timing or gym facility without surrendering your existing slot.
          </p>
        </div>

        {/* IF ALREADY SUBMITTED: SHOW PENDING TRANSFER CARD */}
        {isSubmitted ? (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '3px solid var(--ink)',
              boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
              padding: '2.5rem 2rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--status-pending-bg)',
                    border: '2px solid var(--status-pending)',
                    color: 'var(--status-pending)',
                  }}
                >
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>
                    Transfer Application Pending Review
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Ticket Ref: #TR-2026-AP0045 · Submitted Just Now
                  </span>
                </div>
              </div>

              <Badge status="PENDING" size="md">
                IN REVIEW
              </Badge>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-tint)',
                border: '1.5px solid var(--ink)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                lineHeight: '1.5',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted)' }}>Current Retained Slot:</span>
                <strong>{CURRENT_SLOT.facility_name} ({CURRENT_SLOT.time_display})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted)' }}>Target Requested Slot:</span>
                <strong>{targetSlot.facility_name} ({targetSlot.time_display})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted)' }}>Transfer Reason:</span>
                <span>{reason}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>FCFS Queue Status:</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {isTargetFull ? `Queued at Position #${targetSlot.waitlist_count + 1}` : 'Direct Allocation Pending Staff Approval'}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--status-present-bg)',
                border: '1px solid var(--accent)',
                padding: '0.85rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--accent)',
                marginBottom: '1.75rem',
              }}
            >
              <strong>Protected Guarantee Reminder:</strong> Your current pass for {CURRENT_SLOT.facility_name} remains
              valid for entry at turnstiles. You may continue attending your current batch normally.
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link to="/student/qr-code" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md">
                  View Current QR Pass
                </Button>
              </Link>
              <Link to="/student/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md">
                  Student Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={handleWithdraw}
                leftIcon={<XCircle size={16} />}
              >
                Withdraw Transfer Request
              </Button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit}>
            {/* Step 1: Target Slot Selector */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '2px solid var(--ink)',
                boxShadow: 'var(--shadow-offset)',
                padding: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <label
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                Select Target Facility & Batch:
              </label>

              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--surface-tint)',
                  border: '2px solid var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                }}
              >
                {ELIGIBLE_TARGET_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.facility_name} — {s.batch_name} ({s.time_display}) [
                    {s.allocated_count >= s.total_capacity
                      ? `FULL · Waitlist: ${s.waitlist_count}`
                      : `OPEN · ${s.total_capacity - s.allocated_count} seats`}
                    ]
                  </option>
                ))}
              </select>

              {/* Side-by-side comparison ledger */}
              <TransferComparisonLedger
                currentSlot={CURRENT_SLOT}
                targetSlot={targetSlot}
              />
            </div>

            {/* Step 2: Reason & Remarks */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '2px solid var(--ink)',
                boxShadow: 'var(--shadow-offset)',
                padding: '1.75rem',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'block',
                    marginBottom: '0.4rem',
                  }}
                >
                  Reason for Transfer Request: <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface-tint)',
                    border: '2px solid var(--ink)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Academic Class Timetable Clash">Academic Class Timetable Clash</option>
                  <option value="Lab / Project Schedule Changed">Lab / Project Schedule Changed</option>
                  <option value="Hostel Block Relocation">Hostel Block Relocation</option>
                  <option value="Medical / Rehabilitation Goal">Medical / Rehabilitation Goal</option>
                  <option value="Sports Team Practice Session">Sports Team Practice Session</option>
                  <option value="Other University Activity">Other University Activity</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'block',
                    marginBottom: '0.4rem',
                  }}
                >
                  Supporting Explanation (Optional):
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  maxLength={250}
                  placeholder="e.g., Computer Networks laboratory was shifted to Tuesday/Thursday 08:00 AM, creating an unresolvable overlap."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--surface-tint)',
                    border: '2px solid var(--ink)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', float: 'right' }}>
                  {remarks.length} / 250 characters
                </span>
              </div>
            </div>

            {/* Submission Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<Send size={18} />}
              >
                Submit Transfer Application
              </Button>

              <Link to="/student/slots" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="md">
                  Cancel & Go Back
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

SlotTransferPage.displayName = 'SlotTransferPage';
