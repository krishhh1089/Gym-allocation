import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import {
  ImportPreviewTable,
  ParsedImportRow,
} from '@/components/admin/ImportPreviewTable';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ArrowLeft,
  Users,
  Building2,
  History,
  FileCheck,
} from 'lucide-react';

interface ImportAuditRecord {
  id: string;
  filename: string;
  importType: 'STUDENTS' | 'SLOTS';
  importedAt: string;
  totalRecords: number;
  successfulRecords: number;
  adminName: string;
}

const SAMPLE_STUDENT_PREVIEW_DATA: ParsedImportRow[] = [
  {
    rowNumber: 2,
    data: {
      ap_number: 'AP22110010045',
      full_name: 'Aarav Raj',
      college_email: 'aarav_raj@srmap.edu.in',
      department: 'Computer Science & Engineering',
      batch: '2022-2026',
      facility: 'Ramapuram Central Gymnasium',
      slot_timing: '06:00 AM – 07:00 AM',
    },
    isValid: true,
    errors: [],
  },
  {
    rowNumber: 3,
    data: {
      ap_number: 'AP22110010012',
      full_name: 'Rohan Mehta',
      college_email: 'rohan_m@srmap.edu.in',
      department: 'Mechanical Engineering',
      batch: '2023-2027',
      facility: 'Ramapuram Central Gymnasium',
      slot_timing: '06:00 AM – 07:00 AM',
    },
    isValid: true,
    errors: [],
  },
  {
    rowNumber: 4,
    data: {
      ap_number: 'AP2211099', // Invalid short AP
      full_name: 'Kunal Verma',
      college_email: 'kunal_v@gmail.com', // Invalid domain
      department: 'Electrical Engineering',
      batch: '2022-2026',
      facility: 'Ramapuram Central Gymnasium',
      slot_timing: '07:00 AM – 08:00 AM',
    },
    isValid: false,
    errors: [
      'Malformed AP Number: expected AP followed by 11 digits (found AP2211099)',
      'Domain restriction: only @srmap.edu.in college emails permitted',
    ],
  },
  {
    rowNumber: 5,
    data: {
      ap_number: 'AP22110010088',
      full_name: 'Priya Sharma',
      college_email: 'priya_sharma@srmap.edu.in',
      department: 'Electronics & Communication',
      batch: '2022-2026',
      facility: 'Ramapuram Central Gymnasium',
      slot_timing: '05:00 PM – 06:00 PM',
    },
    isValid: true,
    errors: [],
  },
  {
    rowNumber: 6,
    data: {
      ap_number: 'AP22110010142',
      full_name: '', // Missing name
      college_email: 'unknown@srmap.edu.in',
      department: 'Civil Engineering',
      batch: '2021-2025',
      facility: 'Unknown Gymnasium Hall Z', // Invalid facility
      slot_timing: '06:00 AM – 07:00 AM',
    },
    isValid: false,
    errors: [
      'Missing required field: student full name',
      'Unrecognized facility: Unknown Gymnasium Hall Z',
    ],
  },
];

const STUDENT_COLUMNS = [
  { key: 'ap_number', label: 'Student AP Number' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'college_email', label: 'College Email' },
  { key: 'department', label: 'Department' },
  { key: 'batch', label: 'Batch' },
  { key: 'facility', label: 'Assigned Gym' },
  { key: 'slot_timing', label: 'Slot Timing' },
];

export const BulkImportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [importType, setImportType] = useState<'STUDENTS' | 'SLOTS'>('STUDENTS');
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [previewRows] = useState<ParsedImportRow[]>(SAMPLE_STUDENT_PREVIEW_DATA);
  const [isCommitting, setIsCommitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [importHistory, setImportHistory] = useState<ImportAuditRecord[]>([
    {
      id: 'imp_001',
      filename: 'freshmen_cse_2026_allocations.xlsx',
      importType: 'STUDENTS',
      importedAt: '2026-10-25 14:32 IST',
      totalRecords: 120,
      successfulRecords: 118,
      adminName: 'Dr. K. Sharma',
    },
    {
      id: 'imp_002',
      filename: 'evening_power_lifting_slots.csv',
      importType: 'SLOTS',
      importedAt: '2026-10-22 10:15 IST',
      totalRecords: 8,
      successfulRecords: 8,
      adminName: 'Dr. K. Sharma',
    },
  ]);

  const handleDownloadTemplate = () => {
    const csvContent =
      importType === 'STUDENTS'
        ? 'ap_number,full_name,college_email,department,batch,facility,slot_timing\nAP22110010045,Aarav Raj,aarav_raj@srmap.edu.in,Computer Science & Engineering,2022-2026,Ramapuram Central Gymnasium,06:00 AM – 07:00 AM\nAP22110010012,Rohan Mehta,rohan_m@srmap.edu.in,Mechanical Engineering,2023-2027,Ramapuram Central Gymnasium,06:00 AM – 07:00 AM'
        : 'facility_name,batch_name,start_time,end_time,recurrence_days,capacity,gender_policy,trainer_name\nRamapuram Central Gymnasium,Morning Batch Alpha,06:00,07:00,"Mon,Tue,Wed,Thu,Fri",45,COED,Coach Rajesh Kumar';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_${importType.toLowerCase()}_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileUploaded(file);
      setNotification(`File "${file.name}" loaded for dry-run parsing.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileUploaded(file);
      setNotification(`File "${file.name}" loaded for dry-run parsing.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleCommitImport = () => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid records found to import.');
      return;
    }

    setIsCommitting(true);
    setTimeout(() => {
      setIsCommitting(false);
      const newAudit: ImportAuditRecord = {
        id: `imp_${Date.now()}`,
        filename: fileUploaded?.name || 'manual_batch_upload.xlsx',
        importType,
        importedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST',
        totalRecords: previewRows.length,
        successfulRecords: validRows.length,
        adminName: user?.full_name || 'Dr. K. Sharma',
      };

      setImportHistory([newAudit, ...importHistory]);
      setNotification(
        `Successfully committed ${validRows.length} valid ${importType.toLowerCase()} records into the master database. 2 invalid records skipped.`
      );
      setFileUploaded(null);
      setTimeout(() => setNotification(null), 6000);
    }, 1500);
  };

  return (
    <div
      data-ui="admin-bulk-import-page"
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
            <Link to="/admin/reports">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Analytics & Reports Export →
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Header */}
        <header className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                Campus Data Operations • Bulk Ingestion Wizard
              </span>
              <Badge status="ACTIVE" className="font-mono text-[10px]">
                TRANSACTIONAL DRY-RUN SAFE
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Excel & CSV Bulk Ingestion Hub
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Bulk provision hundreds of student gym allocations or initialize campus slot recurrence matrices in a single dry-run audited batch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 font-mono text-xs border-[var(--ink)]"
            >
              <Download size={14} /> Download Sample Template (.CSV)
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

        {/* Import Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setImportType('STUDENTS')}
            className={`p-4 border-3 text-left transition-all ${
              importType === 'STUDENTS'
                ? 'bg-white border-[var(--athletic-green)] shadow-[4px_4px_0px_var(--athletic-green)]'
                : 'bg-[var(--card-paper,#e8e5e0)] border-[var(--ink)] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 font-serif font-black text-lg text-[var(--ink)]">
              <Users size={20} className="text-[var(--athletic-green)]" />
              1. Student Allocations Ingestion
            </div>
            <p className="font-mono text-xs text-neutral-600">
              Bulk map students by AP number to gym facilities and active session timings.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setImportType('SLOTS')}
            className={`p-4 border-3 text-left transition-all ${
              importType === 'SLOTS'
                ? 'bg-white border-[var(--athletic-green)] shadow-[4px_4px_0px_var(--athletic-green)]'
                : 'bg-[var(--card-paper,#e8e5e0)] border-[var(--ink)] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 font-serif font-black text-lg text-[var(--ink)]">
              <Building2 size={20} className="text-[var(--athletic-green)]" />
              2. Facility Slot Batches Ingestion
            </div>
            <p className="font-mono text-xs text-neutral-600">
              Bulk generate recurring workout slots with days, capacities, and admission policies.
            </p>
          </button>
        </div>

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="p-8 bg-white border-3 border-dashed border-[var(--ink)] text-center flex flex-col items-center justify-center space-y-3 shadow-[4px_4px_0px_var(--ink)]"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--parchment,#fbfaf8)] border-2 border-[var(--ink)] flex items-center justify-center">
            <UploadCloud size={30} className="text-[var(--athletic-green)]" />
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
              Drag and drop your spreadsheet here
            </h3>
            <p className="font-mono text-xs text-neutral-600 mt-0.5">
              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong> files (up to 15MB).
            </p>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="px-4 py-2 font-mono text-xs font-bold uppercase bg-[var(--ledger-surface,#f4f2ee)] border-2 border-[var(--ink)] hover:bg-[var(--parchment)] transition-colors inline-block shadow-[2px_2px_0px_var(--ink)]">
              Browse Local File
            </span>
          </label>

          {fileUploaded && (
            <div className="p-2.5 bg-emerald-50 border border-[var(--athletic-green)] text-[var(--athletic-green)] font-mono text-xs flex items-center gap-2">
              <FileSpreadsheet size={15} />
              <span>Loaded: <strong>{fileUploaded.name}</strong> ({(fileUploaded.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Pre-Commit Dry-Run Preview Table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-black text-xl text-[var(--ink)] flex items-center gap-2">
                <FileCheck size={20} className="text-[var(--athletic-green)]" />
                Dry-Run Validation Ledger (Preview Before Write)
              </h2>
              <p className="font-mono text-xs text-neutral-600">
                Pydantic v2 validation engine preview. Malformed AP numbers, unregistered domains, or missing fields are flagged in red.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleCommitImport}
              disabled={isCommitting}
              className="font-mono text-xs gap-1.5 bg-[var(--athletic-green)]"
            >
              <CheckCircle2 size={14} />
              {isCommitting ? 'Committing Batch...' : 'Commit Valid Records to Database'}
            </Button>
          </div>

          <ImportPreviewTable
            columns={STUDENT_COLUMNS}
            rows={previewRows}
            importType={importType}
          />
        </section>

        {/* Historical Batch Ingestion Audit Log */}
        <section className="bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] overflow-hidden">
          <div className="p-4 bg-[var(--ledger-surface,#f4f2ee)] border-b-2 border-[var(--ink)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-neutral-600" />
              <h3 className="font-serif font-bold text-base text-[var(--ink)]">
                Recent Ingestion Audit Log
              </h3>
            </div>
            <Badge status="NEUTRAL" className="font-mono text-[10px]">
              {importHistory.length} RUNS RECORDED
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[var(--parchment,#fbfaf8)] border-b border-neutral-300 text-[11px] font-bold uppercase text-neutral-600">
                  <th className="py-2.5 px-4">Batch ID & File</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Execution Time</th>
                  <th className="py-2.5 px-4">Results</th>
                  <th className="py-2.5 px-4 text-right">Supervised By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {importHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-[var(--ink)]">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-[var(--athletic-green)]" />
                        {item.filename}
                      </div>
                      <span className="text-[10px] text-neutral-500">{item.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status="NEUTRAL" className="font-mono text-[10px]">
                        {item.importType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{item.importedAt}</td>
                    <td className="py-3 px-4">
                      <span className="text-[var(--athletic-green)] font-bold">
                        {item.successfulRecords}
                      </span>{' '}
                      / {item.totalRecords} Records Written
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600 font-bold">
                      {item.adminName}
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
