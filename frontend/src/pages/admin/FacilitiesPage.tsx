import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import {
  SlotScheduleModal,
  SlotScheduleFormData,
} from '@/components/admin/SlotScheduleModal';
import {
  Building2,
  Plus,
  Clock,
  Users,
  User,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface FacilityRecord {
  id: string;
  name: string;
  location: string;
  totalCapacity: number;
  operatingHours: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
  slots: SlotScheduleFormData[];
}

const INITIAL_FACILITIES: FacilityRecord[] = [
  {
    id: 'fac_01',
    name: 'Ramapuram Central Gymnasium (Main Wing)',
    location: 'Ground Floor, Sports Complex Block C',
    totalCapacity: 200,
    operatingHours: '06:00 AM – 09:00 PM',
    status: 'ACTIVE',
    slots: [
      {
        id: 'slot_01',
        facility_id: 'fac_01',
        facility_name: 'Ramapuram Central Gymnasium (Main Wing)',
        batch_name: 'Morning Batch Alpha (Early Risers)',
        start_time: '06:00',
        end_time: '07:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        capacity: 45,
        gender_policy: 'COED',
        trainer_name: 'Coach Rajesh Kumar',
        is_active: true,
      },
      {
        id: 'slot_02',
        facility_id: 'fac_01',
        facility_name: 'Ramapuram Central Gymnasium (Main Wing)',
        batch_name: 'Morning Batch Bravo',
        start_time: '07:00',
        end_time: '08:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        capacity: 45,
        gender_policy: 'COED',
        trainer_name: 'Coach Rajesh Kumar',
        is_active: true,
      },
      {
        id: 'slot_03',
        facility_id: 'fac_01',
        facility_name: 'Ramapuram Central Gymnasium (Main Wing)',
        batch_name: 'Evening Women Fitness & Strength',
        start_time: '17:00',
        end_time: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        capacity: 35,
        gender_policy: 'FEMALE_ONLY',
        trainer_name: 'Trainer Ananya Verma',
        is_active: true,
      },
      {
        id: 'slot_04',
        facility_id: 'fac_01',
        facility_name: 'Ramapuram Central Gymnasium (Main Wing)',
        batch_name: 'Evening Sunset Batch Delta',
        start_time: '18:00',
        end_time: '19:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        capacity: 45,
        gender_policy: 'COED',
        trainer_name: 'Trainer Ananya Verma',
        is_active: true,
      },
    ],
  },
  {
    id: 'fac_02',
    name: 'Indoor Sports Complex Hall A (Strength & Power)',
    location: 'Indoor Pavilion, North Campus',
    totalCapacity: 120,
    operatingHours: '06:00 AM – 08:00 PM',
    status: 'ACTIVE',
    slots: [
      {
        id: 'slot_05',
        facility_id: 'fac_02',
        facility_name: 'Indoor Sports Complex Hall A',
        batch_name: 'Olympic Lifting & Power Training',
        start_time: '06:30',
        end_time: '08:00',
        days: ['Mon', 'Wed', 'Fri'],
        capacity: 30,
        gender_policy: 'COED',
        trainer_name: 'Coach Suresh Babu',
        is_active: true,
      },
      {
        id: 'slot_06',
        facility_id: 'fac_02',
        facility_name: 'Indoor Sports Complex Hall A',
        batch_name: 'Varsity Athletics Training',
        start_time: '17:30',
        end_time: '19:00',
        days: ['Tue', 'Thu', 'Sat'],
        capacity: 30,
        gender_policy: 'COED',
        trainer_name: 'Coach Suresh Babu',
        is_active: true,
      },
    ],
  },
];

export const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityRecord[]>(INITIAL_FACILITIES);
  const [activeFacilityId, setActiveFacilityId] = useState<string>('fac_01');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotScheduleFormData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedFacility = facilities.find((f) => f.id === activeFacilityId) || facilities[0];

  const handleOpenAddSlot = () => {
    setEditingSlot(null);
    setIsModalOpen(true);
  };

  const handleOpenEditSlot = (slot: SlotScheduleFormData) => {
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const handleSaveSlot = (data: SlotScheduleFormData) => {
    setFacilities((prev) =>
      prev.map((fac) => {
        if (fac.id === activeFacilityId) {
          const exists = fac.slots.some((s) => s.id === data.id);
          const updatedSlots = exists
            ? fac.slots.map((s) => (s.id === data.id ? data : s))
            : [...fac.slots, data];
          return { ...fac, slots: updatedSlots };
        }
        return fac;
      })
    );
    setNotification(`Schedule "${data.batch_name}" successfully saved.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteSlot = (slotId: string) => {
    if (window.confirm('Are you sure you want to retire this recurring slot schedule?')) {
      setFacilities((prev) =>
        prev.map((fac) => {
          if (fac.id === activeFacilityId) {
            return { ...fac, slots: fac.slots.filter((s) => s.id !== slotId) };
          }
          return fac;
        })
      );
      setNotification('Slot schedule removed from live matrix.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div
      data-ui="admin-facilities-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Admin Operations Hub
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/admin/windows">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Registration Windows →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Campus Infrastructure Management • Master Catalog
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                {facilities.length} FACILITIES ACTIVE
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Gym Facilities & Slot Schedules Matrix
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Define operational hours, daily recurrence schedules (`slot_schedules`), batch capacities, and gender admission policies.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddSlot}
            className="gap-1.5 font-mono text-xs bg-[var(--athletic-green)]"
          >
            <Plus size={14} /> Create Slot Batch
          </Button>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 border-2 border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_var(--athletic-green)]">
            <CheckCircle size={15} />
            <span>{notification}</span>
          </div>
        )}

        {/* Facility Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-[var(--ink)] pb-2">
          {facilities.map((fac) => (
            <button
              key={fac.id}
              type="button"
              onClick={() => setActiveFacilityId(fac.id)}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 transition-all flex items-center gap-2 ${
                activeFacilityId === fac.id
                  ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]'
                  : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
              }`}
            >
              <Building2 size={13} />
              {fac.name} ({fac.slots.length} Slots)
            </button>
          ))}
        </div>

        {/* Active Facility Details & Schedule Table */}
        <div className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] p-6 space-y-6">
          {/* Facility Top Profile */}
          <div className="p-4 bg-[var(--ledger-surface,#f4f2ee)] border-2 border-[var(--ink)] flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                Selected Facility ID: {selectedFacility.id}
              </span>
              <h2 className="font-serif font-black text-xl text-[var(--ink)]">
                {selectedFacility.name}
              </h2>
              <p className="font-mono text-xs text-neutral-600 mt-0.5">
                {selectedFacility.location} • Operating: <strong>{selectedFacility.operatingHours}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="p-2 bg-white border border-[var(--ink)]">
                Total Capacity: <strong>{selectedFacility.totalCapacity} athletes</strong>
              </span>
              <span className="p-2 bg-white border border-[var(--ink)]">
                Configured Batches: <strong>{selectedFacility.slots.length} daily</strong>
              </span>
            </div>
          </div>

          {/* Slots Ledger Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                Recurring Slot Batches
              </h3>
              <span className="font-mono text-xs text-neutral-500">
                Turnstile access is strictly restricted to these time windows.
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-[var(--ink)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--parchment,#fbfaf8)] border-b-2 border-[var(--ink)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
                    <th className="py-2.5 px-4">Batch Designation</th>
                    <th className="py-2.5 px-4">Time Window</th>
                    <th className="py-2.5 px-4">Recurrence Days</th>
                    <th className="py-2.5 px-4">Capacity</th>
                    <th className="py-2.5 px-4">Admission Policy</th>
                    <th className="py-2.5 px-4">Staff Assigned</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-mono">
                  {selectedFacility.slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4 font-serif font-bold text-sm text-[var(--ink)]">
                        {slot.batch_name}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--athletic-green)]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {slot.start_time} – {slot.end_time}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {slot.days.join(', ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--ink)]">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {slot.capacity} spots
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          status={
                            slot.gender_policy === 'FEMALE_ONLY'
                              ? 'LATE'
                              : 'NEUTRAL'
                          }
                          className="font-mono text-[10px]"
                        >
                          {slot.gender_policy === 'COED'
                            ? 'Co-Ed'
                            : slot.gender_policy === 'FEMALE_ONLY'
                            ? 'Female Only'
                            : 'Male Only'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {slot.trainer_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-1.5 border border-neutral-300 hover:border-[var(--ink)] hover:bg-neutral-100"
                            title="Edit Slot Schedule"
                          >
                            <Edit2 size={13} className="text-neutral-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id || '')}
                            className="p-1.5 border border-neutral-300 hover:border-[var(--oxblood)] hover:bg-red-50"
                            title="Delete Slot Schedule"
                          >
                            <Trash2 size={13} className="text-[var(--oxblood)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal for Slot Schedule Creation & Editing */}
        <SlotScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveSlot}
          initialData={editingSlot}
          facilityName={selectedFacility.name}
        />
      </div>
    </div>
  );
};
