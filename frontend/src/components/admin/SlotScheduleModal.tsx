import React, { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { Clock, Users, Building2, User } from 'lucide-react';

export interface SlotScheduleFormData {
  id?: string;
  facility_id: string;
  facility_name: string;
  batch_name: string;
  start_time: string;
  end_time: string;
  days: string[];
  capacity: number;
  gender_policy: 'COED' | 'FEMALE_ONLY' | 'MALE_ONLY';
  trainer_name: string;
  is_active: boolean;
}

export interface SlotScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SlotScheduleFormData) => void;
  initialData?: SlotScheduleFormData | null;
  facilityName?: string;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SlotScheduleModal: React.FC<SlotScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  facilityName = 'Ramapuram Central Gymnasium',
}) => {
  const [batchName, setBatchName] = useState(
    initialData?.batch_name || 'Morning Batch Alpha'
  );
  const [startTime, setStartTime] = useState(initialData?.start_time || '06:00');
  const [endTime, setEndTime] = useState(initialData?.end_time || '07:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialData?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [capacity, setCapacity] = useState<number>(initialData?.capacity || 40);
  const [genderPolicy, setGenderPolicy] = useState<'COED' | 'FEMALE_ONLY' | 'MALE_ONLY'>(
    initialData?.gender_policy || 'COED'
  );
  const [trainerName, setTrainerName] = useState(
    initialData?.trainer_name || 'Coach Rajesh Kumar'
  );

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || `slot_${Date.now()}`,
      facility_id: initialData?.facility_id || 'fac_01',
      facility_name: facilityName,
      batch_name: batchName,
      start_time: startTime,
      end_time: endTime,
      days: selectedDays,
      capacity,
      gender_policy: genderPolicy,
      trainer_name: trainerName,
      is_active: true,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Configure Slot Recurrence Schedule' : 'Create New Gym Slot Schedule'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Facility Indicator */}
        <div className="p-3 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] flex items-center gap-2 font-mono text-xs text-[var(--ink)]">
          <Building2 size={16} className="text-[var(--athletic-green)]" />
          <span>Facility: <strong>{facilityName}</strong></span>
        </div>

        {/* Batch Name */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
            Slot Batch Designation:
          </label>
          <input
            type="text"
            required
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g. Morning Batch Alpha, Evening Women Fitness"
            className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--athletic-green)]"
          />
        </div>

        {/* Timing Window */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1 flex items-center gap-1">
              <Clock size={12} /> Start Time:
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1 flex items-center gap-1">
              <Clock size={12} /> End Time:
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
            />
          </div>
        </div>

        {/* Recurrence Days */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1.5">
            Recurrence Days (Mon–Sat):
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 font-mono text-xs font-bold border-2 transition-all ${
                    isSelected
                      ? 'bg-[var(--athletic-green)] text-white border-[var(--ink)]'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-[var(--ink)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Capacity & Gender Policy */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1 flex items-center gap-1">
              <Users size={12} /> Maximum Capacity:
            </label>
            <input
              type="number"
              min={5}
              max={150}
              required
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
              Policy:
            </label>
            <select
              value={genderPolicy}
              onChange={(e) => setGenderPolicy(e.target.value as 'COED' | 'FEMALE_ONLY' | 'MALE_ONLY')}
              className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
            >
              <option value="COED">Co-Ed (Open to All)</option>
              <option value="FEMALE_ONLY">Female Only Batch</option>
              <option value="MALE_ONLY">Male Only Batch</option>
            </select>
          </div>
        </div>

        {/* Trainer Assignment */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1 flex items-center gap-1">
            <User size={12} /> Assigned Trainer / Staff:
          </label>
          <select
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
          >
            <option value="Coach Rajesh Kumar">Coach Rajesh Kumar (Dept of PE)</option>
            <option value="Trainer Ananya Verma">Trainer Ananya Verma (Fitness Center)</option>
            <option value="Coach Suresh Babu">Coach Suresh Babu (Athletics Council)</option>
          </select>
        </div>

        {/* Modal Buttons */}
        <div className="pt-3 border-t-2 border-[var(--ink)] flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-mono text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="font-mono text-xs bg-[var(--athletic-green)]"
          >
            Save Slot Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};

