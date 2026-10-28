import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SlotCard, Slot } from '@/components/slots/SlotCard';
import { Button, Modal } from '@/components/ui';
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const MOCK_SLOTS: Slot[] = [
  // C. V. Raman Gym
  {
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
  },
  {
    id: 's_ram_m2',
    facility_id: 'raman',
    facility_name: 'C. V. Raman Indoor Gym',
    batch_name: 'Batch M2',
    start_time: '07:15',
    end_time: '08:15',
    time_display: '07:15 AM – 08:15 AM',
    allocated_count: 60,
    total_capacity: 60,
    waitlist_count: 7,
    trainer_name: 'Coach Rajesh Kumar',
    period: 'morning',
  },
  {
    id: 's_ram_e1',
    facility_id: 'raman',
    facility_name: 'C. V. Raman Indoor Gym',
    batch_name: 'Batch E1',
    start_time: '16:30',
    end_time: '17:30',
    time_display: '04:30 PM – 05:30 PM',
    allocated_count: 42,
    total_capacity: 60,
    waitlist_count: 0,
    trainer_name: 'Coach Rajesh Kumar',
    period: 'evening',
  },
  {
    id: 's_ram_e2',
    facility_id: 'raman',
    facility_name: 'C. V. Raman Indoor Gym',
    batch_name: 'Batch E2',
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
    id: 's_ram_e3',
    facility_id: 'raman',
    facility_name: 'C. V. Raman Indoor Gym',
    batch_name: 'Batch E3',
    start_time: '19:00',
    end_time: '20:00',
    time_display: '07:00 PM – 08:00 PM',
    allocated_count: 51,
    total_capacity: 60,
    waitlist_count: 0,
    trainer_name: 'Coach Rajesh Kumar',
    period: 'evening',
  },

  // Ganga Fitness Hub
  {
    id: 's_gan_m1',
    facility_id: 'ganga',
    facility_name: 'Ganga Fitness Hub',
    batch_name: 'Batch G-M1',
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
    id: 's_gan_e1',
    facility_id: 'ganga',
    facility_name: 'Ganga Fitness Hub',
    batch_name: 'Batch G-E1',
    start_time: '17:00',
    end_time: '18:00',
    time_display: '05:00 PM – 06:00 PM',
    allocated_count: 45,
    total_capacity: 45,
    waitlist_count: 5,
    trainer_name: 'Trainer Ananya Verma',
    period: 'evening',
  },

  // Krishna Conditioning
  {
    id: 's_kri_m1',
    facility_id: 'krishna',
    facility_name: 'Krishna Conditioning',
    batch_name: 'Batch K-M1',
    start_time: '06:30',
    end_time: '07:30',
    time_display: '06:30 AM – 07:30 AM',
    allocated_count: 38,
    total_capacity: 50,
    waitlist_count: 0,
    trainer_name: 'Trainer S. Murugan',
    period: 'morning',
  },
  {
    id: 's_kri_e1',
    facility_id: 'krishna',
    facility_name: 'Krishna Conditioning',
    batch_name: 'Batch K-E1',
    start_time: '17:30',
    end_time: '18:30',
    time_display: '05:30 PM – 06:30 PM',
    allocated_count: 50,
    total_capacity: 50,
    waitlist_count: 9,
    trainer_name: 'Trainer S. Murugan',
    period: 'evening',
  },

  // Narmada Strength
  {
    id: 's_nar_m1',
    facility_id: 'narmada',
    facility_name: 'Narmada Strength',
    batch_name: 'Batch N-M1',
    start_time: '07:00',
    end_time: '08:00',
    time_display: '07:00 AM – 08:00 AM',
    allocated_count: 28,
    total_capacity: 40,
    waitlist_count: 0,
    trainer_name: 'Trainer Ananya Verma',
    period: 'morning',
  },
  {
    id: 's_nar_e1',
    facility_id: 'narmada',
    facility_name: 'Narmada Strength',
    batch_name: 'Batch N-E1',
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

const FACILITIES = [
  { id: 'all', name: 'All Facilities' },
  { id: 'raman', name: 'C. V. Raman Gym' },
  { id: 'ganga', name: 'Ganga Fitness Hub' },
  { id: 'krishna', name: 'Krishna Conditioning' },
  { id: 'narmada', name: 'Narmada Strength' },
];

export const SlotBrowserPage: React.FC = () => {
  const navigate = useNavigate();

  // Review checkpoint test states
  const [hasExistingAllocation, setHasExistingAllocation] = useState<boolean>(true);
  const currentSlotId = 's_ram_m1'; // Aarav Raj's current allocated slot

  // Filter states
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'morning' | 'evening'>('all');
  const [showOpenOnly, setShowOpenOnly] = useState<boolean>(false);

  // Application / Waitlist Modal state
  const [activeModalSlot, setActiveModalSlot] = useState<Slot | null>(null);
  const [modalMode, setModalMode] = useState<'apply' | 'waitlist' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtered slot roster
  const filteredSlots = MOCK_SLOTS.filter((slot) => {
    if (selectedFacility !== 'all' && slot.facility_id !== selectedFacility) return false;
    if (selectedPeriod !== 'all' && slot.period !== selectedPeriod) return false;
    if (showOpenOnly && slot.allocated_count >= slot.total_capacity) return false;
    return true;
  });

  const handleApplyClick = (slot: Slot) => {
    setActiveModalSlot(slot);
    setModalMode('apply');
  };

  const handleWaitlistClick = (slot: Slot) => {
    setActiveModalSlot(slot);
    setModalMode('waitlist');
  };

  const handleRequestTransferClick = (slot: Slot) => {
    navigate(`/student/transfer?targetSlotId=${slot.id}`);
  };

  const handleConfirmAction = () => {
    if (!activeModalSlot) return;

    if (modalMode === 'apply') {
      setSuccessMessage(`Successfully booked slot: ${activeModalSlot.facility_name} (${activeModalSlot.time_display})!`);
    } else if (modalMode === 'waitlist') {
      setSuccessMessage(`Successfully queued in FCFS waitlist for ${activeModalSlot.facility_name} at position #${activeModalSlot.waitlist_count + 1}!`);
    }

    setActiveModalSlot(null);
    setModalMode(null);
  };

  return (
    <div
      data-ui="slot-browser-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        padding: '2rem 1.5rem 3.5rem 1.5rem',
      }}
    >
      <div className="wrap" style={{ maxWidth: '1100px' }}>
        {/* Top Breadcrumb & Checkpoint Switcher */}
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
            ← Return to Dashboard
          </Link>

          {/* Test State Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Student Mode:
            </span>
            <button
              onClick={() => setHasExistingAllocation(!hasExistingAllocation)}
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.55rem',
                border: '1px solid var(--ink)',
                backgroundColor: hasExistingAllocation ? 'var(--accent)' : 'var(--surface)',
                color: hasExistingAllocation ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {hasExistingAllocation ? 'Has Active Slot (C.V. Raman M1)' : 'No Active Slot'}
            </button>
          </div>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
            }}
          >
            SPORTS COUNCIL ALLOCATION ROSTER
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
            Browse Gym Slots & Batch Occupancy
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', maxWidth: '720px' }}>
            Real-time batch occupancy across all four SRM University-AP fitness centers.
            {hasExistingAllocation
              ? ' You already hold an active slot. Select any vacant batch to submit a protected transfer request.'
              : ' Select any vacant batch to secure your semester gym slot.'}
          </p>
        </div>

        {/* Registration Window Banner */}
        <div
          style={{
            backgroundColor: 'var(--surface-tint)',
            border: '2px solid var(--ink)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={22} color="var(--accent)" />
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                Active Registration Window: Semester I Regular Allocation
              </strong>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.825rem', color: 'var(--muted)' }}>
                FCFS waitlist queue processes automatically every evening at 18:00 upon attendance absence reclamation.
              </p>
            </div>
          </div>

          {hasExistingAllocation && (
            <Link to="/student/transfer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                Go to Slot Transfer Engine
              </Button>
            </Link>
          )}
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div
            style={{
              backgroundColor: 'var(--status-present-bg)',
              border: '2px solid var(--status-present)',
              padding: '1rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-present)' }}>
              <CheckCircle2 size={20} />
              <strong style={{ fontSize: '0.925rem' }}>{successMessage}</strong>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Dismiss ✕
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--ink)',
            boxShadow: 'var(--shadow-offset)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Facility Tab Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {FACILITIES.map((fac) => {
              const isSelected = selectedFacility === fac.id;
              return (
                <button
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface-tint)',
                    color: isSelected ? '#fff' : 'var(--ink)',
                    border: '1.5px solid var(--ink)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background var(--t-hover)',
                  }}
                >
                  {fac.name}
                </button>
              );
            })}
          </div>

          {/* Sub Filters: Period and Availability */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              borderTop: '1px dashed var(--border-color-faint)',
              paddingTop: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} /> Batch Period:
              </span>
              <button
                onClick={() => setSelectedPeriod('all')}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.65rem',
                  backgroundColor: selectedPeriod === 'all' ? 'var(--ink)' : 'transparent',
                  color: selectedPeriod === 'all' ? '#fff' : 'var(--ink)',
                  border: '1px solid var(--ink)',
                  cursor: 'pointer',
                }}
              >
                All Batches
              </button>
              <button
                onClick={() => setSelectedPeriod('morning')}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.65rem',
                  backgroundColor: selectedPeriod === 'morning' ? 'var(--ink)' : 'transparent',
                  color: selectedPeriod === 'morning' ? '#fff' : 'var(--ink)',
                  border: '1px solid var(--ink)',
                  cursor: 'pointer',
                }}
              >
                Morning Only (06:00 – 08:30)
              </button>
              <button
                onClick={() => setSelectedPeriod('evening')}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.65rem',
                  backgroundColor: selectedPeriod === 'evening' ? 'var(--ink)' : 'transparent',
                  color: selectedPeriod === 'evening' ? '#fff' : 'var(--ink)',
                  border: '1px solid var(--ink)',
                  cursor: 'pointer',
                }}
              >
                Evening Only (16:30 – 20:00)
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Show Available Slots Only</span>
            </label>
          </div>
        </div>

        {/* Slot Grid */}
        {filteredSlots.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>
              No Slots Matching Selected Filters
            </h3>
            <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem 0' }}>
              Try adjusting your facility filter or uncheck "Show Available Slots Only".
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFacility('all');
                setSelectedPeriod('all');
                setShowOpenOnly(false);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredSlots.map((slot) => {
              const isCurrent = hasExistingAllocation && slot.id === currentSlotId;

              return (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isCurrentSlot={isCurrent}
                  hasExistingAllocation={hasExistingAllocation}
                  onApply={handleApplyClick}
                  onRequestTransfer={handleRequestTransferClick}
                  onJoinWaitlist={handleWaitlistClick}
                />
              );
            })}
          </div>
        )}

        {/* Application / Waitlist Modal */}
        <Modal
          isOpen={activeModalSlot !== null}
          onClose={() => setActiveModalSlot(null)}
          title={modalMode === 'apply' ? 'Confirm Slot Allocation' : 'Join FCFS Waitlist Queue'}
          description="SRM University-AP Sports Department"
          footer={
            <>
              <Button variant="ghost" onClick={() => setActiveModalSlot(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmAction}>
                {modalMode === 'apply' ? 'Confirm Booking' : 'Join Waitlist Queue'}
              </Button>
            </>
          }
        >
          {activeModalSlot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--surface-tint)',
                  border: '1.5px solid var(--ink)',
                  padding: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <div>Facility: <strong>{activeModalSlot.facility_name}</strong></div>
                <div>Batch: <strong>{activeModalSlot.batch_name}</strong> ({activeModalSlot.time_display})</div>
                <div>Trainer: <strong>{activeModalSlot.trainer_name}</strong></div>
              </div>

              {modalMode === 'apply' ? (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  By booking this slot, you agree to attend all scheduled sessions. Missing 3 consecutive
                  sessions without an approved leave of absence will trigger automatic slot reclamation.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                    This slot is currently at 100% capacity. You will be added to the chronological
                    First-Come-First-Served (FCFS) queue at <strong>Position #{activeModalSlot.waitlist_count + 1}</strong>.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                    As soon as a slot is reclaimed or transferred, the system will automatically allocate it to you.
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

SlotBrowserPage.displayName = 'SlotBrowserPage';
