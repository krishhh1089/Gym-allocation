import React, { useState } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  ArrowRight,
  ShieldAlert,
  Mail,
  UserX,
} from 'lucide-react';

export interface AtRiskStudentData {
  id: string;
  ap_number: string;
  student_name: string;
  department: string;
  email: string;
  facility_name: string;
  slot_timing: string;
  consecutive_absences: number;
  last_attended_date: string;
  warning_issued: boolean;
  status: 'WARNING' | 'CRITICAL' | 'FORFEITED';
}

export interface SlotReclaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: AtRiskStudentData | null;
  onConfirmReclaim: (
    studentId: string,
    promotedStudentName: string,
    promotedStudentAP: string
  ) => void;
}

export const SlotReclaimModal: React.FC<SlotReclaimModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmReclaim,
}) => {
  const { user } = useAuthStore();
  const [notifyEmail, setNotifyEmail] = useState(true);

  if (!student) return null;

  // Simulated top candidate from FCFS Waitlist
  const waitlistCandidate = {
    ap_number: 'AP22110010199',
    name: 'Vikramaditya Rao',
    department: 'Civil Engineering (2023-2027)',
    waitlist_position: 1,
  };

  const handleExecute = () => {
    onConfirmReclaim(
      student.id,
      waitlistCandidate.name,
      waitlistCandidate.ap_number
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Slot Reclamation & Immediate Waitlist Promotion"
    >
      <div className="space-y-4 pt-2 font-mono text-xs">
        {/* Warning Alert Banner */}
        <div className="p-3 bg-red-50 border-2 border-[var(--oxblood)] text-[var(--oxblood)] flex items-start gap-2">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Automated Forfeiture Enforcement</div>
            <div className="text-[11px] mt-0.5">
              Revoking allocation for <strong>{student.student_name} ({student.ap_number})</strong> due to {student.consecutive_absences} consecutive unexcused absences.
            </div>
          </div>
        </div>

        {/* Transfer / Reallocation Ledger Flow */}
        <div className="p-4 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-dashed border-neutral-300">
            <span className="text-[10px] uppercase font-bold text-neutral-500">
              Forfeited Allocation
            </span>
            <Badge status="ABSENT" className="font-mono text-[10px]">
              REVOKED
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-neutral-700">
            <div>
              <span className="block text-[10px] text-neutral-500">Student:</span>
              <strong className="text-[var(--ink)]">{student.student_name}</strong>
              <div className="text-[11px]">{student.ap_number}</div>
            </div>
            <div>
              <span className="block text-[10px] text-neutral-500">Gym & Timing:</span>
              <strong className="text-[var(--ink)]">{student.slot_timing}</strong>
              <div className="text-[11px] truncate">{student.facility_name}</div>
            </div>
          </div>

          {/* Promotion Target Indicator */}
          <div className="pt-2 border-t-2 border-dashed border-neutral-300 flex items-center gap-2">
            <ArrowRight size={16} className="text-[var(--athletic-green)]" />
            <span className="text-[10px] uppercase font-bold text-[var(--athletic-green)]">
              Next in Line on FCFS Waitlist:
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-[var(--athletic-green)] text-[var(--athletic-green)] space-y-0.5">
            <div className="flex items-center justify-between">
              <strong>{waitlistCandidate.name} ({waitlistCandidate.ap_number})</strong>
              <Badge status="ACTIVE" className="font-mono text-[9px]">
                WAITLIST #{waitlistCandidate.waitlist_position}
              </Badge>
            </div>
            <div className="text-[11px] text-neutral-600">
              {waitlistCandidate.department} • Will be immediately awarded this slot.
            </div>
          </div>
        </div>

        {/* Notification Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white border border-neutral-300 hover:bg-neutral-50">
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
            className="w-4 h-4 accent-[var(--athletic-green)]"
          />
          <div className="text-neutral-700">
            <span className="font-bold flex items-center gap-1">
              <Mail size={12} /> Send Official Forfeiture & Award Notices
            </span>
            <span className="text-[10px] text-neutral-500 block">
              Dispatches regulatory email to both students and updates physical gym turnstile access list.
            </span>
          </div>
        </label>

        {/* Audit Disclaimer */}
        <div className="text-[10px] text-neutral-500">
          Supervised by Administrator: <strong>{user?.full_name || 'Dr. K. Sharma'}</strong>. Action is permanent and recorded in the audit trail.
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
            type="button"
            variant="primary"
            size="sm"
            onClick={handleExecute}
            className="font-mono text-xs gap-1.5 bg-[var(--oxblood)]"
          >
            <UserX size={13} /> Confirm Forfeiture & Reclaim Slot
          </Button>
        </div>
      </div>
    </Modal>
  );
};
