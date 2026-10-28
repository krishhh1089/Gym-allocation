import React from 'react';
import { Link } from 'react-router-dom';
import { HeroFolder } from '@/components/landing/HeroFolder';
import { QRPreviewSimulator } from '@/components/landing/QRPreviewSimulator';
import { TimetableCard } from '@/components/landing/TimetableCard';
import { Button, Badge } from '@/components/ui';
import {
  ShieldAlert,
  QrCode,
  Users,
  Award,
  ArrowRight,
  LogIn,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      {/* University Masthead Bar */}
      <div
        style={{
          borderBottom: '2px solid var(--ink)',
          backgroundColor: 'var(--surface)',
          padding: '1rem 1.5rem',
        }}
      >
        <div
          className="wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.2rem',
                border: '2px solid var(--ink)',
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
                SRM UNIVERSITY-AP · SPORTS DEPARTMENT
              </span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                GymSlot Allocation Portal
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm">
                Portal Hub
              </Button>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm" leftIcon={<LogIn size={14} />}>
                Student & Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section style={{ padding: '3.5rem 1.5rem 2rem 1.5rem' }}>
        <div className="wrap" style={{ maxWidth: '1100px' }}>
          <div style={{ maxWidth: '820px', marginBottom: '2.5rem' }}>
            <Badge status="ACTIVE" size="sm" style={{ marginBottom: '0.75rem' }}>
              OFFICIAL ATHLETIC INFRASTRUCTURE
            </Badge>

            <h1
              className="head"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--step-display, 3.2rem)',
                fontWeight: 600,
                color: 'var(--ink)',
                lineHeight: 1.05,
                margin: '0.5rem 0 1rem 0',
              }}
            >
              Precision Gym Allocation & Turnstile Attendance
            </h1>

            <p
              className="lead"
              style={{
                fontSize: 'var(--step-lead, 1.35rem)',
                color: 'var(--muted)',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              SRM University-AP's dedicated digital platform for student gym slot booking,
              dynamic turnstile QR check-in, real-time waitlists, and automated absence management.
            </p>
          </div>

          {/* Interactive Facility Folder */}
          <HeroFolder />

          {/* Interactive Turnstile QR Simulator */}
          <QRPreviewSimulator />

          {/* Four Foundational Safeguards */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              padding: '2.5rem 2rem',
              marginBottom: '3.5rem',
            }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
                SPORTS COUNCIL REGULATIONS
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', margin: '0.25rem 0 0.5rem 0' }}>
                Four Institutional Safeguards
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
                Designed to guarantee equal athletic access and prevent unused reservations across campus facilities.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--surface-tint)', border: '1.5px solid var(--ink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <ShieldAlert size={20} color="var(--danger)" />
                  <strong style={{ fontSize: '1rem' }}>3-Day Absence Rule</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Unexcused absence across 3 consecutive sessions automatically reclaims the slot, reallocating it to the next waitlisted student.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--surface-tint)', border: '1.5px solid var(--ink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <Users size={20} color="var(--accent)" />
                  <strong style={{ fontSize: '1rem' }}>FCFS Queue Fairness</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Transparent chronological waitlist queue. Priority transfers process instantly as reclaimed slots become vacant.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--surface-tint)', border: '1.5px solid var(--ink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <QrCode size={20} color="var(--status-late)" />
                  <strong style={{ fontSize: '1rem' }}>Dynamic Turnstile Pass</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  QR pass dynamically binds AP number, email, date, and slot timing. Validated against live database records when scanned.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: 'var(--surface-tint)', border: '1.5px solid var(--ink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <Award size={20} color="var(--accent)" />
                  <strong style={{ fontSize: '1rem' }}>Audit Trail Precision</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Every check-in timestamp, manual desk entry, and admin transfer is preserved in an immutable historical ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Official Schedule */}
          <TimetableCard />

          {/* CTA Banner */}
          <div
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
              padding: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '4rem',
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                Ready to Access Campus Gym Facilities?
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem', maxWidth: '600px' }}>
                Sign in with your official SRM University-AP Google account to view your pass, check session streaks, or browse open slot batches.
              </p>
            </div>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
              >
                Sign In with Google Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '2px solid var(--ink)',
          backgroundColor: 'var(--surface)',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          className="wrap"
          style={{
            maxWidth: '1100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--muted)',
          }}
        >
          <div>
            <strong>SRM University-AP, Andhra Pradesh</strong> · Department of Physical Education & Sports
          </div>
          <div>
            Photography: Open-access athletic archive (Unsplash / Pexels CC-0)
          </div>
        </div>
      </footer>
    </div>
  );
};

LandingPage.displayName = 'LandingPage';
