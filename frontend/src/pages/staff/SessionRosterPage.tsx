import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Camera,
  Search,
  Download,
  Clock,
  Building,
  ArrowLeft,
  Check,
  Undo2,
} from 'lucide-react';

interface RosterEntry {
  id: string;
  ap_number: string;
  full_name: string;
  department: string;
  batch: string;
  slot_timing: string;
  status: 'CHECKED_IN' | 'PENDING' | 'EXCUSED';
  checked_in_time?: string;
  verification_method?: 'QR_SCAN' | 'MANUAL_OVERRIDE' | 'AUTOMATED';
}

const INITIAL_ROSTER: RosterEntry[] = [
  {
    id: 'r_01',
    ap_number: 'AP22110010045',
    full_name: 'Aarav Raj',
    department: 'Computer Science & Engineering',
    batch: '2022-2026',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'PENDING',
  },
  {
    id: 'r_02',
    ap_number: 'AP22110010012',
    full_name: 'Rohan Mehta',
    department: 'Mechanical Engineering',
    batch: '2023-2027',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_time: '06:14:02 AM',
    verification_method: 'QR_SCAN',
  },
  {
    id: 'r_03',
    ap_number: 'AP22110010019',
    full_name: 'Sneha Reddy',
    department: 'Biotechnology',
    batch: '2022-2026',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_time: '06:11:45 AM',
    verification_method: 'QR_SCAN',
  },
  {
    id: 'r_04',
    ap_number: 'AP22110010077',
    full_name: 'Kavita Pillai',
    department: 'Computer Science & Engineering',
    batch: '2021-2025',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_time: '06:08:19 AM',
    verification_method: 'QR_SCAN',
  },
  {
    id: 'r_05',
    ap_number: 'AP22110010023',
    full_name: 'Devansh Joshi',
    department: 'Electrical Engineering',
    batch: '2022-2026',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_time: '06:17:30 AM',
    verification_method: 'MANUAL_OVERRIDE',
  },
  {
    id: 'r_06',
    ap_number: 'AP22110010103',
    full_name: 'Vikramaditya Rao',
    department: 'Civil Engineering',
    batch: '2023-2027',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'PENDING',
  },
  {
    id: 'r_07',
    ap_number: 'AP22110010091',
    full_name: 'Meera Nambiar',
    department: 'Computer Science & Engineering',
    batch: '2022-2026',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_time: '06:04:12 AM',
    verification_method: 'QR_SCAN',
  },
  {
    id: 'r_08',
    ap_number: 'AP22110010064',
    full_name: 'Aditya Varma',
    department: 'Electronics & Communication',
    batch: '2023-2027',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'EXCUSED',
  },
  {
    id: 'r_09',
    ap_number: 'AP22110010034',
    full_name: 'Ananya Deshmukh',
    department: 'Biomedical Engineering',
    batch: '2022-2026',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'CHECKED_IN',
    checked_in_time: '06:19:15 AM',
    verification_method: 'QR_SCAN',
  },
  {
    id: 'r_10',
    ap_number: 'AP22110010115',
    full_name: 'Nikhil Saxena',
    department: 'Mechanical Engineering',
    batch: '2021-2025',
    slot_timing: '06:00 AM - 07:00 AM',
    status: 'PENDING',
  },
];

export const SessionRosterPage: React.FC = () => {
  const { user } = useAuthStore();
  const [roster, setRoster] = useState<RosterEntry[]>(INITIAL_ROSTER);
  const [selectedSlot, setSelectedSlot] = useState('06:00 AM - 07:00 AM');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'PENDING' | 'EXCUSED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Metrics
  const totalCount = roster.length;
  const checkedInCount = roster.filter((r) => r.status === 'CHECKED_IN').length;
  const pendingCount = roster.filter((r) => r.status === 'PENDING').length;
  const excusedCount = roster.filter((r) => r.status === 'EXCUSED').length;
  const attendanceRate = Math.round((checkedInCount / totalCount) * 100);

  // Filter roster
  const filteredRoster = roster.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.ap_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Toggle single student check-in
  const toggleAttendance = (id: string) => {
    setRoster((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          if (r.status === 'CHECKED_IN') {
            return { ...r, status: 'PENDING', checked_in_time: undefined, verification_method: undefined };
          } else {
            const nowTime = new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            return { ...r, status: 'CHECKED_IN', checked_in_time: nowTime, verification_method: 'MANUAL_OVERRIDE' };
          }
        }
        return r;
      })
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['AP Number', 'Full Name', 'Department', 'Batch', 'Slot Timing', 'Status', 'Check-In Time', 'Verification Method'];
    const rows = filteredRoster.map((r) => [
      r.ap_number,
      `"${r.full_name}"`,
      `"${r.department}"`,
      r.batch,
      r.slot_timing,
      r.status,
      r.checked_in_time || '—',
      r.verification_method || '—',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `session_roster_${new Date().toISOString().split('T')[0]}_06AM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      data-ui="staff-session-roster-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
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
            <Link to="/staff/manual-checkin">
              <Button variant="secondary" size="sm" className="gap-1 font-mono text-xs">
                <Search size={13} /> Manual AP Lookup
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header
          className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Official Roll Call Ledger • Academic Term 2026-27
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                LIVE SESSION
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Today's Session Attendance Roster
            </h1>
            <p className="font-mono text-xs text-neutral-600 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Building size={13} /> Ramapuram Central Fitness Center
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> Slot: {selectedSlot}
              </span>
              <span>•</span>
              <span>Staff: {user?.full_name || 'Coach Rajesh Kumar'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="px-3 py-1.5 font-mono text-xs bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
            >
              <option value="06:00 AM - 07:00 AM">Morning Slot 1 (06:00 AM - 07:00 AM)</option>
              <option value="07:00 AM - 08:00 AM">Morning Slot 2 (07:00 AM - 08:00 AM)</option>
              <option value="05:00 PM - 06:00 PM">Evening Slot 1 (05:00 PM - 06:00 PM)</option>
              <option value="06:00 PM - 07:00 PM">Evening Slot 2 (06:00 PM - 07:00 PM)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 font-mono text-xs border-2 border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]"
            >
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </header>

        {/* Real-time Attendance KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]">
            <span className="font-mono text-xs font-bold uppercase text-neutral-500 block">
              Registered Athletes
            </span>
            <span className="font-mono text-2xl font-black text-[var(--ink)]">
              {totalCount}
            </span>
          </div>

          <div className="p-4 bg-white border-3 border-[var(--athletic-green)] shadow-[4px_4px_0px_var(--athletic-green)]">
            <span className="font-mono text-xs font-bold uppercase text-[var(--athletic-green)] block">
              Checked In
            </span>
            <span className="font-mono text-2xl font-black text-[var(--athletic-green)]">
              {checkedInCount}
            </span>
          </div>

          <div className="p-4 bg-white border-3 border-[var(--amber)] shadow-[4px_4px_0px_var(--amber)]">
            <span className="font-mono text-xs font-bold uppercase text-[var(--amber)] block">
              Pending Admittance
            </span>
            <span className="font-mono text-2xl font-black text-[var(--amber)]">
              {pendingCount}
            </span>
          </div>

          <div className="p-4 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]">
            <span className="font-mono text-xs font-bold uppercase text-neutral-500 block">
              Turnstile Yield
            </span>
            <span className="font-mono text-2xl font-black text-[var(--ink)]">
              {attendanceRate}%
            </span>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="p-4 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'CHECKED_IN', 'PENDING', 'EXCUSED'] as const).map((tab) => (
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
                {tab.replace('_', ' ')}
                {tab === 'ALL' && ` (${totalCount})`}
                {tab === 'CHECKED_IN' && ` (${checkedInCount})`}
                {tab === 'PENDING' && ` (${pendingCount})`}
                {tab === 'EXCUSED' && ` (${excusedCount})`}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Filter roster by AP or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 font-mono text-xs bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--athletic-green)]"
            />
          </div>
        </section>

        {/* Tabular Official Ledger Table */}
        <section
          data-ui="session-roster-table"
          className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--ledger-surface,#f4f2ee)] border-b-2 border-[var(--ink)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
                  <th className="py-3 px-4">Student AP Number</th>
                  <th className="py-3 px-4">Athlete Full Name</th>
                  <th className="py-3 px-4">Department & Batch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admitted At</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-mono">
                {filteredRoster.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      row.status === 'CHECKED_IN' ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold tracking-wider text-[var(--ink)]">
                      {row.ap_number}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-sm text-[var(--ink)]">
                      {row.full_name}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {row.department} • {row.batch}
                    </td>
                    <td className="py-3 px-4">
                      {row.status === 'CHECKED_IN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check size={12} /> Present
                        </span>
                      ) : row.status === 'EXCUSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300">
                          Excused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-300">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-700">
                      {row.checked_in_time || '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {row.verification_method === 'QR_SCAN' ? (
                        <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-300">
                          Optical QR
                        </span>
                      ) : row.verification_method === 'MANUAL_OVERRIDE' ? (
                        <span className="text-[10px] bg-amber-50 text-[var(--amber)] px-1.5 py-0.5 border border-amber-300 font-bold">
                          Staff Override
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.status === 'CHECKED_IN' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAttendance(row.id)}
                          className="font-mono text-[11px] gap-1 py-1 border-neutral-300 text-neutral-600 hover:border-red-400 hover:text-red-700"
                        >
                          <Undo2 size={12} /> Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => toggleAttendance(row.id)}
                          className="font-mono text-[11px] gap-1 py-1 bg-[var(--athletic-green)]"
                        >
                          <Check size={12} /> Check In
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
