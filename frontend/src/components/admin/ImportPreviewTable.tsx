import React, { useState } from 'react';
import { Badge } from '@/components/ui';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export interface ParsedImportRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface ImportPreviewTableProps {
  columns: { key: string; label: string }[];
  rows: ParsedImportRow[];
  importType: 'STUDENTS' | 'SLOTS';
  className?: string;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  columns,
  rows,
  className = '',
}) => {
  const [filterView, setFilterView] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  const filteredRows = rows.filter((r) => {
    if (filterView === 'VALID') return r.isValid;
    if (filterView === 'ERRORS') return !r.isValid;
    return true;
  });

  return (
    <div
      data-ui="import-preview-table-container"
      className={`bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] space-y-4 p-5 ${className}`}
    >
      {/* Top Summary & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-dashed border-neutral-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <span className="text-[var(--ink)]">Pre-Commit Validation:</span>
            <span className="text-neutral-600">{rows.length} Total Rows</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-[var(--athletic-green)] font-mono text-xs font-bold border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={13} /> {validCount} Ready
            </span>
            {errorCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-[var(--oxblood)] font-mono text-xs font-bold border border-red-300 flex items-center gap-1">
                <XCircle size={13} /> {errorCount} Format Violations
              </span>
            )}
          </div>
        </div>

        {/* Filter View Selector */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilterView('ALL')}
            className={`px-2.5 py-1 border-2 font-bold transition-all ${
              filterView === 'ALL'
                ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)]'
                : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
            }`}
          >
            All Rows ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('VALID')}
            className={`px-2.5 py-1 border-2 font-bold transition-all ${
              filterView === 'VALID'
                ? 'bg-[var(--ink)] text-[var(--parchment)] border-[var(--ink)]'
                : 'bg-white text-[var(--ink)] border-neutral-300 hover:border-[var(--ink)]'
            }`}
          >
            Valid Only ({validCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('ERRORS')}
            className={`px-2.5 py-1 border-2 font-bold transition-all ${
              filterView === 'ERRORS'
                ? 'bg-[var(--oxblood)] text-white border-[var(--oxblood)]'
                : 'bg-white text-[var(--oxblood)] border-neutral-300 hover:border-[var(--oxblood)]'
            }`}
          >
            Errors Only ({errorCount})
          </button>
        </div>
      </div>

      {/* Dense Table View */}
      <div className="overflow-x-auto border-2 border-[var(--ink)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--ledger-surface,#f4f2ee)] border-b-2 border-[var(--ink)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
              <th className="py-2.5 px-3 w-16 text-center">Row</th>
              <th className="py-2.5 px-3 w-28">Status</th>
              {columns.map((col) => (
                <th key={col.key} className="py-2.5 px-3">
                  {col.label}
                </th>
              ))}
              <th className="py-2.5 px-3">Diagnostics & Validation Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-xs font-mono">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 3}
                  className="py-8 text-center text-neutral-500 font-mono text-xs"
                >
                  No rows matching the current filter view.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.rowNumber}
                  className={`hover:bg-neutral-50 transition-colors ${
                    !row.isValid ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-bold text-neutral-500">
                    #{row.rowNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.isValid ? (
                      <Badge status="ACTIVE" className="font-mono text-[9px]">
                        VALID
                      </Badge>
                    ) : (
                      <Badge status="ABSENT" className="font-mono text-[9px]">
                        INVALID
                      </Badge>
                    )}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-2.5 px-3 text-[var(--ink)]">
                      {row.data[col.key] || '—'}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-[11px]">
                    {row.isValid ? (
                      <span className="text-[var(--athletic-green)] flex items-center gap-1 font-bold">
                        <CheckCircle2 size={12} /> Format checks passed
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        {row.errors.map((err, errIdx) => (
                          <div
                            key={errIdx}
                            className="text-[var(--oxblood)] flex items-center gap-1 font-bold"
                          >
                            <AlertTriangle size={11} className="shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

