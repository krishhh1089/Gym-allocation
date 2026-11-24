import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, Modal } from '@/components/ui';
import {
  CalendarDays,
  Clock,
  Plus,
  Play,
  Pause,
  StopCircle,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Users,
} from 'lucide-react';

interface RegistrationWindow {
  id: string;
  title: string;
  term: string;
  start_date: string;
  end_date: string;
  daily_active_start: string;
  daily_active_end: string;
  status: 'OPEN' | 'SCHEDULED' | 'PAUSED' | 'CLOSED';
  target_batches: string[];
  total_applications: number;
  total_slots_allocated: number;
}

const INITIAL_WINDOWS: RegistrationWindow[] = [
  {
    id: 'win_01',
    title: 'Fall Semester 2026 — General Student Registration',
    term: 'Fall 2026',
    start_date: '2026-10-25',
    end_date: '2026-10-31',
    daily_active_start: '09:00',
    daily_active_end: '22:00',
    status: 'OPEN',
    target_batches: ['B.Tech 2022', 'B.Tech 2023', 'B.Tech 2024', 'B.Tech 2025'],
    total_applications: 486,
    total_slots_allocated: 320,
  },
  {
    id: 'win_02',
    title: 'Varsity Athletes & Early Registration Window',
    term: 'Fall 2026',
    start_date: '2026-10-20',
    end_date: '2026-10-24',
    daily_active_start: '08:00',
    daily_active_end: '20:00',
    status: 'CLOSED',
    target_batches: ['Sports Quota', 'Varsity Teams'],
    total_applications: 64,
    total_slots_allocated: 60,
  },
  {
    id: 'win_03',
    title: 'Spring Semester 2027 — Advance Phase-1',
    term: 'Spring 2027',
    start_date: '2027-01-05',
    end_date: '2027-01-15',
    daily_active_start: '09:00',
    daily_active_end: '18:00',
    status: 'SCHEDULED',
    target_batches: ['All SRM-AP Students'],
    total_applications: 0,
    total_slots_allocated: 0,
  },
];

export const RegistrationWindowsPage: React.FC = () => {
  const [windows, setWindows] = useState<RegistrationWindow[]>(INITIAL_WINDOWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states for new window
  const [newTitle, setNewTitle] = useState('');
  const [newTerm, setNewTerm] = useState('Fall 2026');
  const [newStartDate, setNewStartDate] = useState('2026-11-01');
  const [newEndDate, setNewEndDate] = useState('2026-11-07');
  const [newDailyStart, setNewDailyStart] = useState('09:00');
  const [newDailyEnd, setNewDailyEnd] = useState('21:00');

  const toggleStatus = (id: string, nextStatus: RegistrationWindow['status']) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: nextStatus } : w))
    );
    setNotification(`Window status adjusted to ${nextStatus}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateWindow = (e: React.FormEvent) => {
    e.preventDefault();
    const created: RegistrationWindow = {
      id: `win_${Date.now()}`,
      title: newTitle,
      term: newTerm,
      start_date: newStartDate,
      end_date: newEndDate,
      daily_active_start: newDailyStart,
      daily_active_end: newDailyEnd,
      status: 'SCHEDULED',
      target_batches: ['All Registered Students'],
      total_applications: 0,
      total_slots_allocated: 0,
    };
    setWindows([created, ...windows]);
    setIsModalOpen(false);
    setNotification(`New registration window "${newTitle}" created.`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div
      data-ui="admin-registration-windows-page"
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
            <Link to="/admin/facilities">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Facilities & Slots →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Enrollment Gateways & Access Schedule • Timezone: IST (UTC+05:30)
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                GATEWAY CONTROL
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Registration Windows Scheduling Engine
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Configure strict registration periods, daily operating hour locks, batch quota restrictions, and emergency enrollment stops.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 font-mono text-xs bg-[var(--athletic-green)]"
          >
            <Plus size={14} /> Schedule New Window
          </Button>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 border-2 border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_var(--athletic-green)]">
            <CheckCircle2 size={15} />
            <span>{notification}</span>
          </div>
        )}

        {/* IST Timezone Assurance Banner */}
        <div className="p-3 bg-[var(--ledger-surface,#f4f2ee)] border-2 border-[var(--ink)] flex items-center justify-between font-mono text-xs text-[var(--ink)]">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-[var(--athletic-green)]" />
            <span>University Server Clock: <strong>Asia/Kolkata (IST • UTC+05:30)</strong></span>
          </div>
          <span className="text-neutral-600 hidden sm:inline">
            Automated enforcement prevents slot allocation attempts outside active hours.
          </span>
        </div>

        {/* Windows Cards List */}
        <div className="space-y-4">
          {windows.map((win) => {
            const isOpen = win.status === 'OPEN';
            return (
              <div
                key={win.id}
                className={`p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4 ${
                  isOpen ? 'border-l-[10px] border-l-[var(--athletic-green)]' : ''
                }`}
              >
                {/* Top Title & Status */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        status={
                          win.status === 'OPEN'
                            ? 'ACTIVE'
                            : win.status === 'PAUSED'
                            ? 'LATE'
                            : win.status === 'SCHEDULED'
                            ? 'PENDING'
                            : 'NEUTRAL'
                        }
                        className="font-mono text-xs"
                      >
                        {win.status}
                      </Badge>
                      <span className="font-mono text-xs text-neutral-500">
                        {win.term} • ID: {win.id}
                      </span>
                    </div>
                    <h3 className="font-serif font-black text-xl text-[var(--ink)]">
                      {win.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {win.status === 'OPEN' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(win.id, 'PAUSED')}
                          className="font-mono text-xs gap-1 border-[var(--amber)] text-[var(--ink)]"
                        >
                          <Pause size={13} /> Pause Window
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(win.id, 'CLOSED')}
                          className="font-mono text-xs gap-1 border-[var(--oxblood)] text-[var(--oxblood)]"
                        >
                          <StopCircle size={13} /> Close Window
                        </Button>
                      </>
                    ) : win.status === 'PAUSED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => toggleStatus(win.id, 'OPEN')}
                        className="font-mono text-xs gap-1 bg-[var(--athletic-green)]"
                      >
                        <Play size={13} /> Resume Window
                      </Button>
                    ) : win.status === 'SCHEDULED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => toggleStatus(win.id, 'OPEN')}
                        className="font-mono text-xs gap-1 bg-[var(--athletic-green)]"
                      >
                        <Play size={13} /> Open Gateway Now
                      </Button>
                    ) : (
                      <span className="font-mono text-xs text-neutral-400 italic">
                        Archived / Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] text-xs font-mono">
                  <div>
                    <span className="block text-neutral-500 uppercase text-[10px] font-bold">
                      Calendar Date Range
                    </span>
                    <span className="font-bold text-[var(--ink)] flex items-center gap-1 mt-0.5">
                      <CalendarDays size={13} className="text-neutral-600" />
                      {win.start_date} → {win.end_date}
                    </span>
                  </div>

                  <div>
                    <span className="block text-neutral-500 uppercase text-[10px] font-bold">
                      Daily Active Operating Window
                    </span>
                    <span className="font-bold text-[var(--athletic-green)] flex items-center gap-1 mt-0.5">
                      <Clock size={13} />
                      {win.daily_active_start} – {win.daily_active_end} IST
                    </span>
                  </div>

                  <div>
                    <span className="block text-neutral-500 uppercase text-[10px] font-bold">
                      Participation Stats
                    </span>
                    <span className="font-bold text-[var(--ink)] flex items-center gap-1 mt-0.5">
                      <Users size={13} className="text-neutral-600" />
                      {win.total_applications} Applied ({win.total_slots_allocated} Allocated)
                    </span>
                  </div>
                </div>

                {/* Target Batches Tag Cloud */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  <span className="text-neutral-600">Eligible Cohorts:</span>
                  {win.target_batches.map((batch, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-[var(--ink)] text-[11px]"
                    >
                      {batch}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Schedule New Registration Window"
        >
          <form onSubmit={handleCreateWindow} className="space-y-4 pt-2">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                Window Title / Description:
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Winter Term 2026 Phase-2 Waitlist Clearance"
                className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                Academic Term:
              </label>
              <select
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
              >
                <option value="Fall 2026">Fall Semester 2026</option>
                <option value="Spring 2027">Spring Semester 2027</option>
                <option value="Summer 2027">Summer Term 2027</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                  Start Date:
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                  End Date:
                </label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                  Daily Open Time (IST):
                </label>
                <input
                  type="time"
                  required
                  value={newDailyStart}
                  onChange={(e) => setNewDailyStart(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold uppercase text-[var(--ink)] mb-1">
                  Daily Close Time (IST):
                </label>
                <input
                  type="time"
                  required
                  value={newDailyEnd}
                  onChange={(e) => setNewDailyEnd(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[var(--ink)] flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
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
                Schedule Window
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
