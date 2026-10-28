import React, { useState } from 'react';
import { CameraDevice } from 'html5-qrcode';
import { Button, Badge } from '@/components/ui';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  VideoOff,
  Sparkles,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react';

export interface CameraViewportProps {
  elementId: string;
  isScanning: boolean;
  hasPermission: boolean | null;
  errorMessage: string | null;
  devices: CameraDevice[];
  selectedDeviceId: string;
  isTorchOn: boolean;
  isTorchSupported: boolean;
  onStart: (deviceId?: string) => void;
  onStop: () => void;
  onToggleTorch: () => void;
  onSelectDevice: (deviceId: string) => void;
  onSimulateScan: (payloadJson: string) => void;
  className?: string;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({
  elementId,
  isScanning,
  hasPermission,
  errorMessage,
  devices,
  selectedDeviceId,
  isTorchOn,
  isTorchSupported,
  onStart,
  onStop,
  onToggleTorch,
  onSelectDevice,
  onSimulateScan,
  className = '',
}) => {
  const [customJson, setCustomJson] = useState('');
  const [showSimulateDrawer, setShowSimulateDrawer] = useState(false);

  // Preset simulation payloads for turnstile testing
  const presets = [
    {
      label: 'Valid Check-in (Aarav Raj)',
      desc: 'Matches today 06:00 AM slot',
      color: 'var(--athletic-green, #2e4a3e)',
      payload: JSON.stringify({
        student_ap_number: 'AP22110010045',
        college_email: 'aarav_raj@srmap.edu.in',
        session_date: new Date().toISOString().split('T')[0],
        slot_timing: '06:00 AM - 07:00 AM',
      }),
    },
    {
      label: 'Wrong Slot Timing (Priya Sharma)',
      desc: 'Allocated for 05:00 PM evening slot',
      color: 'var(--oxblood, #9e2a2b)',
      payload: JSON.stringify({
        student_ap_number: 'AP22110010088',
        college_email: 'priya_sharma@srmap.edu.in',
        session_date: new Date().toISOString().split('T')[0],
        slot_timing: '05:00 PM - 06:00 PM',
      }),
    },
    {
      label: 'Duplicate Scan (Rohan Mehta)',
      desc: 'Scanned 12 minutes ago already',
      color: 'var(--amber, #b57614)',
      payload: JSON.stringify({
        student_ap_number: 'AP22110010012',
        college_email: 'rohan_m@srmap.edu.in',
        session_date: new Date().toISOString().split('T')[0],
        slot_timing: '06:00 AM - 07:00 AM',
      }),
    },
    {
      label: 'Unregistered Student (Unknown AP)',
      desc: 'Not in university roster',
      color: 'var(--ink, #1c1b1a)',
      payload: JSON.stringify({
        student_ap_number: 'AP99999999999',
        college_email: 'unknown_student@srmap.edu.in',
        session_date: new Date().toISOString().split('T')[0],
        slot_timing: '06:00 AM - 07:00 AM',
      }),
    },
  ];

  return (
    <div
      data-ui="camera-viewport-container"
      className={`relative flex flex-col ${className}`}
      style={{
        backgroundColor: 'var(--card-paper, #e8e5e0)',
        border: '3px solid var(--ink)',
        boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
      }}
    >
      {/* Viewport Top Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b-2 border-[var(--ink)] bg-[var(--parchment,#fbfaf8)]"
      >
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-[var(--athletic-green)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Turnstile Optical Scanner • Feed #01
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isScanning ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[var(--athletic-green)] text-[var(--parchment)]">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[var(--ledger-surface)] text-[var(--ink)] border border-[var(--ink)]">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Camera Live View Screen */}
      <div
        className="relative overflow-hidden flex items-center justify-center bg-black min-h-[340px]"
        style={{ minHeight: '340px' }}
      >
        {/* html5-qrcode video element target */}
        <div
          id={elementId}
          className="w-full h-full flex items-center justify-center"
          style={{ minHeight: '340px' }}
        />

        {/* Viewfinder Overlay Crosshairs & Corner Brackets */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="relative w-64 h-64 border-2 border-dashed border-emerald-400/60"
            style={{
              boxShadow: isScanning ? '0 0 0 9999px rgba(0, 0, 0, 0.45)' : 'none',
            }}
          >
            {/* 4 Corner tick brackets */}
            <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
            <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
            <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />

            {/* Scanning beam */}
            {isScanning && (
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399]"
                style={{
                  animation: 'scannerSweep 2.2s ease-in-out infinite alternate',
                }}
              />
            )}

            {/* Instruction tag */}
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="bg-black/80 px-2 py-1 text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-300 border border-emerald-500/50">
                ALIGN STUDENT QR CODE INSIDE FRAME
              </span>
            </div>
          </div>
        </div>

        {/* Standby / Error Overlay if not scanning */}
        {!isScanning && (
          <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center text-center p-6 text-[var(--parchment)] z-10">
            <VideoOff size={42} className="text-neutral-400 mb-3" />
            <h4 className="font-serif font-bold text-lg text-white mb-1">
              Optical Feed Paused / Off
            </h4>
            <p className="font-mono text-xs text-neutral-300 max-w-sm mb-4">
              {errorMessage || 'Click Start Camera to activate the turnstile optical scanner, or use the Simulator below.'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => onStart(selectedDeviceId)}
                className="gap-2 font-mono text-xs"
              >
                <Play size={14} /> START SCANNER
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Viewport Control Strip */}
      <div className="p-3 border-t-2 border-[var(--ink)] bg-[var(--ledger-surface,#f4f2ee)] flex flex-wrap items-center justify-between gap-3">
        {/* Device Switcher */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="font-mono text-[11px] font-bold uppercase text-[var(--ink)]">
            Camera:
          </span>
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              onSelectDevice(e.target.value);
              if (isScanning) {
                onStart(e.target.value);
              }
            }}
            className="flex-1 px-2 py-1 text-xs font-mono bg-white border-2 border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--athletic-green)]"
          >
            {devices.length > 0 ? (
              devices.map((d, idx) => (
                <option key={d.id} value={d.id}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))
            ) : (
              <option value="">No Camera Detected (Simulation Ready)</option>
            )}
          </select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isTorchSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTorch}
              className="gap-1 font-mono text-xs"
              title="Toggle Torch/Flash"
            >
              {isTorchOn ? <FlashlightOff size={14} /> : <Flashlight size={14} />}
              {isTorchOn ? 'Torch On' : 'Torch'}
            </Button>
          )}

          {isScanning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              className="gap-1 font-mono text-xs border-[var(--oxblood)] text-[var(--oxblood)]"
            >
              <Square size={13} /> Stop
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStart(selectedDeviceId)}
              className="gap-1 font-mono text-xs"
            >
              <RefreshCw size={13} /> Reconnect
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSimulateDrawer(!showSimulateDrawer)}
            className="gap-1.5 font-mono text-xs bg-amber-50 border-[var(--amber)] text-[var(--ink)]"
          >
            <Sparkles size={13} className="text-[var(--amber)]" />
            {showSimulateDrawer ? 'Hide Simulator' : 'Test Scans'}
          </Button>
        </div>
      </div>

      {/* Permission warning banner if permission denied */}
      {hasPermission === false && (
        <div className="px-4 py-2 bg-amber-50 border-t-2 border-[var(--amber)] flex items-center gap-2 text-xs font-mono text-[var(--ink)]">
          <AlertTriangle size={14} className="text-[var(--amber)] shrink-0" />
          <span>Camera stream restricted. You can test full turnstile flows using the Test Scans below.</span>
        </div>
      )}

      {/* Quick Test / Simulation Drawer */}
      {showSimulateDrawer && (
        <div
          data-ui="scanner-simulator-drawer"
          className="p-4 border-t-2 border-[var(--ink)] bg-[var(--parchment)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h5 className="font-serif font-bold text-sm text-[var(--ink)]">
              Simulated Optical Feeder (Desk Turnstile Testing)
            </h5>
            <Badge status="NEUTRAL" className="font-mono text-[10px]">
              DEV TOOL
            </Badge>
          </div>
          <p className="font-mono text-xs text-neutral-600">
            Click any student badge below to instantaneously feed the optical decoder with the exact QR payload contract:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSimulateScan(preset.payload)}
                className="text-left p-2.5 bg-white border-2 border-[var(--ink)] hover:bg-[var(--ledger-surface)] transition-colors"
                style={{
                  borderLeftWidth: '6px',
                  borderLeftColor: preset.color,
                }}
              >
                <div className="font-mono text-xs font-bold text-[var(--ink)]">
                  {preset.label}
                </div>
                <div className="font-sans text-[11px] text-neutral-600">
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Raw JSON Input */}
          <div className="pt-2 border-t border-dashed border-[var(--ink)] flex gap-2">
            <input
              type="text"
              placeholder='Raw QR JSON e.g. {"student_ap_number":"AP22110010045",...}'
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              className="flex-1 px-3 py-1.5 font-mono text-xs bg-white border-2 border-[var(--ink)] focus:outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (customJson.trim()) {
                  onSimulateScan(customJson.trim());
                  setCustomJson('');
                }
              }}
              disabled={!customJson.trim()}
              className="font-mono text-xs shrink-0"
            >
              Inject Scan
            </Button>
          </div>
        </div>
      )}

      {/* Global CSS for Scanner Sweep animation */}
      <style>{`
        @keyframes scannerSweep {
          0% { top: 4px; }
          100% { top: calc(100% - 8px); }
        }
      `}</style>
    </div>
  );
};
