import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge, Button, Input } from '@/components/ui';
import { ShieldCheck, Zap } from 'lucide-react';

export const QRPreviewSimulator: React.FC = () => {
  const [apNumber, setApNumber] = useState('AP22110010045');
  const [email, setEmail] = useState('aarav_raj@srmap.edu.in');
  const [slotTime, setSlotTime] = useState('06:00 AM - 07:00 AM');
  const [sessionDate, setSessionDate] = useState('2026-10-28');
  const [scanSimulated, setScanSimulated] = useState(false);

  // Pure JSON QR payload encoding the 4 mandated attributes
  const qrPayload = JSON.stringify({
    ap_number: apNumber,
    email: email,
    session_date: sessionDate,
    slot_timing: slotTime,
  });

  const handleSimulateScan = () => {
    setScanSimulated(true);
    setTimeout(() => {
      setScanSimulated(false);
    }, 2500);
  };

  return (
    <div
      data-ui="qr-preview-simulator"
      style={{
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        padding: '2rem',
        marginBottom: '3.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
            TURNSTILE SCAN ENGINE DEMO
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', margin: '0.2rem 0 0 0' }}>
            Interactive QR Pass & Scanner Simulator
          </h2>
        </div>
        <Badge status="ACTIVE" size="sm">
          DYNAMIC 4-ATTRIBUTE PAYLOAD
        </Badge>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '750px' }}>
        Every student check-in pass dynamically encodes 4 verified attributes. When presented at the turnstile desk,
        the staff camera scanner decodes the payload and verifies student status against active backend records in under 500ms.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="1. Student AP Number"
            mono
            value={apNumber}
            onChange={(e) => setApNumber(e.target.value)}
            helperText="Official university registration identifier"
          />

          <Input
            label="2. Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText="University Google account"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.925rem',
                  color: 'var(--ink)',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                3. Session Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface)',
                  border: '2px solid var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.925rem',
                  color: 'var(--ink)',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                4. Slot Timing
              </label>
              <select
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface)',
                  border: '2px solid var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="06:00 AM - 07:00 AM">06:00 AM – 07:00 AM (Morning)</option>
                <option value="07:00 AM - 08:00 AM">07:00 AM – 08:00 AM (Morning)</option>
                <option value="05:00 PM - 06:00 PM">05:00 PM – 06:00 PM (Evening)</option>
                <option value="06:00 PM - 07:00 PM">06:00 PM – 07:00 PM (Evening)</option>
              </select>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleSimulateScan}
            leftIcon={<Zap size={16} color="var(--accent)" />}
          >
            Simulate Turnstile Staff Camera Scan
          </Button>
        </div>

        {/* Live Vector QR Code Card */}
        <div
          style={{
            backgroundColor: 'var(--card-paper, #e8e5e0)',
            border: '2px solid var(--ink)',
            boxShadow: '4px 4px 0px var(--ink)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Simulated Scanner Flash Overlay */}
          {scanSimulated && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(46, 74, 62, 0.95)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                zIndex: 10,
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <ShieldCheck size={48} color="#fff" style={{ marginBottom: '0.75rem' }} />
              <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>
                SCAN VERIFIED (210ms)
              </strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                Attendance recorded for <strong>{apNumber}</strong> at {slotTime}. Duplicate check passed.
              </p>
            </div>
          )}

          <div style={{ marginBottom: '0.75rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              DYNAMIC STUDENT PASS
            </span>
            <Badge status="ACTIVE" size="sm" dot={false}>LIVE SVG</Badge>
          </div>

          {/* SVG QR Code */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              border: '2px solid var(--ink)',
              marginBottom: '1rem',
            }}
          >
            <QRCodeSVG
              value={qrPayload}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>

          <div style={{ width: '100%', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            <div><strong>AP:</strong> {apNumber}</div>
            <div><strong>Date:</strong> {sessionDate} · {slotTime}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
