import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Download,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const ReportsExportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [reportType, setReportType] = useState<'ATTENDANCE' | 'OCCUPANCY' | 'ABSENCE' | 'WAITLIST'>('ATTENDANCE');
  const [dateRange, setDateRange] = useState('CURRENT_MONTH');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [exportFormat, setExportFormat] = useState<'CSV' | 'XLSX'>('CSV');
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamic preview column headers based on report type
  const reportConfigs = {
    ATTENDANCE: {
      title: 'Daily Turnstile Attendance & Verification Audit Log',
      filename: 'srmap_gym_attendance_audit',
      headers: ['Student AP', 'Full Name', 'Department', 'Session Date', 'Time Window', 'Turnstile Status', 'Verification Method'],
      previewData: [
        { col1: 'AP22110010045', col2: 'Aarav Raj', col3: 'Computer Science', col4: '2026-10-28', col5: '06:00 AM – 07:00 AM', col6: 'PRESENT', col7: 'Optical QR Turnstile' },
        { col1: 'AP22110010012', col2: 'Rohan Mehta', col3: 'Mechanical Eng', col4: '2026-10-28', col5: '06:00 AM – 07:00 AM', col6: 'PRESENT', col7: 'Optical QR Turnstile' },
        { col1: 'AP22110010019', col2: 'Sneha Reddy', col3: 'Biotechnology', col4: '2026-10-28', col5: '06:00 AM – 07:00 AM', col6: 'PRESENT', col7: 'Optical QR Turnstile' },
        { col1: 'AP22110010088', col2: 'Priya Sharma', col3: 'ECE', col4: '2026-10-27', col5: '05:00 PM – 06:00 PM', col6: 'ABSENT', col7: 'Unexcused' },
        { col1: 'AP22110010023', col2: 'Devansh Joshi', col3: 'Electrical Eng', col4: '2026-10-27', col5: '06:00 AM – 07:00 AM', col6: 'EXCUSED', col7: 'Medical Exemption (Dr. Rao)' },
      ],
    },
    OCCUPANCY: {
      title: 'Facility Capacity Utilization & Yield Efficiency Report',
      filename: 'srmap_facility_utilization_report',
      headers: ['Facility Name', 'Slot Batch', 'Time Window', 'Max Capacity', 'Allocated Count', 'Actual Check-ins', 'Utilization Yield'],
      previewData: [
        { col1: 'Central Gymnasium', col2: 'Morning Batch Alpha', col3: '06:00 – 07:00', col4: '45', col5: '45', col6: '41', col7: '91.1%' },
        { col1: 'Central Gymnasium', col2: 'Morning Batch Bravo', col3: '07:00 – 08:00', col4: '45', col5: '45', col6: '38', col7: '84.4%' },
        { col1: 'Central Gymnasium', col2: 'Evening Women Strength', col3: '17:00 – 18:00', col4: '35', col5: '35', col6: '31', col7: '88.6%' },
        { col1: 'Indoor Sports Complex', col2: 'Olympic Power Lifting', col3: '06:30 – 08:00', col4: '30', col5: '30', col6: '28', col7: '93.3%' },
        { col1: 'Ananda Nilayam Studio', col2: 'Cardio & Mobility Batch', col3: '06:30 – 07:30', col4: '25', col5: '22', col6: '19', col7: '86.4%' },
      ],
    },
    ABSENCE: {
      title: 'High-Risk Absence & Automated Slot Reclamation Register',
      filename: 'srmap_absence_reclamation_register',
      headers: ['Student AP', 'Full Name', 'Department', 'Slot Allocated', 'Consecutive Absences', 'Risk Level', 'Action Taken'],
      previewData: [
        { col1: 'AP22110010072', col2: 'Tanvi Joshi', col3: 'Biotechnology', col4: '06:00 AM – 07:00 AM', col5: '4', col6: 'FORFEITED', col7: 'Slot Reclaimed & Released to Waitlist' },
        { col1: 'AP22110010055', col2: 'Harish Kalyan', col3: 'Mechanical Eng', col4: '07:00 AM – 08:00 AM', col5: '3', col6: 'CRITICAL', col7: 'Formal Warning Notice Sent' },
        { col1: 'AP22110010119', col2: 'Abhishek Roy', col3: 'Computer Science', col4: '06:30 AM – 08:00 AM', col5: '3', col6: 'CRITICAL', col7: 'Formal Warning Notice Sent' },
        { col1: 'AP22110010088', col2: 'Priya Sharma', col3: 'ECE', col4: '05:00 PM – 06:00 PM', col5: '2', col6: 'WARNING', col7: 'Monitoring' },
        { col1: 'AP22110010041', col2: 'Deepika Nair', col3: 'Civil Eng', col4: '05:00 PM – 06:00 PM', col5: '2', col6: 'WARNING', col7: 'Monitoring' },
      ],
    },
    WAITLIST: {
      title: 'Waitlist Velocity & Slot Transfer Flow Summary',
      filename: 'srmap_waitlist_transfer_summary',
      headers: ['Student AP', 'Full Name', 'Current Slot', 'Target Requested Slot', 'Application Date', 'Waitlist Rank', 'Triage Status'],
      previewData: [
        { col1: 'AP22110010199', col2: 'Vikramaditya Rao', col3: 'Unassigned', col4: 'Central Gym (06:00 AM)', col5: '2026-10-21', col6: '#1', col7: 'Promoted to Active Slot' },
        { col1: 'AP22110010103', col2: 'Manish Tiwari', col3: 'Central Gym (07:00 AM)', col4: 'Central Gym (06:00 AM)', col5: '2026-10-24', col6: '#2', col7: 'Pending Review' },
        { col1: 'AP22110010077', col2: 'Kavita Pillai', col3: 'Unassigned', col4: 'Central Gym (06:00 AM)', col5: '2026-10-22', col6: 'Awarded', col7: 'Allocated' },
      ],
    },
  }[reportType];

  const handleExecuteExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);

      // Build clean CSV string
      const csvHeader = reportConfigs.headers.join(',');
      const csvRows = reportConfigs.previewData.map((row) =>
        [row.col1, `"${row.col2}"`, `"${row.col3}"`, `"${row.col4}"`, `"${row.col5}"`, `"${row.col6}"`, `"${row.col7}"`].join(',')
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + [csvHeader, ...csvRows].join('\n');
      const encodedUri = encodeURI(csvContent);

      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `${reportConfigs.filename}_${dateRange.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification(`Report "${reportConfigs.title}" downloaded successfully as .${exportFormat}.`);
      setTimeout(() => setNotification(null), 4000);
    }, 900);
  };

  return (
    <div
      data-ui="admin-reports-export-page"
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
            <Link to="/admin/imports">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Bulk Excel Ingestion →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Directorate Sports Council • Institutional Compliance & Analytics
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                OFFICIAL REPORT GENERATOR
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Analytics & Compliance Report Center
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Export campus turnstile attendance ledgers, facility efficiency yields, absence reclamation statistics, and waitlist flows in standard CSV and Excel formats. • Generated for: <strong>{user?.full_name || 'Dr. K. Sharma'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="gap-1.5 font-mono text-xs bg-[var(--athletic-green)]"
            >
              <Download size={14} />
              {isExporting ? 'Generating Report...' : `Export Clean .${exportFormat}`}
            </Button>
          </div>
        </header>

        {/* Notification Banner */}
        {notification && (
          <div className="p-3 bg-emerald-50 border-2 border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_var(--athletic-green)]">
            <CheckCircle2 size={15} />
            <span>{notification}</span>
          </div>
        )}

        {/* Filter & Report Selection Matrix */}
        <div className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4">
          <h3 className="font-serif font-bold text-lg text-[var(--ink)] pb-2 border-b-2 border-dashed border-neutral-300">
            Report Parameters & Data Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
            {/* Report Type */}
            <div>
              <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                Report Dataset:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as typeof reportType)}
                className="w-full px-3 py-2 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
              >
                <option value="ATTENDANCE">Daily Attendance & Audit Ledger</option>
                <option value="OCCUPANCY">Facility Capacity & Yield Report</option>
                <option value="ABSENCE">Absence & Slot Reclamation Log</option>
                <option value="WAITLIST">Waitlist & Slot Transfer Flow</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                Calendar Range:
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
              >
                <option value="TODAY">Today (Live Shift)</option>
                <option value="PAST_7_DAYS">Past 7 Days</option>
                <option value="CURRENT_MONTH">Current Academic Month</option>
                <option value="FULL_SEMESTER">Full Fall 2026 Semester</option>
              </select>
            </div>

            {/* Facility Filter */}
            <div>
              <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                Campus Facility:
              </label>
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] focus:outline-none"
              >
                <option value="ALL">All Facilities (Consolidated)</option>
                <option value="CENTRAL">Ramapuram Central Gymnasium</option>
                <option value="INDOOR">Indoor Sports Complex Hall A</option>
                <option value="STUDIO">Ananda Nilayam Studio</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block font-bold text-neutral-700 uppercase text-[10px] mb-1">
                File Output Format:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('CSV')}
                  className={`flex-1 py-2 border-2 font-bold transition-all ${
                    exportFormat === 'CSV'
                      ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]'
                      : 'bg-white text-[var(--ink)] border-neutral-300'
                  }`}
                >
                  .CSV
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('XLSX')}
                  className={`flex-1 py-2 border-2 font-bold transition-all ${
                    exportFormat === 'XLSX'
                      ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]'
                      : 'bg-white text-[var(--ink)] border-neutral-300'
                  }`}
                >
                  .XLSX (Excel)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Report Preview Table */}
        <section className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] overflow-hidden space-y-3 p-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-neutral-300">
            <div>
              <h3 className="font-serif font-black text-lg text-[var(--ink)]">
                {reportConfigs.title}
              </h3>
              <p className="font-mono text-xs text-neutral-500">
                Displaying first 5 representative rows formatted for export.
              </p>
            </div>
            <Badge status="ACTIVE" className="font-mono text-[10px]">
              PREVIEW READY
            </Badge>
          </div>

          <div className="overflow-x-auto border-2 border-[var(--ink)]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[var(--ledger-surface,#f4f2ee)] border-b-2 border-[var(--ink)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
                  {reportConfigs.headers.map((h, idx) => (
                    <th key={idx} className="py-2.5 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reportConfigs.previewData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3 font-bold text-[var(--ink)]">{row.col1}</td>
                    <td className="py-2.5 px-3 font-serif font-bold text-[var(--ink)]">{row.col2}</td>
                    <td className="py-2.5 px-3 text-neutral-600">{row.col3}</td>
                    <td className="py-2.5 px-3 text-neutral-700">{row.col4}</td>
                    <td className="py-2.5 px-3 text-neutral-700">{row.col5}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 font-bold uppercase text-[10px]">
                        {row.col6}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600">{row.col7}</td>
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
