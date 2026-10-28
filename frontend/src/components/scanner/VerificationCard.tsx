import React from 'react';
import { Badge, Button } from '@/components/ui';
import { BadgeStatus } from '@/components/ui/Badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  Mail,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export type VerificationStatus =
  | 'IDLE'
  | 'VERIFIED'
  | 'DUPLICATE'
  | 'WRONG_SLOT'
  | 'INVALID_CREDENTIALS'
  | 'EXPIRED_SESSION';

export interface VerifiedStudentData {
  ap_number: string;
  full_name: string;
  college_email: string;
  department: string;
  batch: string;
  facility_name: string;
  slot_timing: string;
  session_date: string;
  allocated_slot_timing: string;
  allocated_facility: string;
  is_active_allocation: boolean;
  check_in_time?: string;
  already_checked_in_at?: string;
  streak_count?: number;
  absence_count?: number;
}

export interface VerificationCardProps {
  status: VerificationStatus;
  student: VerifiedStudentData | null;
  rawPayload?: string;
  onConfirmEntry: (student: VerifiedStudentData) => void;
  onRejectEntry: (reason: string) => void;
  onReset: () => void;
  className?: string;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  status,
  student,
  onConfirmEntry,
  onRejectEntry,
  onReset,
  className = '',
}) => {
  if (status === 'IDLE' || !student) {
    return (
      <div
        data-ui="verification-card-idle"
        className={`p-8 text-center flex flex-col items-center justify-center border-2 border-dashed border-[var(--ink)] bg-[var(--card-paper,#e8e5e0)] ${className}`}
        style={{ minHeight: '360px' }}
      >
        <div className="w-16 h-16 rounded-full bg-[var(--parchment)] border-2 border-[var(--ink)] flex items-center justify-center mb-4">
          <ShieldCheck size={28} className="text-neutral-500" />
        </div>
        <h4 className="font-serif font-bold text-lg text-[var(--ink)] mb-1">
          Turnstile Verification Standby
        </h4>
        <p className="font-mono text-xs text-neutral-600 max-w-xs mb-3">
          Present student QR code to optical scanner or select a test payload from the simulator.
        </p>
        <Badge status="NEUTRAL" className="font-mono text-[11px]">
          WAITING FOR SCAN PAYLOAD
        </Badge>
      </div>
    );
  }

  // Visual & border styling by status
  const config: Record<
    Exclude<VerificationStatus, 'IDLE'>,
    {
      borderColor: string;
      bgColor: string;
      stampColor: string;
      stampText: string;
      title: string;
      icon: React.ReactNode;
      tag: BadgeStatus;
    }
  > = {
    VERIFIED: {
      borderColor: 'var(--athletic-green, #2e4a3e)',
      bgColor: 'var(--parchment, #fbfaf8)',
      stampColor: 'var(--athletic-green, #2e4a3e)',
      stampText: 'ADMITTED • VALID PASS',
      title: 'Official Allocation Verified',
      icon: <CheckCircle2 size={24} className="text-[var(--athletic-green)]" />,
      tag: 'PRESENT',
    },
    DUPLICATE: {
      borderColor: 'var(--amber, #b57614)',
      bgColor: '#fffdf9',
      stampColor: 'var(--amber, #b57614)',
      stampText: `ALREADY CHECKED IN (${student.already_checked_in_at || 'EARLIER TODAY'})`,
      title: 'Duplicate Turnstile Entry Prevented',
      icon: <AlertTriangle size={24} className="text-[var(--amber)]" />,
      tag: 'LATE',
    },
    WRONG_SLOT: {
      borderColor: 'var(--oxblood, #9e2a2b)',
      bgColor: '#fffbfa',
      stampColor: 'var(--oxblood, #9e2a2b)',
      stampText: 'WRONG SLOT / TIME MISMATCH',
      title: 'Slot Schedule Conflict',
      icon: <XCircle size={24} className="text-[var(--oxblood)]" />,
      tag: 'ABSENT',
    },
    INVALID_CREDENTIALS: {
      borderColor: 'var(--oxblood, #9e2a2b)',
      bgColor: '#fffbfa',
      stampColor: 'var(--oxblood, #9e2a2b)',
      stampText: 'UNKNOWN AP / NOT REGISTERED',
      title: 'Access Denied — Invalid Record',
      icon: <XCircle size={24} className="text-[var(--oxblood)]" />,
      tag: 'RECLAIMED',
    },
    EXPIRED_SESSION: {
      borderColor: 'var(--oxblood, #9e2a2b)',
      bgColor: '#fffbfa',
      stampColor: 'var(--oxblood, #9e2a2b)',
      stampText: 'SESSION EXPIRED',
      title: 'QR Code Outdated',
      icon: <XCircle size={24} className="text-[var(--oxblood)]" />,
      tag: 'CANCELLED',
    },
  };

  const activeConfig = config[status as Exclude<VerificationStatus, 'IDLE'>];

  return (
    <div
      data-ui="verification-card"
      className={`relative p-6 border-4 flex flex-col justify-between transition-all ${className}`}
      style={{
        borderColor: activeConfig.borderColor,
        backgroundColor: activeConfig.bgColor,
        boxShadow: `6px 6px 0px ${activeConfig.borderColor}`,
      }}
    >
      {/* Decorative Physical Watermark Stamp */}
      <div
        className="pointer-events-none absolute right-4 top-4 select-none opacity-85 rotate-[-8deg] border-4 px-3 py-1 font-mono font-black text-xs uppercase tracking-widest"
        style={{
          borderColor: activeConfig.stampColor,
          color: activeConfig.stampColor,
        }}
      >
        {activeConfig.stampText}
      </div>

      <div>
        {/* Top Header */}
        <div className="flex items-center gap-2 mb-3">
          {activeConfig.icon}
          <div>
            <h3 className="font-serif font-black text-xl text-[var(--ink)] leading-tight">
              {activeConfig.title}
            </h3>
            <p className="font-mono text-[11px] text-neutral-500">
              SRM University-AP • Directorate of Physical Education
            </p>
          </div>
        </div>

        {/* Student Dossier Grid */}
        <div className="p-4 bg-white border-2 border-[var(--ink)] space-y-3 mb-4 shadow-[2px_2px_0px_var(--ink)]">
          {/* AP & Name */}
          <div className="flex items-start justify-between border-b-2 border-dashed border-neutral-300 pb-3">
            <div>
              <span className="block font-mono text-[10px] uppercase font-bold text-neutral-500">
                Official Student AP Number
              </span>
              <span className="font-mono text-xl font-black text-[var(--ink)] tracking-wider">
                {student.ap_number}
              </span>
              <div className="font-serif font-bold text-base text-[var(--ink)]">
                {student.full_name}
              </div>
            </div>
            <div className="text-right">
              <Badge status={activeConfig.tag} className="font-mono text-xs uppercase">
                {status.replace('_', ' ')}
              </Badge>
              <div className="font-mono text-[10px] text-neutral-500 mt-1">
                {student.department}
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-neutral-700">
              <Mail size={13} className="text-neutral-500 shrink-0" />
              <span className="truncate">{student.college_email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-700">
              <Calendar size={13} className="text-neutral-500 shrink-0" />
              <span>{student.session_date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-700">
              <Building size={13} className="text-neutral-500 shrink-0" />
              <span className="truncate">{student.facility_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-700">
              <Clock size={13} className="text-neutral-500 shrink-0" />
              <span>{student.slot_timing}</span>
            </div>
          </div>

          {/* Conflict Alert (if Wrong Slot or Inactive) */}
          {status === 'WRONG_SLOT' && (
            <div className="p-2.5 bg-red-50 border border-[var(--oxblood)] text-[var(--oxblood)] text-xs font-mono">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle size={13} /> ALLOCATION MISMATCH:
              </div>
              <div>Student is officially assigned to: <strong>{student.allocated_slot_timing}</strong></div>
              <div>Scanned pass requested: <strong>{student.slot_timing}</strong></div>
            </div>
          )}

          {/* Duplicate Entry Alert */}
          {status === 'DUPLICATE' && (
            <div className="p-2.5 bg-amber-50 border border-[var(--amber)] text-[var(--ink)] text-xs font-mono">
              <div className="font-bold flex items-center gap-1 text-[var(--amber)]">
                <AlertTriangle size={13} /> DUPLICATE TURNSTILE SCAN:
              </div>
              <div>Student was already admitted at <strong>{student.already_checked_in_at || '06:14 AM'}</strong> today.</div>
              <div className="text-[11px] text-neutral-600 mt-1">Re-entry requires Supervisor manual approval.</div>
            </div>
          )}

          {/* Student Good Standing Stats */}
          {status === 'VERIFIED' && (
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[11px] font-mono text-neutral-600">
              <span>Attendance Standing: <strong>Good Standing</strong></span>
              <span>Consecutive Absences: <strong>0 / 3</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Strip */}
      <div className="pt-2 border-t-2 border-[var(--ink)] flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="font-mono text-xs gap-1"
        >
          <RotateCcw size={13} /> Clear / Next
        </Button>

        <div className="flex items-center gap-2">
          {status === 'VERIFIED' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRejectEntry('Staff Manual Denial')}
                className="font-mono text-xs border-[var(--oxblood)] text-[var(--oxblood)]"
              >
                Deny Entry
              </Button>
              <Button
                variant="primary"
                onClick={() => onConfirmEntry(student)}
                className="font-mono text-xs gap-1.5 bg-[var(--athletic-green)]"
              >
                <CheckCircle2 size={14} /> CONFIRM ENTRY [ENTER]
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={onReset}
              className="font-mono text-xs"
            >
              Scan Next Pass
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
