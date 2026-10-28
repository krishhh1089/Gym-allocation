import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CameraViewport } from '@/components/scanner/CameraViewport';
import {
  VerificationCard,
  VerificationStatus,
  VerifiedStudentData,
} from '@/components/scanner/VerificationCard';
import { useQRScanner } from '@/hooks/useQRScanner';
import { useAuthStore } from '@/stores/useAuthStore';
import { Badge, Button } from '@/components/ui';
import {
  Users,
  Search,
  ClipboardList,
  Clock,
  Building,
  Volume2,
  VolumeX,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface ScanHistoryItem {
  id: string;
  timestamp: string;
  ap_number: string;
  full_name: string;
  status: VerificationStatus;
  slot_timing: string;
}

export const QRScannerPage: React.FC = () => {
  const { user } = useAuthStore();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('IDLE');
  const [activeStudent, setActiveStudent] = useState<VerifiedStudentData | null>(null);
  const [rawScannedText, setRawScannedText] = useState<string>('');
  const [admittedCount, setAdmittedCount] = useState(38);
  const maxCapacity = 50;

  // History log of scans during this desk shift
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([
    {
      id: 'scan_001',
      timestamp: '06:14:02 AM',
      ap_number: 'AP22110010012',
      full_name: 'Rohan Mehta',
      status: 'VERIFIED',
      slot_timing: '06:00 AM - 07:00 AM',
    },
    {
      id: 'scan_002',
      timestamp: '06:11:45 AM',
      ap_number: 'AP22110010019',
      full_name: 'Sneha Reddy',
      status: 'VERIFIED',
      slot_timing: '06:00 AM - 07:00 AM',
    },
    {
      id: 'scan_003',
      timestamp: '06:08:19 AM',
      ap_number: 'AP22110010077',
      full_name: 'Kavita Pillai',
      status: 'VERIFIED',
      slot_timing: '06:00 AM - 07:00 AM',
    },
    {
      id: 'scan_004',
      timestamp: '06:05:33 AM',
      ap_number: 'AP22110010088',
      full_name: 'Priya Sharma',
      status: 'WRONG_SLOT',
      slot_timing: '05:00 PM - 06:00 PM',
    },
  ]);

  // Audio tone generator using Web Audio API
  const playAudioCue = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio cue failed:', e);
    }
  }, [audioEnabled]);

  // Process and decode student QR payload
  const handleDecodePayload = useCallback((payloadText: string) => {
    setRawScannedText(payloadText);
    try {
      const parsed = JSON.parse(payloadText);
      const { student_ap_number, college_email, session_date, slot_timing } = parsed;

      if (!student_ap_number) {
        setVerificationStatus('INVALID_CREDENTIALS');
        playAudioCue('error');
        return;
      }

      // Check duplicate scan against current admitted list
      if (student_ap_number === 'AP22110010012') {
        setVerificationStatus('DUPLICATE');
        setActiveStudent({
          ap_number: student_ap_number,
          full_name: 'Rohan Mehta',
          college_email: college_email || 'rohan_m@srmap.edu.in',
          department: 'Mechanical Engineering',
          batch: '2023-2027',
          facility_name: 'Ramapuram Central Fitness Center',
          slot_timing: slot_timing || '06:00 AM - 07:00 AM',
          session_date: session_date || new Date().toISOString().split('T')[0],
          allocated_slot_timing: '06:00 AM - 07:00 AM',
          allocated_facility: 'Ramapuram Central Fitness Center',
          is_active_allocation: true,
          already_checked_in_at: '06:14 AM',
        });
        playAudioCue('warning');
        return;
      }

      // Check slot conflict simulation
      if (student_ap_number === 'AP22110010088' || slot_timing?.includes('05:00 PM')) {
        setVerificationStatus('WRONG_SLOT');
        setActiveStudent({
          ap_number: student_ap_number,
          full_name: 'Priya Sharma',
          college_email: college_email || 'priya_sharma@srmap.edu.in',
          department: 'Electronics & Communication',
          batch: '2022-2026',
          facility_name: 'Ramapuram Central Fitness Center',
          slot_timing: slot_timing || '05:00 PM - 06:00 PM',
          session_date: session_date || new Date().toISOString().split('T')[0],
          allocated_slot_timing: '05:00 PM - 06:00 PM (Evening Batch)',
          allocated_facility: 'Ramapuram Central Fitness Center',
          is_active_allocation: true,
        });
        playAudioCue('error');
        return;
      }

      // Check unregistered student
      if (student_ap_number === 'AP99999999999') {
        setVerificationStatus('INVALID_CREDENTIALS');
        setActiveStudent({
          ap_number: student_ap_number,
          full_name: 'Unknown Student',
          college_email: college_email || 'unregistered@srmap.edu.in',
          department: 'Unregistered Record',
          batch: '—',
          facility_name: '—',
          slot_timing: slot_timing || '—',
          session_date: session_date || new Date().toISOString().split('T')[0],
          allocated_slot_timing: 'No active allocation found',
          allocated_facility: 'None',
          is_active_allocation: false,
        });
        playAudioCue('error');
        return;
      }

      // Otherwise verified student pass (e.g. Aarav Raj AP22110010045 or generic valid AP)
      const isAarav = student_ap_number === 'AP22110010045';
      const studentData: VerifiedStudentData = {
        ap_number: student_ap_number,
        full_name: isAarav ? 'Aarav Raj' : 'Student Candidate',
        college_email: college_email || `${student_ap_number.toLowerCase()}@srmap.edu.in`,
        department: isAarav ? 'Computer Science & Engineering' : 'Engineering School',
        batch: '2022-2026',
        facility_name: 'Ramapuram Central Fitness Center',
        slot_timing: slot_timing || '06:00 AM - 07:00 AM',
        session_date: session_date || new Date().toISOString().split('T')[0],
        allocated_slot_timing: '06:00 AM - 07:00 AM',
        allocated_facility: 'Ramapuram Central Fitness Center',
        is_active_allocation: true,
      };

      setActiveStudent(studentData);
      setVerificationStatus('VERIFIED');
      playAudioCue('success');
    } catch {
      // In case raw text wasn't JSON but an AP Number
      if (/^AP\d{11}$/i.test(payloadText.trim())) {
        const ap = payloadText.trim().toUpperCase();
        setActiveStudent({
          ap_number: ap,
          full_name: 'Verified Student by Direct AP',
          college_email: `${ap.toLowerCase()}@srmap.edu.in`,
          department: 'SRM-AP University',
          batch: '2022-2026',
          facility_name: 'Ramapuram Central Fitness Center',
          slot_timing: '06:00 AM - 07:00 AM',
          session_date: new Date().toISOString().split('T')[0],
          allocated_slot_timing: '06:00 AM - 07:00 AM',
          allocated_facility: 'Ramapuram Central Fitness Center',
          is_active_allocation: true,
        });
        setVerificationStatus('VERIFIED');
        playAudioCue('success');
      } else {
        setVerificationStatus('INVALID_CREDENTIALS');
        playAudioCue('error');
      }
    }
  }, [playAudioCue]);

  // Hook for camera scanner
  const scanner = useQRScanner('turnstile-camera-feed', {
    onScanSuccess: (decoded) => {
      handleDecodePayload(decoded);
    },
    fps: 10,
    qrbox: 240,
  });

  // Start scanner on mount if not already scanning
  useEffect(() => {
    scanner.startScanning().catch((e) => {
      console.warn('Initial camera auto-start paused:', e);
    });
    return () => {
      scanner.stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut listener: Enter/Space = Confirm, Esc = Reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReset();
      } else if ((e.key === 'Enter' || e.key === ' ') && verificationStatus === 'VERIFIED' && activeStudent) {
        e.preventDefault();
        handleConfirmEntry(activeStudent);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verificationStatus, activeStudent]);

  const handleConfirmEntry = (student: VerifiedStudentData) => {
    // Add to history
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setScanHistory((prev) => [
      {
        id: `scan_${Date.now()}`,
        timestamp: nowTime,
        ap_number: student.ap_number,
        full_name: student.full_name,
        status: 'VERIFIED',
        slot_timing: student.slot_timing,
      },
      ...prev.slice(0, 7),
    ]);
    setAdmittedCount((c) => Math.min(maxCapacity, c + 1));
    handleReset();
  };

  const handleRejectEntry = (reason: string) => {
    if (activeStudent) {
      const nowTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setScanHistory((prev) => [
        {
          id: `scan_${Date.now()}`,
          timestamp: nowTime,
          ap_number: activeStudent.ap_number,
          full_name: activeStudent.full_name,
          status: 'INVALID_CREDENTIALS',
          slot_timing: reason,
        },
        ...prev.slice(0, 7),
      ]);
    }
    handleReset();
  };

  const handleReset = () => {
    setVerificationStatus('IDLE');
    setActiveStudent(null);
    setRawScannedText('');
  };

  return (
    <div
      data-ui="staff-qr-scanner-page"
      className="min-h-screen bg-[var(--parchment,#eeecea)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Institutional Header & Terminal Banner */}
        <header
          className="p-6 bg-white border-4 border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--athletic-green)] text-white border-2 border-[var(--ink)] flex items-center justify-center font-mono font-bold text-2xl shadow-[2px_2px_0px_var(--ink)]">
              T1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--athletic-green)]">
                  Turnstile Optical Scanner • Gate Desk #01
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--ink)]">
                Gym Attendance & Turnstile Scanner
              </h1>
              <p className="font-mono text-xs text-neutral-600 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Building size={13} /> Ramapuram Central Fitness Center
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} /> Active Session: 06:00 AM – 07:00 AM
                </span>
                <span>•</span>
                <span>Staff: {user?.full_name || 'Coach Rajesh Kumar'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="gap-1 font-mono text-xs"
              title="Toggle Audio Feedback"
            >
              {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {audioEnabled ? 'Chime On' : 'Chime Muted'}
            </Button>
            <Link to="/staff/manual-checkin">
              <Button variant="secondary" size="sm" className="gap-1 font-mono text-xs">
                <Search size={14} /> Manual AP Lookup
              </Button>
            </Link>
            <Link to="/staff/session-roster">
              <Button variant="secondary" size="sm" className="gap-1 font-mono text-xs">
                <ClipboardList size={14} /> Today's Roster
              </Button>
            </Link>
          </div>
        </header>

        {/* Live Session Capacity Gauge Strip */}
        <section
          data-ui="turnstile-capacity-meter"
          className="p-4 bg-[var(--card-paper,#e8e5e0)] border-2 border-[var(--ink)] flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_var(--ink)]"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[var(--athletic-green)]" />
            <div>
              <span className="font-mono text-xs uppercase font-bold text-neutral-600 block">
                Live Session Occupancy
              </span>
              <span className="font-serif font-bold text-lg text-[var(--ink)]">
                {admittedCount} / {maxCapacity} Athletes Admitted ({Math.round((admittedCount / maxCapacity) * 100)}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <div className="h-4 bg-white border-2 border-[var(--ink)] p-0.5">
              <div
                className="h-full bg-[var(--athletic-green)] transition-all duration-300"
                style={{ width: `${(admittedCount / maxCapacity) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-2 py-1 bg-white border border-[var(--ink)]">
              Remaining: <strong>{maxCapacity - admittedCount} spots</strong>
            </span>
            <span className="px-2 py-1 bg-white border border-[var(--ink)]">
              Session Ends: <strong>07:00 AM (18m left)</strong>
            </span>
          </div>
        </section>

        {/* Dual Column Console: Left = Optical Scanner, Right = Verification Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Optical Camera Viewport (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <CameraViewport
              elementId="turnstile-camera-feed"
              isScanning={scanner.isScanning}
              hasPermission={scanner.hasPermission}
              errorMessage={scanner.errorMessage}
              devices={scanner.devices}
              selectedDeviceId={scanner.selectedDeviceId}
              isTorchOn={scanner.isTorchOn}
              isTorchSupported={scanner.isTorchSupported}
              onStart={scanner.startScanning}
              onStop={scanner.stopScanning}
              onToggleTorch={scanner.toggleTorch}
              onSelectDevice={scanner.setSelectedDeviceId}
              onSimulateScan={handleDecodePayload}
            />

            {/* Quick Keyboard shortcuts hint */}
            <div className="p-3 bg-white border-2 border-[var(--ink)] flex items-center justify-between font-mono text-xs text-neutral-600">
              <span>⌨️ Shortcuts:</span>
              <span><kbd className="px-1.5 py-0.5 bg-neutral-200 border border-neutral-400 font-bold">Space / Enter</kbd> Confirm Entry</span>
              <span><kbd className="px-1.5 py-0.5 bg-neutral-200 border border-neutral-400 font-bold">Esc</kbd> Clear Card</span>
            </div>
          </div>

          {/* Right Column: Verification Dossier & Shift Scan History (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <VerificationCard
              status={verificationStatus}
              student={activeStudent}
              rawPayload={rawScannedText}
              onConfirmEntry={handleConfirmEntry}
              onRejectEntry={handleRejectEntry}
              onReset={handleReset}
            />

            {/* Shift Turnstile Scan Log */}
            <div
              data-ui="shift-scan-log"
              className="p-4 bg-white border-2 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-neutral-300 mb-3">
                <div className="flex items-center gap-1.5">
                  <History size={16} className="text-neutral-600" />
                  <h4 className="font-serif font-bold text-sm text-[var(--ink)]">
                    Recent Turnstile Entries (This Shift)
                  </h4>
                </div>
                <Badge status="NEUTRAL" className="font-mono text-[10px]">
                  {scanHistory.length} LOGGED
                </Badge>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 border border-neutral-300 bg-[var(--parchment,#fbfaf8)] flex items-center justify-between text-xs font-mono hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {item.status === 'VERIFIED' ? (
                        <CheckCircle size={15} className="text-[var(--athletic-green)] shrink-0" />
                      ) : item.status === 'DUPLICATE' ? (
                        <AlertTriangle size={15} className="text-[var(--amber)] shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-[var(--oxblood)] shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-[var(--ink)]">{item.full_name}</div>
                        <div className="text-[10px] text-neutral-500">{item.ap_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[11px] text-neutral-700">{item.timestamp}</div>
                      <span
                        className={`text-[9px] uppercase font-bold px-1 py-0.5 border ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-[var(--athletic-green)] border-emerald-300'
                            : item.status === 'DUPLICATE'
                            ? 'bg-amber-50 text-[var(--amber)] border-amber-300'
                            : 'bg-red-50 text-[var(--oxblood)] border-red-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
