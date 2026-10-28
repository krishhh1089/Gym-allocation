import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Input,
  Badge,
  FolderTabs,
  Modal,
  PerforatedSlip,
  BadgeStatus,
} from '@/components/ui';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  Send,
  Ticket,
} from 'lucide-react';

export const ComponentShowcase: React.FC = () => {
  // Interactive test states
  const [btnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState('AP22110010045');
  const [hasInputError, setHasInputError] = useState(false);
  const [activeTab, setActiveTab] = useState('tab-1');

  const badgeStatuses: BadgeStatus[] = [
    'PRESENT',
    'ACTIVE',
    'ABSENT',
    'LATE',
    'WAITLISTED',
    'PENDING',
    'RECLAIMED',
    'CANCELLED',
    'NEUTRAL',
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div className="wrap" style={{ maxWidth: '1080px' }}>
        {/* Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid var(--ink)',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '1rem',
              color: 'var(--ink)',
            }}
          >
            <ArrowLeft size={18} /> Back to Portal Hub
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              backgroundColor: 'var(--surface-tint)',
              padding: '0.25rem 0.6rem',
              border: '1px solid var(--ink)',
            }}
          >
            DESIGN SYSTEM / PHASE 1 PRIMITIVES
          </span>
        </div>

        {/* Page Header */}
        <header style={{ marginBottom: '3rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--step-head)',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '0.5rem',
            }}
          >
            Tactile Stationery Component Primitives
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.15rem',
              color: 'var(--muted)',
              maxWidth: '750px',
            }}
          >
            GymSlot design system tokens and high-contrast tactile UI elements: collegiate athletic green,
            sharp zero-radius corners, physical shadows, and keyboard-accessible components.
          </p>
        </header>

        {/* =========================================================================
            SECTION 1: BUTTONS
        ========================================================================== */}
        <section
          style={{
            marginBottom: '3.5rem',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--ink)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-offset)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-color-faint)',
              paddingBottom: '0.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.4rem' }}>1. Button Primitives (`Button.tsx`)</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBtnLoading(!btnLoading)}
            >
              Toggle Loading State: {btnLoading ? 'ON' : 'OFF'}
            </Button>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            Supports variants, sizes, icon slots, loading spinners, and physical tactile button press (`translate(2px, 2px)`).
          </p>

          {/* Variants Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Button variant="primary" isLoading={btnLoading} leftIcon={<QrCode size={18} />}>
              Primary Action
            </Button>
            <Button variant="secondary" isLoading={btnLoading} leftIcon={<Calendar size={18} />}>
              Secondary Ledger
            </Button>
            <Button variant="danger" isLoading={btnLoading} leftIcon={<ShieldAlert size={18} />}>
              Danger Revoke
            </Button>
            <Button variant="outline" isLoading={btnLoading}>
              Outline Frame
            </Button>
            <Button variant="ghost" isLoading={btnLoading}>
              Ghost Text
            </Button>
            <Button variant="primary" disabled>
              Disabled State
            </Button>
          </div>

          {/* Sizes Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              paddingTop: '1rem',
              borderTop: '1px dashed var(--border-color-faint)',
            }}
          >
            <Button variant="primary" size="sm">Small (0.875rem)</Button>
            <Button variant="primary" size="md">Medium Default</Button>
            <Button variant="primary" size="lg" rightIcon={<Send size={18} />}>
              Large (1.125rem)
            </Button>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: INPUTS
        ========================================================================== */}
        <section
          style={{
            marginBottom: '3.5rem',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--ink)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-offset)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-color-faint)',
              paddingBottom: '0.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.4rem' }}>2. Input Primitives (`Input.tsx`)</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHasInputError(!hasInputError)}
            >
              Toggle Error: {hasInputError ? 'ON' : 'OFF'}
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Input
              label="Student AP Number"
              mono
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              error={hasInputError ? 'Invalid SRM-AP registration number format' : undefined}
              helperText="Format: AP followed by 11 digits"
              prefixElement={<User size={16} />}
            />

            <Input
              label="College Email Address"
              type="email"
              placeholder="student_name@srmap.edu.in"
              defaultValue="aarav_raj@srmap.edu.in"
              helperText="Official university Google Workspace account"
            />

            <Input
              label="Allocated Gym Center (Read-only)"
              value="T-102 Indoor Sports Complex"
              disabled
              helperText="Managed by Sports Admin allocation policy"
            />
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: STATUS BADGES
        ========================================================================== */}
        <section
          style={{
            marginBottom: '3.5rem',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--ink)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-offset)',
          }}
        >
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color-faint)', paddingBottom: '0.75rem' }}>
            3. Status Badges (`Badge.tsx`)
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            High-contrast filled status tags with 0px radius, tabular monospace typography, and indicator dots.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            {badgeStatuses.map((st) => (
              <Badge key={st} status={st} size="md" />
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px dashed var(--border-color-faint)' }}>
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Compact (sm, without dot):
            </span>
            {badgeStatuses.slice(0, 5).map((st) => (
              <Badge key={st} status={st} size="sm" dot={false} />
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: FOLDER TABS
        ========================================================================== */}
        <section
          style={{
            marginBottom: '3.5rem',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>4. Physical Folder Tabs (`FolderTabs.tsx`)</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
              Physical tab strip with active sheet coupling, keyboard arrow navigation, and notification badges.
            </p>
          </div>

          <FolderTabs
            activeTabId={activeTab}
            onChange={(id) => setActiveTab(id)}
            tabs={[
              {
                id: 'tab-1',
                label: 'Session Timetable',
                badge: 'Active',
                icon: <Clock size={16} />,
                content: (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Active Gym Session Details</h3>
                    <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                      Allocated slot: <strong>06:00 AM – 07:00 AM</strong> at Central Fitness Center.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Badge status="ACTIVE" />
                      <span className="nums" style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                        Capacity: 42 / 50 Students Checked In
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                id: 'tab-2',
                label: 'Attendance History',
                badge: '18 Days',
                icon: <CheckCircle2 size={16} />,
                content: (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Monthly Check-in Log</h3>
                    <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                      Current monthly attendance rate is <strong>92.5%</strong>. No absence penalty warnings active.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Badge status="PRESENT">16 Present</Badge>
                      <Badge status="LATE">2 Late</Badge>
                      <Badge status="ABSENT">0 Absent</Badge>
                    </div>
                  </div>
                ),
              },
              {
                id: 'tab-3',
                label: 'Transfer Requests',
                badge: 1,
                icon: <AlertCircle size={16} />,
                content: (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Slot Transfer Application</h3>
                    <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
                      Requested move to Evening Slot (06:00 PM – 07:00 PM). FCFS Waitlist Position: #3.
                    </p>
                    <Badge status="WAITLISTED">Waitlist Queue #3</Badge>
                  </div>
                ),
              },
            ]}
          />
        </section>

        {/* =========================================================================
            SECTION 5: PERFORATED SLIP & MODAL
        ========================================================================== */}
        <section
          style={{
            marginBottom: '3.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Perforated Slip Demo */}
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>5. Perforated Slip (`PerforatedSlip.tsx`)</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              Tactile card with circular edge punch-outs, dashed tear line, and tear-away ticket stub.
            </p>

            <PerforatedSlip
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>
                    SRM UNIVERSITY-AP
                  </span>
                  <Badge status="ACTIVE" size="sm" />
                </div>
              }
              stub={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      PASS ID: #SLOT-2026-T102
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tear-off Admission Stub</div>
                  </div>
                  <Ticket size={24} style={{ color: 'var(--accent)' }} />
                </div>
              }
            >
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.785rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  STUDENT GYM PASS
                </span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem', marginBottom: '0.35rem' }}>
                  Aarav Raj
                </h3>
                <p className="nums" style={{ fontSize: '0.9rem', color: 'var(--faint)' }}>
                  AP22110010045 · B.Tech CSE
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--ink)',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Facility:</span>
                  <strong>Indoor Sports Complex</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Slot:</span>
                  <strong>06:00 AM – 07:00 AM</strong>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<QrCode size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Inspect Pass in Modal
              </Button>
            </PerforatedSlip>
          </div>

          {/* Modal Demo Box */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-offset)',
            }}
          >
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>6. Modal Dialog (`Modal.tsx`)</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Accessible tactile modal dialog with backdrop scrim, keyboard Escape dismiss, and action buttons.
            </p>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<ShieldAlert size={18} />}
            >
              Launch Interactive Modal Dialog
            </Button>
          </div>
        </section>

        {/* Interactive Modal Component */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Slot Change Confirmation"
          description="SRM University-AP Sports Department Allocation System"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  alert('Slot change application submitted!');
                  setIsModalOpen(false);
                }}
              >
                Confirm Submission
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--muted)' }}>
              You are applying to transfer from <strong>Morning Slot (06:00 AM - 07:00 AM)</strong> to{' '}
              <strong>Evening Slot (06:00 PM - 07:00 PM)</strong>.
            </p>

            <div
              style={{
                backgroundColor: 'var(--surface-tint)',
                border: '1.5px solid var(--ink)',
                padding: '0.85rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <AlertCircle size={16} color="var(--accent)" />
                <strong>Transfer Policy Notice</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                If target slot capacity is full, you will be queued in the FCFS waitlist. Your current slot
                remains active until the transfer is officially approved.
              </p>
            </div>

            <Input
              label="Reason for Transfer (Optional)"
              placeholder="e.g., Academic lab conflict on Tuesdays and Thursdays"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};
