import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types/api';
import {
  UserPlus,
  ArrowLeft,
  Search,
  CheckCircle2,
  Mail,
} from 'lucide-react';

interface StaffAccount {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  last_login?: string;
}

const INITIAL_STAFF: StaffAccount[] = [
  {
    id: 'usr_stf_002',
    email: 'rajesh_trainer@srmap.edu.in',
    full_name: 'Coach Rajesh Kumar',
    department: 'Department of Physical Education',
    role: 'STAFF',
    status: 'ACTIVE',
    created_at: '2025-06-15',
    last_login: '2026-10-29 06:14 IST',
  },
  {
    id: 'usr_trn_005',
    email: 'ananya_trainer@srmap.edu.in',
    full_name: 'Trainer Ananya Verma',
    department: 'Central Fitness Center',
    role: 'TRAINER',
    status: 'ACTIVE',
    created_at: '2025-09-01',
    last_login: '2026-10-28 17:02 IST',
  },
  {
    id: 'usr_adm_003',
    email: 'sports_admin@srmap.edu.in',
    full_name: 'Dr. K. Sharma',
    department: 'Sports Council Administration',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2024-01-10',
    last_login: '2026-10-29 14:22 IST',
  },
  {
    id: 'usr_sad_004',
    email: 'it_director@srmap.edu.in',
    full_name: 'Prof. M. Ramana (IT Director)',
    department: 'University Systems & Network Operations',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    created_at: '2023-01-01',
    last_login: '2026-10-29 20:55 IST',
  },
  {
    id: 'usr_trn_008',
    email: 'suresh_athletics@srmap.edu.in',
    full_name: 'Coach Suresh Babu',
    department: 'Varsity Athletics Council',
    role: 'TRAINER',
    status: 'ACTIVE',
    created_at: '2025-11-12',
    last_login: '2026-10-26 08:30 IST',
  },
];

export const StaffManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<StaffAccount[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states for provisioning
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Department of Physical Education');
  const [newRole, setNewRole] = useState<UserRole>('STAFF');

  const filteredStaff = staffList.filter((s) => {
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleRoleChange = (staffId: string, targetRole: UserRole) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) return;

    if (staff.role === 'SUPER_ADMIN' && user?.id !== staff.id) {
      alert('Cannot reassign another Super Administrator without Dean authorization.');
      return;
    }

    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, role: targetRole } : s))
    );
    setNotification(
      `Role for ${staff.full_name} updated to ${targetRole}. Audit log generated in Identity Service.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusToggle = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const nextStatus = s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          setNotification(`Account ${s.email} is now ${nextStatus}.`);
          setTimeout(() => setNotification(null), 3500);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleProvisionStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.endsWith('@srmap.edu.in')) {
      alert('Error: Staff email must belong to the @srmap.edu.in domain.');
      return;
    }

    const created: StaffAccount = {
      id: `usr_stf_${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      full_name: newName.trim(),
      department: newDept,
      role: newRole,
      status: 'ACTIVE',
      created_at: new Date().toISOString().split('T')[0],
      last_login: 'Never (Invited)',
    };

    setStaffList([created, ...staffList]);
    setIsProvisionModalOpen(false);
    setNotification(
      `Provisioned account for ${created.full_name} (${created.email}) with role ${created.role}.`
    );
    setNewEmail('');
    setNewName('');
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div
      data-ui="super-admin-staff-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Operations Hub
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/super-admin/settings">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Domain Settings →
              </Button>
            </Link>
            <Link to="/super-admin/audit">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Audit Trail Inspector →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--oxblood)]">
                University Identity & Access Management (IAM) • Super Admin Console
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                RBAC CONTROLLER
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Staff Provisioning & Role Delegation
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Manage authorized university employees, assign turnstile scanner permissions (`STAFF`), trainer roles (`TRAINER`), sports council administrators (`ADMIN`), or super administrators (`SUPER_ADMIN`).
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProvisionModalOpen(true)}
            className="gap-1.5 font-mono text-xs bg-[var(--athletic-green)]"
          >
            <UserPlus size={14} /> Provision Staff Account
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
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'STAFF', 'TRAINER', 'ADMIN', 'SUPER_ADMIN'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 transition-all ${
                  roleFilter === role
                    ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)]'
                    : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 font-mono text-xs bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
            />
          </div>
        </div>

        {/* Staff Accounts Ledger Table */}
        <div className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[var(--ledger-surface,#f4f2ee)] border-b-2 border-[var(--ink)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department / Unit</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-serif font-bold text-sm text-[var(--ink)]">
                        {staff.full_name}
                      </div>
                      <div className="text-[11px] text-neutral-600 flex items-center gap-1 mt-0.5">
                        <Mail size={11} /> {staff.email}
                      </div>
                      <span className="text-[10px] text-neutral-400">ID: {staff.id}</span>
                    </td>

                    <td className="py-3 px-4 text-neutral-700">
                      {staff.department}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={staff.role}
                        onChange={(e) => handleRoleChange(staff.id, e.target.value as UserRole)}
                        className="px-2 py-1 font-mono text-xs bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] font-bold focus:outline-none"
                      >
                        <option value="STAFF">STAFF (Turnstile Scanner)</option>
                        <option value="TRAINER">TRAINER (Batch Coach)</option>
                        <option value="ADMIN">ADMIN (Sports Council)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (IT Systems)</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        status={staff.status === 'ACTIVE' ? 'ACTIVE' : 'ABSENT'}
                        className="font-mono text-[10px]"
                      >
                        {staff.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      {staff.last_login}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(staff.id)}
                        className={`font-mono text-[10px] py-1 ${
                          staff.status === 'ACTIVE'
                            ? 'border-neutral-300 text-neutral-700 hover:border-red-400 hover:text-red-700'
                            : 'border-[var(--athletic-green)] text-[var(--athletic-green)]'
                        }`}
                      >
                        {staff.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provision Modal */}
        <Modal
          isOpen={isProvisionModalOpen}
          onClose={() => setIsProvisionModalOpen(false)}
          title="Provision New University Staff Account"
        >
          <form onSubmit={handleProvisionStaff} className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-2.5 bg-neutral-100 border border-neutral-300 text-[11px] text-neutral-700">
              In accordance with university policy, staff accounts must use official <code>@srmap.edu.in</code> Google Workspace credentials.
            </div>

            <div>
              <label className="block font-bold uppercase text-[10px] mb-1">
                Full Name:
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Coach Ramesh Babu"
                className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-[10px] mb-1">
                College Email (@srmap.edu.in):
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ramesh_babu@srmap.edu.in"
                className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-[10px] mb-1">
                Department / Unit:
              </label>
              <input
                type="text"
                required
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-[10px] mb-1">
                Initial Delegated Role:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
              >
                <option value="STAFF">STAFF — Turnstile QR Scanner Desk & Attendance Verification</option>
                <option value="TRAINER">TRAINER — Batch Fitness Instructor & Roster Review</option>
                <option value="ADMIN">ADMIN — Sports Council Operations, Facilities & Audit</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN — Full Institutional System Controller</option>
              </select>
            </div>

            <div className="pt-3 border-t-2 border-[var(--ink)] flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsProvisionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-[var(--athletic-green)]"
              >
                Provision Account
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
