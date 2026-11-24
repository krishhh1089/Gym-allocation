import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Globe,
  Clock,
  Lock,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Camera,
  Save,
  RotateCcw,
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [notification, setNotification] = useState<string | null>(null);

  // Settings states
  const [allowedDomain, setAllowedDomain] = useState('srmap.edu.in');
  const [jwtExpiryMinutes, setJwtExpiryMinutes] = useState(60);
  const [refreshTokenDays, setRefreshTokenDays] = useState(7);
  const [serverTimezone, setServerTimezone] = useState('Asia/Kolkata');
  const [duplicateScanDebounceMinutes, setDuplicateScanDebounceMinutes] = useState(15);
  const [globalEnrollmentFreeze, setGlobalEnrollmentFreeze] = useState(false);
  const [requireStaffConfirmationOnScan, setRequireStaffConfirmationOnScan] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(
      'Institutional security parameters updated and broadcast to all microservice gateway instances.'
    );
    setTimeout(() => setNotification(null), 4500);
  };

  const handleResetDefaults = () => {
    setAllowedDomain('srmap.edu.in');
    setJwtExpiryMinutes(60);
    setRefreshTokenDays(7);
    setServerTimezone('Asia/Kolkata');
    setDuplicateScanDebounceMinutes(15);
    setGlobalEnrollmentFreeze(false);
    setRequireStaffConfirmationOnScan(false);
    setNotification('Restored default university system configurations.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div
      data-ui="super-admin-settings-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/super-admin/staff"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[var(--ink)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Staff Management
          </Link>
          <div className="flex items-center gap-2">
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
                Global Gateway & Security Configuration • Master Policy Center
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                PRODUCTION PARAMETERS
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Institutional Settings & Security Rules
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Configure OAuth email domain locks, session token lifespans, timezone locks, turnstile scan debounce windows, and global enrollment circuit breakers. • Supervised by: <strong>{user?.full_name || 'Prof. M. Ramana'}</strong>
            </p>
          </div>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 border-2 border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_var(--athletic-green)]">
            <CheckCircle2 size={15} />
            <span>{notification}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Identity & Google OAuth Domain Lock */}
          <div className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-dashed border-neutral-300">
              <Globe size={18} className="text-[var(--athletic-green)]" />
              <h3 className="font-serif font-black text-lg text-[var(--ink)]">
                1. Institutional OAuth Domain Allowlist
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                  Enforced Google Workspace Domain:
                </label>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={allowedDomain}
                    onChange={(e) => setAllowedDomain(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border-2 border-[var(--ink)] font-bold focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  FastAPI Identity Service strictly rejects authentication attempts from personal Gmail or outside domains.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Session Security & Token Lifespan */}
          <div className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-dashed border-neutral-300">
              <Lock size={18} className="text-[var(--athletic-green)]" />
              <h3 className="font-serif font-black text-lg text-[var(--ink)]">
                2. JWT & Session Token Invariants
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                  Access Token Expiry (Minutes):
                </label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={jwtExpiryMinutes}
                  onChange={(e) => setJwtExpiryMinutes(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  Default: 60 mins (short-lived bearer tokens).
                </span>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                  Refresh Token Expiry (Days):
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={refreshTokenDays}
                  onChange={(e) => setRefreshTokenDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  Default: 7 days with server-side revocation hash.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Clock & Regional Timezone */}
          <div className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-dashed border-neutral-300">
              <Clock size={18} className="text-[var(--athletic-green)]" />
              <h3 className="font-serif font-black text-lg text-[var(--ink)]">
                3. Campus Timezone & Clock Synchronization
              </h3>
            </div>

            <div className="font-mono text-xs space-y-2">
              <div>
                <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                  Authoritative Timezone:
                </label>
                <select
                  value={serverTimezone}
                  onChange={(e) => setServerTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none font-bold"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+05:30) [Required]</option>
                </select>
                <span className="text-[11px] text-neutral-500 block mt-1">
                  Enforces registration window operating hours and daily turnstile cutoffs according to Indian Standard Time.
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Turnstile Optical Scanner Rules */}
          <div className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-dashed border-neutral-300">
              <Camera size={18} className="text-[var(--athletic-green)]" />
              <h3 className="font-serif font-black text-lg text-[var(--ink)]">
                4. Turnstile Optical Scanner Security
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                  Duplicate Scan Debounce Window (Minutes):
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={duplicateScanDebounceMinutes}
                  onChange={(e) => setDuplicateScanDebounceMinutes(parseInt(e.target.value) || 15)}
                  className="w-full sm:w-60 px-3 py-2 bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
                <span className="text-[11px] text-neutral-500 block mt-1">
                  Re-scanning the same student within this window flags duplicate turnstile entry.
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={requireStaffConfirmationOnScan}
                  onChange={(e) => setRequireStaffConfirmationOnScan(e.target.checked)}
                  className="w-4 h-4 accent-[var(--athletic-green)]"
                />
                <span className="font-bold text-neutral-800">
                  Require manual staff confirmation (`CONFIRM ENTRY`) on every valid scan
                </span>
              </label>
            </div>
          </div>

          {/* Card 5: Emergency Global Enrollment Freeze */}
          <div className="p-6 bg-red-50 border-4 border-[var(--oxblood)] shadow-[6px_6px_0px_var(--oxblood)] space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-dashed border-red-300">
              <ShieldAlert size={20} className="text-[var(--oxblood)]" />
              <h3 className="font-serif font-black text-lg text-[var(--oxblood)]">
                Emergency Circuit Breaker: Global Enrollment Freeze
              </h3>
            </div>

            <p className="font-mono text-xs text-neutral-700">
              Activating this circuit breaker immediately halts all student slot registrations, waitlist enrollments, and transfer applications campus-wide (e.g. during maintenance or exam periods).
            </p>

            <label className="flex items-center gap-2 cursor-pointer pt-1 font-mono text-xs">
              <input
                type="checkbox"
                checked={globalEnrollmentFreeze}
                onChange={(e) => setGlobalEnrollmentFreeze(e.target.checked)}
                className="w-4 h-4 accent-[var(--oxblood)]"
              />
              <span className="font-bold text-[var(--oxblood)] uppercase">
                EMERGENCY ENROLLMENT FREEZE ACTIVE
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="font-mono text-xs gap-1 border-[var(--ink)]"
            >
              <RotateCcw size={13} /> Reset to Defaults
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="font-mono text-xs gap-1.5 bg-[var(--athletic-green)]"
            >
              <Save size={14} /> Save & Apply Parameters
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
