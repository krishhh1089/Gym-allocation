import React, { useState } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { BadgeStatus } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { ShieldAlert, Clock, Calendar } from 'lucide-react';

export interface AttendanceRecordToEdit {
  id: string;
  ap_number: string;
  student_name: string;
  session_date: string;
  slot_timing: string;
  facility_name: string;
  current_status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  checked_in_time?: string;
  correction_history?: string;
}

export interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecordToEdit | null;
  onSaveCorrection: (
    recordId: string,
    newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    reasonCategory: string,
    remarks: string
  ) => void;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveCorrection,
}) => {
  const { user } = useAuthStore();
  const [newStatus, setNewStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>(
    record?.current_status || 'EXCUSED'
  );
  const [reasonCategory, setReasonCategory] = useState('medical_certificate');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('A detailed audit justification note is mandatory under university regulations.');
      return;
    }
    setError(null);
    onSaveCorrection(record.id, newStatus, reasonCategory, remarks.trim());
    onClose();
  };

  const getStatusBadge = (st: string): BadgeStatus => {
    if (st === 'PRESENT') return 'PRESENT';
    if (st === 'ABSENT') return 'ABSENT';
    if (st === 'LATE') return 'LATE';
    return 'PENDING';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Record Audit & Correction"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Original Record Dossier */}
        <div className="p-3 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-neutral-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Roll Number
              </span>
              <div className="font-bold text-sm text-[var(--ink)]">
                {record.ap_number} — {record.student_name}
              </div>
            </div>
            <Badge status={getStatusBadge(record.current_status)} className="font-mono text-[10px]">
              CURRENT: {record.current_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-neutral-600">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {record.session_date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {record.slot_timing}
            </span>
          </div>
          <div className="text-neutral-500 text-[11px]">
            Facility: {record.facility_name}
          </div>
        </div>

        {/* New Status Selection */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
            New Verified Attendance Status:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setNewStatus(status)}
                className={`py-2 px-1 font-mono text-xs font-bold border-2 transition-all ${
                  newStatus === status
                    ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]'
                    : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Mandatory Reason Category */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
            Mandatory Justification Category:
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
          >
            <option value="medical_certificate">Medical Exemption (Doctor prescription on file)</option>
            <option value="official_sports_duty">University Official Sports Council Duty / Match</option>
            <option value="hardware_scanner_glitch">Optical Turnstile Scanner Hardware Glitch</option>
            <option value="staff_manual_misentry">Gym Staff Manual Mis-entry Correction</option>
            <option value="dean_director_pardon">Director of Physical Education Executive Pardon</option>
          </select>
        </div>

        {/* Detailed Remarks */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
            Detailed Auditor Remarks / Document Reference:
          </label>
          <textarea
            rows={3}
            required
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Document ID #MED-2026-881 verified with Campus Health Center Dr. Rao..."
            className="w-full p-2.5 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--athletic-green)]"
          />
          {error && (
            <p className="font-mono text-xs text-[var(--oxblood)] mt-1">{error}</p>
          )}
        </div>

        {/* Immutable Audit Warning */}
        <div className="p-2.5 bg-red-50 border border-[var(--oxblood)] text-[var(--oxblood)] text-[11px] font-mono flex items-start gap-2">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          <span>
            Every edit is permanently recorded in <code>attendance_corrections</code> with timestamp and logged-in administrator ID (<strong>{user?.id || 'usr_adm_003'}</strong>).
          </span>
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
            Commit Audited Correction
          </Button>
        </div>
      </form>
    </Modal>
  );
};
