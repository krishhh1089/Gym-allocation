import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Search,
  UserCheck,
  Camera,
  ClipboardList,
  CheckCircle2,
  User,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

interface StudentRosterRecord {
  ap_number: string;
  full_name: string;
  college_email: string;
  department: string;
  batch: string;
  allocated_facility: string;
  slot_timing: string;
  status: 'CHECKED_IN' | 'PENDING' | 'ABSENT';
  checked_in_at?: string;
  avatar_url?: string;
}

const MOCK_STUDENTS: StudentRosterRecord[] = [
  {
    ap_number: 'AP22110010045',
    full_name: 'Aarav Raj',
    college_email: 'aarav_raj@srmap.edu.in',
    department: 'Computer Science & Engineering',
    batch: '2022-2026',
    allocated_facility: 'Ramapuram Central Fitness Center',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'PENDING',
  },
  {
    ap_number: 'AP22110010012',
    full_name: 'Rohan Mehta',
    college_email: 'rohan_m@srmap.edu.in',
    department: 'Mechanical Engineering',
    batch: '2023-2027',
    allocated_facility: 'Ramapuram Central Fitness Center',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_at: '06:14 AM',
  },
  {
    ap_number: 'AP22110010019',
    full_name: 'Sneha Reddy',
    college_email: 'sneha_r@srmap.edu.in',
    department: 'Biotechnology',
    batch: '2022-2026',
    allocated_facility: 'Ramapuram Central Fitness Center',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_at: '06:11 AM',
  },
  {
    ap_number: 'AP22110010077',
    full_name: 'Kavita Pillai',
    college_email: 'kavita_p@srmap.edu.in',
    department: 'Computer Science & Engineering',
    batch: '2021-2025',
    allocated_facility: 'Ramapuram Central Fitness Center',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_at: '06:08 AM',
  },
  {
    ap_number: 'AP22110010088',
    full_name: 'Priya Sharma',
    college_email: 'priya_sharma@srmap.edu.in',
    department: 'Electronics & Communication',
    batch: '2022-2026',
    allocated_facility: 'Ramapuram Central Fitness Center',
    slot_timing: '05:00 PM - 06:00 PM',
    status: 'PENDING',
  },
  {
    ap_number: 'AP22110010103',
    full_name: 'Vikramaditya Rao',
    college_email: 'vikram_r@srmap.edu.in',
    department: 'Civil Engineering',
    batch: '2023-2027',
    allocated_facility: 'Ramapuram Central Fitness Center',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'PENDING',
  },
];

export const ManualCheckInPage: React.FC = () => {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRosterRecord | null>(null);
  const [overrideReason, setOverrideReason] = useState('phone_battery_dead');
  const [overrideNote, setOverrideNote] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter students by AP number, name, or email
  const filteredStudents = query.trim()
    ? MOCK_STUDENTS.filter(
        (s) =>
          s.ap_number.toLowerCase().includes(query.toLowerCase()) ||
          s.full_name.toLowerCase().includes(query.toLowerCase()) ||
          s.college_email.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelectStudent = (student: StudentRosterRecord) => {
    setSelectedStudent(student);
    setSuccessMessage(null);
  };

  const handleAuthorizeManualEntry = () => {
    if (!selectedStudent) return;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setSuccessMessage(
      `Manual attendance entry logged for ${selectedStudent.full_name} (${selectedStudent.ap_number}) at ${nowTime}. Audit supervisor note registered.`
    );
    setSelectedStudent((prev) =>
      prev ? { ...prev, status: 'CHECKED_IN', checked_in_at: nowTime } : null
    );
  };

  return (
    <div
      data-ui="staff-manual-checkin-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/staff/scanner"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Optical Turnstile Scanner
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/staff/scanner">
              <Button variant="outline" size="sm" className="gap-1 font-mono text-xs">
                <Camera size={13} /> Optical Scanner
              </Button>
            </Link>
            <Link to="/staff/session-roster">
              <Button variant="secondary" size="sm" className="gap-1 font-mono text-xs">
                <ClipboardList size={13} /> Full Session Roster
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Desk Header */}
        <header
          className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)]"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold uppercase text-[var(--oxblood)] tracking-wider">
                  Staff Fallback Station • Protocol #ATT-MAN-04
                </span>
                <Badge status="LATE" className="font-mono text-[10px]">
                  AUDITED OVERRIDE
                </Badge>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
                Manual Attendance & AP Lookup Desk
              </h1>
              <p className="font-mono text-xs text-neutral-600 mt-1">
                Authorized override station for unreadable phone screens, battery depletion, or hardware exceptions. Every manual check-in is signed by staff ({user?.full_name || 'Coach Rajesh Kumar'}).
              </p>
            </div>
          </div>
        </header>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border-3 border-[var(--athletic-green)] text-[var(--athletic-green)] flex items-start gap-3 shadow-[4px_4px_0px_var(--athletic-green)]">
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif font-bold text-sm">Attendance Confirmed</h4>
              <p className="font-mono text-xs mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Main Grid: Search & Results (Left) vs Authorization Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search & Candidates List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)] mb-2">
                Lookup Student by AP Number or Name
              </h3>
              <p className="font-mono text-xs text-neutral-600 mb-4">
                Type 11-digit university roll number (e.g. <code>AP22110010045</code>) or student full name:
              </p>

              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  placeholder="Search AP22110010045, Aarav Raj, sneha..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 font-mono text-sm bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--athletic-green)]"
                  autoFocus
                />
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono mb-4">
                <span className="text-neutral-500">Quick tests:</span>
                <button
                  type="button"
                  onClick={() => setQuery('AP22110010045')}
                  className="px-2 py-0.5 bg-neutral-100 border border-[var(--ink)] hover:bg-neutral-200"
                >
                  AP22110010045 (Aarav Raj)
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('AP22110010012')}
                  className="px-2 py-0.5 bg-neutral-100 border border-[var(--ink)] hover:bg-neutral-200"
                >
                  AP22110010012 (Rohan - Checked in)
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('AP22110010088')}
                  className="px-2 py-0.5 bg-neutral-100 border border-[var(--ink)] hover:bg-neutral-200"
                >
                  AP22110010088 (Priya - Evening slot)
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-2">
                {query.trim() === '' ? (
                  <div className="p-6 text-center border-2 border-dashed border-neutral-300 font-mono text-xs text-neutral-500">
                    Enter an AP number or name above to locate active gym allocation records.
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-[var(--oxblood)] bg-red-50 text-[var(--oxblood)] font-mono text-xs">
                    No active student record matched "{query}". Verify AP number spelling.
                  </div>
                ) : (
                  filteredStudents.map((st) => {
                    const isSelected = selectedStudent?.ap_number === st.ap_number;
                    return (
                      <div
                        key={st.ap_number}
                        onClick={() => handleSelectStudent(st)}
                        className={`p-3 border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[var(--ledger-surface,#f4f2ee)] border-[var(--athletic-green)] shadow-[3px_3px_0px_var(--athletic-green)]'
                            : 'bg-white border-[var(--ink)] hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-xs font-bold text-[var(--athletic-green)]">
                              {st.ap_number}
                            </div>
                            <div className="font-serif font-bold text-base text-[var(--ink)]">
                              {st.full_name}
                            </div>
                            <div className="font-mono text-[11px] text-neutral-600">
                              {st.department} • {st.batch}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              status={
                                st.status === 'CHECKED_IN'
                                  ? 'PRESENT'
                                  : st.slot_timing.includes('05:00 PM')
                                  ? 'LATE'
                                  : 'PENDING'
                              }
                              className="font-mono text-[10px] uppercase"
                            >
                              {st.status === 'CHECKED_IN'
                                ? `Admitted (${st.checked_in_at})`
                                : st.slot_timing.includes('05:00 PM')
                                ? 'Evening Slot'
                                : 'Pending'}
                            </Badge>
                            <div className="font-mono text-[11px] text-neutral-500 mt-1">
                              {st.slot_timing}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Authorization Dossier (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedStudent ? (
              <div
                data-ui="manual-authorization-dossier"
                className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-neutral-300">
                  <div className="flex items-center gap-2">
                    <UserCheck size={20} className="text-[var(--athletic-green)]" />
                    <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                      Manual Check-In Authorization
                    </h3>
                  </div>
                  <Badge status="NEUTRAL" className="font-mono text-xs">
                    DESK PASS
                  </Badge>
                </div>

                {/* Candidate Summary */}
                <div className="p-3 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] text-xs font-mono space-y-1.5">
                  <div className="font-bold text-sm text-[var(--ink)]">
                    {selectedStudent.full_name}
                  </div>
                  <div className="text-neutral-600">AP: <strong>{selectedStudent.ap_number}</strong></div>
                  <div className="text-neutral-600">Email: {selectedStudent.college_email}</div>
                  <div className="text-neutral-600">Allocated Gym: {selectedStudent.allocated_facility}</div>
                  <div className="text-neutral-600">
                    Allocated Slot: <strong>{selectedStudent.slot_timing}</strong>
                  </div>
                </div>

                {/* If already checked in */}
                {selectedStudent.status === 'CHECKED_IN' ? (
                  <div className="p-3 bg-emerald-50 border border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs">
                    ✓ Student is already marked present for today's session at{' '}
                    <strong>{selectedStudent.checked_in_at || '06:14 AM'}</strong>.
                  </div>
                ) : (
                  <>
                    {/* Reason Selector */}
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                        Mandatory Reason for Manual Override:
                      </label>
                      <select
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--athletic-green)]"
                      >
                        <option value="phone_battery_dead">Student phone out of battery / unpowered</option>
                        <option value="screen_cracked">Phone screen damaged / QR unreadable</option>
                        <option value="turnstile_camera_offline">Turnstile camera offline / hardware error</option>
                        <option value="sports_officer_override">Special approval by Sports Council Director</option>
                      </select>
                    </div>

                    {/* Staff Notes */}
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                        Staff Remarks / Student ID Card Verification:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Verified student physical SRM-AP ID card bearing photo..."
                        value={overrideNote}
                        onChange={(e) => setOverrideNote(e.target.value)}
                        className="w-full p-2.5 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--athletic-green)]"
                      />
                    </div>

                    {/* Audit Notice */}
                    <div className="p-2.5 bg-amber-50 border border-[var(--amber)] flex items-start gap-2 text-[11px] font-mono text-neutral-700">
                      <ShieldAlert size={15} className="text-[var(--amber)] shrink-0 mt-0.5" />
                      <span>
                        This override action will be permanently recorded in the official attendance ledger with staff ID <strong>{user?.id || 'usr_stf_002'}</strong>.
                      </span>
                    </div>

                    {/* Action button */}
                    <Button
                      variant="primary"
                      onClick={handleAuthorizeManualEntry}
                      className="w-full font-mono text-xs py-2.5 gap-2 bg-[var(--athletic-green)] justify-center"
                    >
                      <UserCheck size={16} /> AUTHORIZE ENTRY & MARK PRESENT
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div
                className="p-8 text-center border-2 border-dashed border-neutral-300 bg-white flex flex-col items-center justify-center font-mono text-xs text-neutral-500"
                style={{ minHeight: '360px' }}
              >
                <User size={32} className="text-neutral-400 mb-2" />
                Select a student candidate from the search results to inspect allocation details and authorize an audited manual check-in.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
