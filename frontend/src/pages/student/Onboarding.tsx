import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Badge, PerforatedSlip } from '@/components/ui';
import {
  AlertTriangle,
  Clock,
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Calendar,
  PhoneCall,
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user } = useAuthStore();

  // Simulated onboarding scenario toggle for review checkpoint
  // 1 = Active Allocation, 2 = No Allocation, 3 = Unmatched Roster
  const [allocationStatus, setAllocationStatus] = useState<'active' | 'none' | 'unmatched'>('active');

  const studentName = user?.full_name || 'Aarav Raj';
  const studentEmail = user?.email || 'aarav_raj@srmap.edu.in';
  const studentAP = user?.ap_number || 'AP22110010045';
  const department = user?.department || 'Computer Science & Engineering';
  const batch = user?.batch || '2022-2026';

  return (
    <div
      data-ui="student-onboarding"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '680px' }}>
        {/* Institutional Masthead */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}
            >
              SRM UNIVERSITY-AP · SPORTS COUNCIL
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0.25rem 0 0 0',
              }}
            >
              Student Profile Onboarding
            </h1>
          </div>
          <Badge status="ACTIVE" size="sm">
            VERIFIED RECORD
          </Badge>
        </div>

        {/* Status Switcher Bar for Verification Checkpoint */}
        <div
          style={{
            backgroundColor: 'var(--surface-tint)',
            border: '1.5px solid var(--ink)',
            padding: '0.65rem 1rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            Review Scenario Simulator:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setAllocationStatus('active')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                border: '1px solid var(--ink)',
                backgroundColor: allocationStatus === 'active' ? 'var(--accent)' : 'var(--surface)',
                color: allocationStatus === 'active' ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              1. Active Allocation
            </button>
            <button
              onClick={() => setAllocationStatus('none')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                border: '1px solid var(--ink)',
                backgroundColor: allocationStatus === 'none' ? 'var(--accent)' : 'var(--surface)',
                color: allocationStatus === 'none' ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              2. No Allocation Yet
            </button>
            <button
              onClick={() => setAllocationStatus('unmatched')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                border: '1px solid var(--ink)',
                backgroundColor: allocationStatus === 'unmatched' ? 'var(--danger)' : 'var(--surface)',
                color: allocationStatus === 'unmatched' ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              3. Unmatched Roster
            </button>
          </div>
        </div>

        {/* SCENARIO 3: UNMATCHED ROSTER ERROR */}
        {allocationStatus === 'unmatched' ? (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '3px solid var(--ink)',
              boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
              padding: '2.5rem 2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--status-absent-bg)',
                  border: '2px solid var(--danger)',
                  color: 'var(--danger)',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0, color: 'var(--danger)' }}>
                  Student Record Not Found
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  University Identity Database Exception
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Your institutional Google account (<strong>{studentEmail}</strong>) is valid, but your student record
              has not yet been indexed in the Physical Education & Sports allocation master roster.
            </p>

            <div
              style={{
                backgroundColor: 'var(--status-absent-bg)',
                border: '1.5px solid var(--danger)',
                padding: '1.25rem',
                marginBottom: '1.75rem',
              }}
            >
              <strong style={{ fontSize: '0.9rem', color: 'var(--danger)', display: 'block', marginBottom: '0.5rem' }}>
                Required Resolution Steps:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--ink)', lineHeight: '1.6' }}>
                <li>Visit the Sports Department desk at the Indoor Sports Complex (Ground Floor).</li>
                <li>Present your physical SRM University-AP Student Identity Card.</li>
                <li>Request enrollment verification with the Sports Administrative Officer.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/student/complaints" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" leftIcon={<PhoneCall size={16} />}>
                  Submit Support Ticket
                </Button>
              </Link>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md">
                  Return to Portal Hub
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* SCENARIO 1 & 2: VERIFIED DETAILS CARD */
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '3px solid var(--ink)',
              boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
              padding: '2.5rem 2rem',
            }}
          >
            {/* Verified Student Details Grid */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ShieldCheck size={20} color="var(--accent)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0 }}>
                  Verified University Enrollment Details
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  backgroundColor: 'var(--surface-tint)',
                  border: '1.5px solid var(--ink)',
                  padding: '1.25rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', display: 'block' }}>
                    FULL NAME (OFFICIAL)
                  </span>
                  <strong style={{ fontSize: '1rem', color: 'var(--ink)' }}>{studentName}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', display: 'block' }}>
                    AP REGISTRATION NUMBER
                  </span>
                  <span className="nums" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {studentAP}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', display: 'block' }}>
                    INSTITUTIONAL EMAIL
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{studentEmail}</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', display: 'block' }}>
                    DEPARTMENT & BATCH
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>{department} · {batch}</span>
                </div>
              </div>

              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.785rem', color: 'var(--faint)' }}>
                * Verified read-only record synchronized automatically via Google Workspace directory.
              </p>
            </div>

            {/* Current Allocation Section */}
            <div style={{ marginBottom: '2rem', borderTop: '2px dashed var(--border-color-faint)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: 0 }}>
                  Gym Allocation Status
                </h3>
                <Badge status={allocationStatus === 'active' ? 'PRESENT' : 'WAITLISTED'} size="sm">
                  {allocationStatus === 'active' ? 'ALLOCATION ACTIVE' : 'NO ACTIVE ALLOCATION'}
                </Badge>
              </div>

              {allocationStatus === 'active' ? (
                /* Active Allocation Pass */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <PerforatedSlip
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                          OFFICIAL GYM ADMISSION SLIP
                        </span>
                        <Badge status="ACTIVE" size="sm" />
                      </div>
                    }
                    stub={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                            VALID FOR SEMESTER I · 2026
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Physical QR Required at Turnstile</div>
                        </div>
                        <QrCode size={22} color="var(--accent)" />
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Dumbbell size={18} color="var(--accent)" />
                        <strong style={{ fontSize: '1.05rem' }}>C. V. Raman Indoor Fitness Center</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                        <Clock size={16} />
                        <span>Scheduled Timing: <strong>06:00 AM – 07:00 AM</strong> (Morning Batch)</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                        <Calendar size={16} />
                        <span>Session Days: <strong>Monday through Saturday</strong></span>
                      </div>
                    </div>
                  </PerforatedSlip>

                  <div
                    style={{
                      backgroundColor: 'var(--surface-tint)',
                      border: '1px solid var(--ink)',
                      padding: '0.85rem 1rem',
                      fontSize: '0.85rem',
                      color: 'var(--muted)',
                    }}
                  >
                    <strong>Attendance Policy Reminder:</strong> Missing 3 consecutive scheduled gym sessions without
                    prior approved leave triggers automatic slot reclamation per the Sports Council policy.
                  </div>
                </div>
              ) : (
                /* No Allocation Notice */
                <div
                  style={{
                    backgroundColor: 'var(--surface-tint)',
                    border: '1.5px solid var(--ink)',
                    padding: '1.5rem',
                  }}
                >
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--ink)' }}>
                    You currently do not have a gym facility or timing slot assigned for this academic term.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                    <Calendar size={18} color="var(--accent)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                      Next registration window opens: <strong>Monday, 09:00 AM (FCFS Allocation)</strong>
                    </span>
                  </div>
                  <Link to="/student/slots" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                      Browse Available Gym Slots & Waitlists
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
              {allocationStatus === 'active' && (
                <Link to="/student/qr-code" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md" leftIcon={<QrCode size={18} />}>
                    View Turnstile QR Code
                  </Button>
                </Link>
              )}

              <Link to="/student/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant={allocationStatus === 'active' ? 'secondary' : 'primary'} size="md">
                  Go to Student Dashboard
                </Button>
              </Link>

              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="md">
                  Portal Hub
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Onboarding.displayName = 'Onboarding';
