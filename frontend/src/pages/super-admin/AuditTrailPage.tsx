import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { JsonDiffViewer } from '@/components/admin/JsonDiffViewer';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Search,
  Download,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  correlation_id: string;
  event_type:
    | 'ROLE_DELEGATION'
    | 'SLOT_RECLAIMED'
    | 'WINDOW_SCHEDULED'
    | 'ATTENDANCE_CORRECTED'
    | 'DOMAIN_RULE_UPDATED';
  actor_email: string;
  actor_name: string;
  target_resource: string;
  timestamp: string;
  ip_address: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_901',
    correlation_id: 'cid_iam_8829104',
    event_type: 'ROLE_DELEGATION',
    actor_email: 'it_director@srmap.edu.in',
    actor_name: 'Prof. M. Ramana (IT Director)',
    target_resource: 'User: usr_stf_002 (Coach Rajesh Kumar)',
    timestamp: '2026-10-29 18:22:45 IST',
    ip_address: '10.7.154.12',
    before_state: {
      user_id: 'usr_stf_002',
      email: 'rajesh_trainer@srmap.edu.in',
      assigned_role: 'TRAINER',
      turnstile_scanner_access: false,
    },
    after_state: {
      user_id: 'usr_stf_002',
      email: 'rajesh_trainer@srmap.edu.in',
      assigned_role: 'STAFF',
      turnstile_scanner_access: true,
      delegated_by: 'it_director@srmap.edu.in',
    },
  },
  {
    id: 'aud_902',
    correlation_id: 'cid_alloc_7719203',
    event_type: 'SLOT_RECLAIMED',
    actor_email: 'sports_admin@srmap.edu.in',
    actor_name: 'Dr. K. Sharma',
    target_resource: 'Allocation: alloc_0921 (Tanvi Joshi - AP22110010072)',
    timestamp: '2026-10-29 14:15:10 IST',
    ip_address: '10.7.154.45',
    before_state: {
      student_ap: 'AP22110010072',
      consecutive_absences: 4,
      allocation_status: 'ACTIVE',
      gym: 'Ramapuram Central Gymnasium (06:00 AM – 07:00 AM)',
    },
    after_state: {
      student_ap: 'AP22110010072',
      consecutive_absences: 4,
      allocation_status: 'FORFEITED',
      promoted_student_ap: 'AP22110010199',
      promoted_student_name: 'Vikramaditya Rao',
      waitlist_position: 1,
    },
  },
  {
    id: 'aud_903',
    correlation_id: 'cid_win_5518290',
    event_type: 'WINDOW_SCHEDULED',
    actor_email: 'sports_admin@srmap.edu.in',
    actor_name: 'Dr. K. Sharma',
    target_resource: 'RegistrationWindow: win_01 (Fall 2026 Phase-1)',
    timestamp: '2026-10-28 09:00:00 IST',
    ip_address: '10.7.154.45',
    before_state: {
      window_id: 'win_01',
      status: 'SCHEDULED',
      daily_active_start: '09:00',
      daily_active_end: '22:00',
    },
    after_state: {
      window_id: 'win_01',
      status: 'OPEN',
      daily_active_start: '09:00',
      daily_active_end: '22:00',
      opened_at: '2026-10-28T09:00:00+05:30',
    },
  },
  {
    id: 'aud_904',
    correlation_id: 'cid_att_3319028',
    event_type: 'ATTENDANCE_CORRECTED',
    actor_email: 'sports_admin@srmap.edu.in',
    actor_name: 'Dr. K. Sharma',
    target_resource: 'Attendance: att_105 (Sneha Reddy - AP22110010019)',
    timestamp: '2026-10-27 16:40:12 IST',
    ip_address: '10.7.154.45',
    before_state: {
      session_date: '2026-10-27',
      status: 'ABSENT',
      checked_in_time: null,
    },
    after_state: {
      session_date: '2026-10-27',
      status: 'EXCUSED',
      reason_category: 'medical_certificate',
      remarks: 'Verified medical certificate #MED-881 signed by Dr. Rao',
    },
  },
  {
    id: 'aud_905',
    correlation_id: 'cid_sec_1109283',
    event_type: 'DOMAIN_RULE_UPDATED',
    actor_email: 'it_director@srmap.edu.in',
    actor_name: 'Prof. M. Ramana (IT Director)',
    target_resource: 'SystemSettings: SecurityGatewayRule',
    timestamp: '2026-10-26 11:10:05 IST',
    ip_address: '10.7.154.12',
    before_state: {
      allowed_domain: 'srmap.edu.in',
      jwt_expiry_minutes: 30,
    },
    after_state: {
      allowed_domain: 'srmap.edu.in',
      jwt_expiry_minutes: 60,
      updated_by: 'it_director@srmap.edu.in',
    },
  },
];

export const AuditTrailPage: React.FC = () => {
  const { user } = useAuthStore();
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesType = typeFilter === 'ALL' || log.event_type === typeFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      log.correlation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `srmap_audit_trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification('Raw immutable audit trail JSON exported.');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div
      data-ui="super-admin-audit-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/super-admin/staff"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Staff Management
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/super-admin/settings">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Domain Settings →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--oxblood)]">
                Immutable Regulatory Audit Trail • Cryptographic Event Archive
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                READ-ONLY LEDGER
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              System Audit Trail & State Delta Inspector
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Complete, tamper-evident record of all administrative operations, role delegations, attendance corrections, and slot reallocations with correlation IDs and JSON state deltas. • Active Inspector: <strong>{user?.full_name || 'Prof. M. Ramana'}</strong>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="gap-1.5 font-mono text-xs border-2 border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]"
          >
            <Download size={14} /> Export Audit JSON
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
        <div className="p-4 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              'ALL',
              'ROLE_DELEGATION',
              'SLOT_RECLAIMED',
              'WINDOW_SCHEDULED',
              'ATTENDANCE_CORRECTED',
              'DOMAIN_RULE_UPDATED',
            ].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 border-2 font-bold uppercase transition-all ${
                  typeFilter === type
                    ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)]'
                    : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Filter by CID, actor email, or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 font-mono text-xs bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
            />
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-4">
          {filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] p-5 space-y-4"
            >
              {/* Event Metadata Banner */}
              <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b-2 border-dashed border-neutral-300 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge status="NEUTRAL" className="font-mono text-[10px]">
                      {entry.event_type}
                    </Badge>
                    <span className="font-bold text-[var(--ink)]">
                      Correlation ID: <code className="bg-neutral-100 px-1 py-0.5 border">{entry.correlation_id}</code>
                    </span>
                  </div>
                  <div className="text-sm font-serif font-bold text-[var(--ink)]">
                    Target: {entry.target_resource}
                  </div>
                </div>

                <div className="text-right text-[11px] text-neutral-600 space-y-0.5">
                  <div className="font-bold text-[var(--ink)]">{entry.timestamp}</div>
                  <div>Actor: <strong>{entry.actor_email}</strong></div>
                  <div className="text-neutral-500">IP: {entry.ip_address}</div>
                </div>
              </div>

              {/* Expandable JSON State Delta Inspector */}
              <JsonDiffViewer
                beforeState={entry.before_state}
                afterState={entry.after_state}
                correlationId={entry.correlation_id}
                eventName={entry.event_type}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
