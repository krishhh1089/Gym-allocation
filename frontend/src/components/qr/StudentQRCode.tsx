import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge, Button } from '@/components/ui';
import {
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Mail,
  Copy,
  Check,
} from 'lucide-react';

export interface StudentQRData {
  student_ap_number: string;
  college_email: string;
  session_date: string;
  slot_timing: string;
  facility_name?: string;
  batch_name?: string;
}

export interface StudentQRCodeProps {
  data: StudentQRData;
  size?: number;
  onRefresh?: () => void;
  className?: string;
}

export const StudentQRCode: React.FC<StudentQRCodeProps> = ({
  data,
  size = 200,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  // Exact 4-attribute payload strictly matching backend verification contract
  const qrPayload = JSON.stringify({
    student_ap_number: data.student_ap_number,
    college_email: data.college_email,
    session_date: data.session_date,
    slot_timing: data.slot_timing,
  });

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-ui="student-qr-pass"
      style={{
        backgroundColor: 'var(--card-paper, #e8e5e0)',
        border: '3px solid var(--ink)',
        boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
        maxWidth: '520px',
        width: '100%',
        margin: '0 auto',
        overflow: 'hidden',
        position: 'relative',
      }}
      className={className}
    >
      {/* Top Header Strip with University Watermark */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--surface-dark)',
          borderBottom: '2px solid var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              border: '1.5px solid var(--ink)',
            }}
          >
            AP
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.725rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                display: 'block',
              }}
            >
              SRM UNIVERSITY-AP · TURNSTILE PASS
            </span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>
              {data.facility_name || 'C. V. Raman Indoor Gym'}
            </strong>
          </div>
        </div>

        <Badge status="ACTIVE" size="sm">
          READY FOR SCAN
        </Badge>
      </div>

      {/* Main Body */}
      <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* QR Code Container with High-Contrast Border */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#ffffff',
            border: '2px solid var(--ink)',
            boxShadow: '4px 4px 0px var(--ink)',
            marginBottom: '1.5rem',
            position: 'relative',
          }}
        >
          <QRCodeSVG
            value={qrPayload}
            size={size}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* 4 Encoded Attributes Display */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              borderBottom: '1px dashed var(--border-color-faint)',
              paddingBottom: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} /> Student AP Number:
            </span>
            <span className="nums" style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {data.student_ap_number}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              borderBottom: '1px dashed var(--border-color-faint)',
              paddingBottom: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={15} /> University Email:
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>
              {data.college_email}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              borderBottom: '1px dashed var(--border-color-faint)',
              paddingBottom: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={15} /> Session Date:
            </span>
            <span className="nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {data.session_date}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} /> Slot Timing:
            </span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
              {data.slot_timing}
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-tint)',
            border: '1px solid var(--ink)',
            padding: '0.75rem 1rem',
            fontSize: '0.785rem',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: '1.45',
          }}
        >
          <ShieldCheck size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Untrusted Input Principle:</strong> This QR payload contains 4 fields and is dynamically
            validated against backend student and allocation records when scanned by gym desk staff.
          </span>
        </div>
      </div>

      {/* Perforation Divider with Circular Notches */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '0' }}>
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg)',
            borderRight: '2px solid var(--ink)',
            marginLeft: '-10px',
            zIndex: 2,
          }}
          aria-hidden="true"
        />
        <div
          style={{
            flex: 1,
            borderBottom: '2px dashed rgba(28, 27, 26, 0.4)',
            height: '1px',
          }}
          aria-hidden="true"
        />
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg)',
            borderLeft: '2px solid var(--ink)',
            marginRight: '-10px',
            zIndex: 2,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Ticket Tear-off Stub / Actions */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--surface-tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', display: 'block' }}>
            TURNSTILE POLICY
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Present screen to camera at entry
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyPayload}
          leftIcon={copied ? <Check size={14} color="var(--accent)" /> : <Copy size={14} />}
        >
          {copied ? 'Payload Copied' : 'Copy JSON'}
        </Button>
      </div>
    </div>
  );
};
