import React from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  FacilityOccupancyBar,
  FacilityOccupancyData,
} from '@/components/admin/FacilityOccupancyBar';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Badge } from '@/components/ui';
import {
  ShieldAlert,
  Building2,
  CalendarDays,
  ArrowRightLeft,
  FileCheck2,
  AlertTriangle,
  FolderSync,
  Download,
  Flame,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

const MOCK_FACILITIES: FacilityOccupancyData[] = [
  {
    id: 'fac_01',
    name: 'Ramapuram Central Gymnasium (Main Wing)',
    location: 'Ground Floor, Sports Complex Block C',
    totalCapacity: 200,
    allocatedCount: 168,
    activeCheckInsToday: 132,
    totalSlots: 6,
    operatingHours: '06:00 AM – 09:00 PM',
    status: 'ACTIVE',
  },
  {
    id: 'fac_02',
    name: 'Indoor Sports Complex Hall A (Strength & Power)',
    location: 'Indoor Pavilion, North Campus',
    totalCapacity: 120,
    allocatedCount: 114,
    activeCheckInsToday: 89,
    totalSlots: 5,
    operatingHours: '06:00 AM – 08:00 PM',
    status: 'ACTIVE',
  },
  {
    id: 'fac_03',
    name: 'Ananda Nilayam Studio (Cardio & Mobility)',
    location: 'Hostel Block 3 Mezzanine',
    totalCapacity: 60,
    allocatedCount: 38,
    activeCheckInsToday: 24,
    totalSlots: 4,
    operatingHours: '06:30 AM – 08:30 PM',
    status: 'ACTIVE',
  },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div
      data-ui="admin-dashboard-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Directorate of Physical Education & Sports Affairs • Admin Command
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                LIVE SYSTEM
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Sports Administration Operations Center
            </h1>
            <p className="font-mono text-xs text-neutral-600 flex items-center gap-3 mt-1 flex-wrap">
              <span>Admin: <strong>{user?.full_name || 'Dr. K. Sharma'}</strong> ({user?.department || 'Sports Council'})</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> Term: Fall Semester 2026-2027
              </span>
              <span>•</span>
              <span>Campus Policy: <strong>Strict 3-Absence Reclamation</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/windows">
              <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs bg-[var(--athletic-green)]">
                <CalendarDays size={14} /> Registration Windows
              </Button>
            </Link>
            <Link to="/admin/attendance">
              <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
                <FileCheck2 size={14} /> Audit Ledger
              </Button>
            </Link>
          </div>
        </header>

        {/* Quick Hub Navigation Ribbon */}
        <nav
          aria-label="Admin Sections"
          className="p-3 bg-[var(--ledger-surface,#f4f2ee)] border-2 border-[var(--ink)] shadow-[3px_3px_0px_var(--ink)] flex flex-wrap items-center gap-2"
        >
          <span className="font-mono text-xs font-bold uppercase text-neutral-600 px-2">
            Desks:
          </span>
          <Link to="/admin/facilities" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <Building2 size={12} /> Facilities & Slots
          </Link>
          <Link to="/admin/windows" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <CalendarDays size={12} /> Reg Windows
          </Link>
          <Link to="/admin/transfers" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <ArrowRightLeft size={12} /> Transfers Review
          </Link>
          <Link to="/admin/attendance" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <FileCheck2 size={12} /> Attendance Audit
          </Link>
          <Link to="/admin/absence" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <AlertTriangle size={12} className="text-[var(--oxblood)]" /> Absence Monitor
          </Link>
          <Link to="/admin/complaints" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <FolderSync size={12} /> Complaints Desk
          </Link>
          <Link to="/admin/imports" className="font-mono text-xs px-2.5 py-1 bg-white border border-[var(--ink)] hover:bg-[var(--card-paper)] transition-colors flex items-center gap-1">
            <FileSpreadsheet size={12} /> Bulk Import
          </Link>
        </nav>

        {/* Top 4 KPI Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            code="[KPI-01]"
            title="Campus Occupancy Rate"
            value="84.2%"
            subtitle="320 / 380 Total Slots Filled"
            trend={{ value: '4.8% vs last week', isPositive: true }}
            icon={TrendingUp}
            badgeStatus="ACTIVE"
            badgeText="HIGH OCCUPANCY"
            accentColor="var(--athletic-green)"
          />

          <MetricCard
            code="[KPI-02]"
            title="Today's Verified Check-ins"
            value="245"
            subtitle="Turnstile & Manual Admittances"
            trend={{ value: '18 more than yesterday', isPositive: true }}
            icon={FileCheck2}
            badgeStatus="PRESENT"
            badgeText="LIVE STREAM"
            accentColor="var(--athletic-green)"
          />

          <MetricCard
            code="[KPI-03]"
            title="High-Risk Absence Flags"
            value="14"
            subtitle="3 Absences (1 from Reclamation)"
            trend={{ value: '3 newly flagged today', isPositive: false }}
            icon={ShieldAlert}
            badgeStatus="ABSENT"
            badgeText="ACTION REQUIRED"
            accentColor="var(--oxblood)"
          />

          <MetricCard
            code="[KPI-04]"
            title="Pending Triage Queue"
            value="32"
            subtitle="23 Applications • 9 Transfers"
            trend={{ value: 'Avg response: 18 hrs', isPositive: true }}
            icon={ArrowRightLeft}
            badgeStatus="PENDING"
            badgeText="QUEUED"
            accentColor="var(--amber)"
          />
        </section>

        {/* Main Grid: Multi-Facility Occupancy Bars vs Live Urgent Operations Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Facility Capacities (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-black text-xl text-[var(--ink)] flex items-center gap-2">
                <Building2 size={20} className="text-[var(--athletic-green)]" />
                Active Campus Gym Facilities
              </h2>
              <Link to="/admin/facilities" className="font-mono text-xs text-[var(--ink)] font-bold hover:underline flex items-center gap-1">
                Configure All <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="space-y-4">
              {MOCK_FACILITIES.map((facility) => (
                <FacilityOccupancyBar
                  key={facility.id}
                  facility={facility}
                  onManageSlots={() => window.location.assign('/admin/facilities')}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Live Urgent Operations Stream (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-black text-xl text-[var(--ink)] flex items-center gap-2">
                <Flame size={20} className="text-[var(--oxblood)]" />
                Urgent Operations Triage
              </h2>
              <Badge status="LATE" className="font-mono text-[10px]">
                5 NOTICES
              </Badge>
            </div>

            <div className="p-4 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] space-y-3">
              {/* Alert Item 1 */}
              <div className="p-3 bg-red-50 border-2 border-[var(--oxblood)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-[var(--oxblood)] flex items-center gap-1">
                    <AlertTriangle size={13} /> Automated Slot Forfeiture Notice
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">10m ago</span>
                </div>
                <p className="font-sans text-xs text-[var(--ink)]">
                  Student <strong>AP22110010072</strong> missed 4th consecutive workout session. Slot marked for immediate waitlist reclamation.
                </p>
                <div className="pt-1 flex gap-2">
                  <Link to="/admin/absence">
                    <Button variant="outline" size="sm" className="font-mono text-[10px] py-0.5 border-[var(--oxblood)] text-[var(--oxblood)]">
                      Review Forfeiture →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Alert Item 2 */}
              <div className="p-3 bg-amber-50 border-2 border-[var(--amber)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-[var(--amber)] flex items-center gap-1">
                    <ArrowRightLeft size={13} /> Pending Slot Transfer Batch
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">42m ago</span>
                </div>
                <p className="font-sans text-xs text-[var(--ink)]">
                  9 students have requested transfers to Evening Slot B (06:00 PM – 07:00 PM). Target batch has 12 open spots.
                </p>
                <div className="pt-1 flex gap-2">
                  <Link to="/admin/transfers">
                    <Button variant="outline" size="sm" className="font-mono text-[10px] py-0.5 border-[var(--amber)] text-[var(--ink)]">
                      Triage Transfers →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Alert Item 3 */}
              <div className="p-3 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-[var(--ink)] flex items-center gap-1">
                    <CalendarDays size={13} /> Registration Window Closes in 48h
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">2h ago</span>
                </div>
                <p className="font-sans text-xs text-[var(--ink)]">
                  Fall 2026 Phase-1 Registration closes on Oct 30, 2026 at 23:59 IST. 60 waitlisted freshmen remaining.
                </p>
                <div className="pt-1 flex gap-2">
                  <Link to="/admin/windows">
                    <Button variant="outline" size="sm" className="font-mono text-[10px] py-0.5">
                      Adjust Window →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Export Reports Card */}
            <div className="p-4 bg-[var(--card-paper,#e8e5e0)] border-2 border-[var(--ink)] flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-[var(--ink)]">
                  Daily Attendance & Compliance CSV
                </h4>
                <p className="font-mono text-[11px] text-neutral-600">
                  Full campus snapshot across all 3 facilities.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Exporting campus daily report...')}
                className="gap-1 font-mono text-xs border-[var(--ink)] bg-white"
              >
                <Download size={13} /> Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

