import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { StudentQRCode, StudentQRData } from '@/components/qr/StudentQRCode';
import { Button } from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  HelpCircle,
  Sun,
  ShieldCheck,
} from 'lucide-react';

export const QRCodePage: React.FC = () => {
  const { user } = useAuthStore();

  // Selected date state (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [hasAllocation, setHasAllocation] = useState<boolean>(true);

  // Student allocation data
  const studentData: StudentQRData = {
    student_ap_number: user?.ap_number || 'AP22110010045',
    college_email: user?.email || 'aarav_raj@srmap.edu.in',
    session_date: selectedDate,
    slot_timing: '06:00 AM - 07:00 AM',
    facility_name: 'C. V. Raman Indoor Gym',
    batch_name: 'Batch M1',
  };

  return (
    <div
      data-ui="qr-code-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2rem 1.5rem 3rem 1.5rem',
      }}
    >
      <div className="wrap" style={{ maxWidth: '820px' }}>
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            paddingBottom: '0.85rem',
            borderBottom: '2px solid var(--ink)',
            flexWrap: 'wrap',
            gap: '0.75rem',
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

          {/* Verification Checkpoint Toggle Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Test State:
            </span>
            <button
              onClick={() => setHasAllocation(!hasAllocation)}
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.5rem',
                backgroundColor: hasAllocation ? 'var(--accent)' : 'var(--danger)',
                color: '#fff',
                border: '1px solid var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Allocation: {hasAllocation ? 'ACTIVE' : 'NONE'}
            </button>
          </div>
        </div>

        {/* Page Header */}
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
            STUDENT TURNSTILE CHECK-IN
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
            Digital Gym Pass
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', maxWidth: '640px' }}>
            Present this dynamic QR code at the gym desk turnstile scanner. Your pass verifies student credentials,
            allocated batch timing, and session date in real time.
          </p>
        </div>

        {hasAllocation ? (
          <div>
            {/* Session Date Selector Bar */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '2px solid var(--ink)',
                boxShadow: 'var(--shadow-offset)',
                padding: '1rem 1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Session Date:</span>
                <span className="nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {selectedDate === todayStr ? 'Today (Active)' : selectedDate === tomorrowStr ? 'Tomorrow' : selectedDate}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Button
                  variant={selectedDate === todayStr ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(todayStr)}
                >
                  Today
                </Button>
                <Button
                  variant={selectedDate === tomorrowStr ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(tomorrowStr)}
                >
                  Tomorrow
                </Button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    backgroundColor: 'var(--surface-tint)',
                    border: '1.5px solid var(--ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Turnstile QR Card Component */}
            <StudentQRCode data={studentData} size={210} />

            {/* Quick Actions & Policy Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginTop: '2.5rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Clock size={18} color="var(--accent)" />
                  <strong style={{ fontSize: '0.95rem' }}>Entry Window Notice</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Gates open 10 minutes prior to session start (<strong>05:50 AM</strong>). Scans after 15 minutes past start time are logged as Late.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--shadow-offset)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Sun size={18} color="var(--status-late)" />
                  <strong style={{ fontSize: '0.95rem' }}>Screen Brightness Tip</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  For optimal optical recognition by the desk camera, increase your mobile screen brightness to 100%.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--ink)',
                  boxShadow: 'var(--shadow-offset)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <ShieldCheck size={18} color="var(--accent)" />
                  <strong style={{ fontSize: '0.95rem' }}>Need a Slot Change?</strong>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Your current slot remains 100% protected while your transfer request is being triaged.
                </p>
                <Link to="/student/transfer" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm">
                    Apply for Transfer →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Student has No Active Allocation */
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '3px solid var(--ink)',
              boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'var(--status-absent-bg)',
                border: '2px solid var(--danger)',
                color: 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', margin: '0 0 0.5rem 0' }}>
              No Active Gym Slot Allocated
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 1.75rem auto', lineHeight: '1.5' }}>
              You do not currently hold an active gym slot reservation for the current semester. Turnstile passes can only be generated for confirmed facility allocations.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/student/slots" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md">
                  Browse Available Slots & Join Waitlist
                </Button>
              </Link>
              <Link to="/student/complaints" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md" leftIcon={<HelpCircle size={16} />}>
                  Contact Sports Helpdesk
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

QRCodePage.displayName = 'QRCodePage';
