import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { BadgeStatus } from '@/components/ui/Badge';
import {
  AttendanceCorrectionModal,
  AttendanceRecordToEdit,
} from '@/components/admin/AttendanceCorrectionModal';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Search,
  Download,
  ArrowLeft,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

interface AuditLedgerItem {
  id: string;
  ap_number: string;
  student_name: string;
  department: string;
  session_date: string;
  slot_timing: string;
  facility_name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  checked_in_time?: string;
  method?: string;
  correction_history?: string;
}

const INITIAL_AUDIT_LOGS: AuditLedgerItem[] = [
  {
    id: 'att_101',
    ap_number: 'AP22110010045',
    student_name: 'Aarav Raj',
    department: 'Computer Science & Engineering',
    session_date: '2026-10-28',
    slot_timing: '06:00 AM – 07:00 AM',
    facility_name: 'Ramapuram Central Gymnasium',
    status: 'PRESENT',
    checked_in_time: '06:12 AM',
    method: 'Optical QR Turnstile',
  },
  {
    id: 'att_102',
    ap_number: 'AP22110010012',
    student_name: 'Rohan Mehta',
    department: 'Mechanical Engineering',
    session_date: '2026-10-28',
    slot_timing: '06:00 AM – 07:00 AM',
    facility_name: 'Ramapuram Central Gymnasium',
    status: 'PRESENT',
    checked_in_time: '06:14 AM',
    method: 'Optical QR Turnstile',
  },
  {
    id: 'att_103',
    ap_number: 'AP22110010088',
    student_name: 'Priya Sharma',
    department: 'Electronics & Communication',
    session_date: '2026-10-27',
    slot_timing: '05:00 PM – 06:00 PM',
    facility_name: 'Ramapuram Central Gymnasium',
    status: 'ABSENT',
    correction_history: 'Unverified absence (Consecutive count: 2)',
  },
  {
    id: 'att_104',
    ap_number: 'AP22110010072',
    student_name: 'Tanvi Joshi',
    department: 'Biotechnology',
    session_date: '2026-10-27',
    slot_timing: '06:00 AM – 07:00 AM',
    facility_name: 'Ramapuram Central Gymnasium',
    status: 'ABSENT',
    correction_history: 'High-risk 3rd absence flagged',
  },
  {
    id: 'att_105',
    ap_number: 'AP22110010019',
    student_name: 'Sneha Reddy',
    department: 'Biotechnology',
    session_date: '2026-10-27',
    slot_timing: '06:00 AM – 07:00 AM',
    facility_name: 'Ramapuram Central Gymnasium',
    status: 'EXCUSED',
    correction_history: 'Corrected by Dr. Sharma: Medical certificate on file (Dr. Rao)',
  },
  {
    id: 'att_106',
    ap_number: 'AP22110010023',
    student_name: 'Devansh Joshi',
    department: 'Electrical Engineering',
    session_date: '2026-10-26',
    slot_timing: '06:00 AM – 07:00 AM',
    facility_name: 'Ramapuram Central Gymnasium',
    status: 'LATE',
    checked_in_time: '06:22 AM',
    method: 'Staff Override (Turnstile delay)',
  },
];

export const AttendanceAuditPage: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<AuditLedgerItem[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>('ALL');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecordToEdit | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredRecords = records.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      r.ap_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenCorrection = (r: AuditLedgerItem) => {
    setEditingRecord({
      id: r.id,
      ap_number: r.ap_number,
      student_name: r.student_name,
      session_date: r.session_date,
      slot_timing: r.slot_timing,
      facility_name: r.facility_name,
      current_status: r.status,
      checked_in_time: r.checked_in_time,
    });
  };

  const handleSaveCorrection = (
    recordId: string,
    newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    reasonCategory: string,
    remarks: string
  ) => {
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setRecords((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          const logEntry = `Corrected to ${newStatus} by ${user?.full_name || 'Dr. K. Sharma'} (${reasonCategory}): "${remarks}" at ${nowTime}`;
          return {
            ...item,
            status: newStatus,
            correction_history: logEntry,
          };
        }
        return item;
      })
    );
    setNotification(
      `Attendance record ${recordId} updated to ${newStatus}. Audit ledger log written.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = ['AP Number', 'Student Name', 'Department', 'Date', 'Slot Timing', 'Status', 'Check-in Time', 'Method', 'Audit Trail'];
    const rows = filteredRecords.map((r) => [
      r.ap_number,
      `"${r.student_name}"`,
      `"${r.department}"`,
      r.session_date,
      `"${r.slot_timing}"`,
      r.status,
      r.checked_in_time || '—',
      `"${r.method || '—'}"`,
      `"${r.correction_history || '—'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (st: string): BadgeStatus => {
    if (st === 'PRESENT') return 'PRESENT';
    if (st === 'ABSENT') return 'ABSENT';
    if (st === 'LATE') return 'LATE';
    return 'PENDING';
  };

  return (
    <div
      data-ui="admin-attendance-audit-page"
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
            <Link to="/admin/absence">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Absence Monitoring →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Sports Council Regulatory Ledger • Official Audit Archive
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                IMMUTABLE AUDIT TRAIL
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Attendance Records & Correction Ledger
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Authoritative inspection center for turnstile scans, manual check-ins, medical exemptions, and audited historical corrections.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2 font-mono text-xs border-2 border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]"
          >
            <Download size={14} /> Export Audit CSV
          </Button>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 border-2 border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_var(--athletic-green)]">
            <CheckCircle2 size={15} />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Filter Strip */}
        <div className="p-4 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 transition-all ${
                  statusFilter === tab
                    ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)]'
                    : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search AP number or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 font-mono text-xs bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
            />
          </div>
        </div>

        {/* Dense Attendance Table */}
        <div className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--ledger-surface,#f4f2ee)] border-b-2 border-[var(--ink)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
                  <th className="py-3 px-4">Student AP & Name</th>
                  <th className="py-3 px-4">Session Date & Time</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admitted At</th>
                  <th className="py-3 px-4">Audit Trail Note</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-mono">
                {filteredRecords.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      row.status === 'EXCUSED' ? 'bg-purple-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--ink)]">{row.ap_number}</div>
                      <div className="font-serif font-bold text-sm text-[var(--ink)]">
                        {row.student_name}
                      </div>
                      <div className="text-[10px] text-neutral-500">{row.department}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-800">{row.session_date}</div>
                      <div className="text-neutral-500 text-[11px]">{row.slot_timing}</div>
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      {row.facility_name}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={getStatusBadge(row.status)} className="font-mono text-[10px]">
                        {row.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-bold text-neutral-700">
                      {row.checked_in_time || '—'}
                      {row.method && (
                        <span className="block text-[10px] font-normal text-neutral-500">
                          {row.method}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-neutral-600 max-w-xs">
                      {row.correction_history ? (
                        <span className="p-1 bg-amber-50 border border-amber-300 text-[var(--ink)] block">
                          {row.correction_history}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Original Scan Record</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCorrection(row)}
                        className="font-mono text-xs gap-1 border-[var(--ink)]"
                      >
                        <Edit3 size={12} /> Audit Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Correction Modal */}
        <AttendanceCorrectionModal
          isOpen={editingRecord !== null}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          onSaveCorrection={handleSaveCorrection}
        />
      </div>
    </div>
  );
};
