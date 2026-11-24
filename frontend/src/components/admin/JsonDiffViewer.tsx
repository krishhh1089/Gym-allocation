import React, { useState } from 'react';
import { Badge } from '@/components/ui';
import { ChevronDown, ChevronRight, FileCode, Copy, Check } from 'lucide-react';

export interface JsonDiffViewerProps {
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  correlationId?: string;
  eventName?: string;
  className?: string;
}

export const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({
  beforeState,
  afterState,
  correlationId,
  eventName,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const beforeJson = JSON.stringify(beforeState, null, 2);
  const afterJson = JSON.stringify(afterState, null, 2);

  const handleCopyDiff = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = JSON.stringify({ correlation_id: correlationId, event: eventName, before: beforeState, after: afterState }, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-ui="json-diff-viewer"
      className={`border-2 border-[var(--ink)] bg-[var(--card-paper,#e8e5e0)] ${className}`}
    >
      {/* Header bar / Click to expand */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-[var(--parchment,#fbfaf8)] flex items-center justify-between cursor-pointer hover:bg-white transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <FileCode size={15} className="text-[var(--athletic-green)]" />
          <span className="font-mono text-xs font-bold text-[var(--ink)]">
            Audit State Delta Inspector
          </span>
          {eventName && (
            <Badge status="NEUTRAL" className="font-mono text-[9px]">
              {eventName}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {correlationId && (
            <span className="font-mono text-[10px] text-neutral-500">
              CID: <code>{correlationId}</code>
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyDiff}
            className="font-mono text-[10px] px-2 py-0.5 border border-neutral-400 bg-white hover:bg-neutral-100 flex items-center gap-1"
            title="Copy Raw Delta JSON"
          >
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Expanded Split Diff View */}
      {isOpen && (
        <div className="p-4 border-t-2 border-[var(--ink)] bg-white space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Before State */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--oxblood)] px-1">
                <span>− BEFORE STATE (Previous)</span>
                <span className="text-[10px] text-neutral-500">{Object.keys(beforeState).length} keys</span>
              </div>
              <pre className="p-3 bg-red-50/70 border border-red-200 text-red-950 rounded-none overflow-x-auto text-[11px] max-h-60 leading-relaxed">
                {beforeJson}
              </pre>
            </div>

            {/* After State */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--athletic-green)] px-1">
                <span>+ AFTER STATE (Persisted)</span>
                <span className="text-[10px] text-neutral-500">{Object.keys(afterState).length} keys</span>
              </div>
              <pre className="p-3 bg-emerald-50/70 border border-emerald-200 text-emerald-950 rounded-none overflow-x-auto text-[11px] max-h-60 leading-relaxed">
                {afterJson}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

