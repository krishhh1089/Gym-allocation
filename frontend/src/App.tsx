import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { ComponentShowcase } from './pages/public/ComponentShowcase';
import { LandingPage } from './pages/public/LandingPage';
import { Login } from './pages/auth/Login';
import { AuthCallback } from './pages/auth/AuthCallback';
import { Onboarding } from './pages/student/Onboarding';
import { QRCodePage } from './pages/student/QRCodePage';
import { SlotBrowserPage } from './pages/student/SlotBrowserPage';
import { SlotTransferPage } from './pages/student/SlotTransferPage';
import { AttendancePage } from './pages/student/AttendancePage';
import { ComplaintsPage } from './pages/student/ComplaintsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/useAuthStore';
import { Badge, Button } from './components/ui';
import { LogIn, LogOut, UserCheck, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        {/* Public & Verification Routes */}
        <Route path="/" element={<HomePortalNavigator />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/components" element={<ComponentShowcase />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Student Portal */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/student/dashboard" element={<PlaceholderSlate title="Student Dashboard" role="STUDENT" />} />
          <Route path="/student/qr-code" element={<QRCodePage />} />
          <Route path="/student/slots" element={<SlotBrowserPage />} />
          <Route path="/student/transfer" element={<SlotTransferPage />} />
          <Route path="/student/attendance" element={<AttendancePage />} />
          <Route path="/student/complaints" element={<ComplaintsPage />} />
        </Route>

        {/* Protected Gym Staff Scanner Portal */}
        <Route element={<ProtectedRoute allowedRoles={['STAFF', 'TRAINER']} />}>
          <Route path="/staff/scanner" element={<PlaceholderSlate title="Turnstile Camera Scanner" role="STAFF" />} />
          <Route path="/staff/manual-checkin" element={<PlaceholderSlate title="Manual AP Number Check-In" role="STAFF" />} />
          <Route path="/staff/session-roster" element={<PlaceholderSlate title="Live Session Roster" role="STAFF" />} />
        </Route>

        {/* Protected Sports Admin Portal */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/admin/dashboard" element={<PlaceholderSlate title="Sports Admin Dashboard" role="ADMIN" />} />
          <Route path="/admin/facilities" element={<PlaceholderSlate title="Gym Facilities & Recurrence Schedules" role="ADMIN" />} />
          <Route path="/admin/windows" element={<PlaceholderSlate title="Registration Windows" role="ADMIN" />} />
          <Route path="/admin/transfers" element={<PlaceholderSlate title="Transfer Requests Review" role="ADMIN" />} />
          <Route path="/admin/attendance" element={<PlaceholderSlate title="Attendance Audit & Correction Center" role="ADMIN" />} />
          <Route path="/admin/absence" element={<PlaceholderSlate title="Absence Monitoring & Allocation Management" role="ADMIN" />} />
          <Route path="/admin/complaints" element={<PlaceholderSlate title="Complaints Management Desk" role="ADMIN" />} />
          <Route path="/admin/imports" element={<PlaceholderSlate title="Bulk Excel / CSV Import Hub" role="ADMIN" />} />
          <Route path="/admin/reports" element={<PlaceholderSlate title="Compliance Analytics & Reports Export" role="ADMIN" />} />
        </Route>

        {/* Protected Super Admin */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/super-admin/staff" element={<PlaceholderSlate title="Staff Provisioning & Role Delegation" role="SUPER_ADMIN" />} />
          <Route path="/super-admin/settings" element={<PlaceholderSlate title="System Settings & Domain Rules" role="SUPER_ADMIN" />} />
          <Route path="/super-admin/audit" element={<PlaceholderSlate title="Immutable Audit Trail Inspector" role="SUPER_ADMIN" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function HomePortalNavigator() {
  const { user, isAuthenticated, logout, devSwitchRole } = useAuthStore();

  return (
    <div className="wrap" style={{ paddingBlock: '3rem' }}>
      {/* Top Session Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--ink)',
          boxShadow: 'var(--shadow-offset)',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={20} color="var(--accent)" />
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Signed in as:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{user.full_name}</strong>
              <Badge status={user.role === 'STUDENT' ? 'ACTIVE' : 'NEUTRAL'} size="sm">
                {user.role}
              </Badge>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                Session State: <strong>Guest (Unauthenticated)</strong>
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={14} />}
              onClick={() => logout()}
            >
              Sign Out
            </Button>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm" leftIcon={<LogIn size={14} />}>
                Sign In with SRM-AP Account
              </Button>
            </Link>
          )}

          {/* Quick RBAC Tester */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Switch:
            </span>
            <button
              onClick={() => devSwitchRole('STUDENT')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: user?.role === 'STUDENT' ? 'var(--accent)' : 'var(--surface-tint)',
                color: user?.role === 'STUDENT' ? '#fff' : 'var(--ink)',
                border: '1px solid var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Student
            </button>
            <button
              onClick={() => devSwitchRole('STAFF')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: user?.role === 'STAFF' ? 'var(--accent)' : 'var(--surface-tint)',
                color: user?.role === 'STAFF' ? '#fff' : 'var(--ink)',
                border: '1px solid var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Staff
            </button>
            <button
              onClick={() => devSwitchRole('ADMIN')}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: user?.role === 'ADMIN' ? 'var(--accent)' : 'var(--surface-tint)',
                color: user?.role === 'ADMIN' ? '#fff' : 'var(--ink)',
                border: '1px solid var(--ink)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header style={{ marginBottom: '2.5rem', borderBottom: '2px solid var(--surface-dark)', paddingBottom: '1.5rem' }}>
        <span className="small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
          SRM University-AP · Sports Department
        </span>
        <h1 className="head" style={{ marginTop: '0.5rem', color: 'var(--ink)' }}>GymSlot Portal Engine</h1>
        <p className="lead" style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>
          Official gym slot allocation, student QR pass, and attendance management portal.
        </p>

        {/* Phase Callouts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                Phase 1: UI Primitives
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Buttons, inputs, badges, tabs, slips.
              </p>
            </div>
            <Link to="/components">
              <Button variant="outline" size="sm">
                Showcase →
              </Button>
            </Link>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                Phase 2: Auth & RBAC
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Google SSO, session store, 403 gates.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login / SSO →
              </Button>
            </Link>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                Phase 3: Landing & Onboarding
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Landing & verified onboarding.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <Link to="/landing">
                <Button variant="outline" size="sm">
                  Landing →
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button variant="outline" size="sm">
                  Onboard →
                </Button>
              </Link>
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                Phase 4: Turnstile QR Pass
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                4-attribute pass & session selector.
              </p>
            </div>
            <Link to="/student/qr-code">
              <Button variant="outline" size="sm">
                QR Pass →
              </Button>
            </Link>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--ink)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                Phase 5: Slot Browser & Transfers
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Occupancy gauges, waitlists & swaps.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <Link to="/student/slots">
                <Button variant="outline" size="sm">
                  Slots →
                </Button>
              </Link>
              <Link to="/student/transfer">
                <Button variant="outline" size="sm">
                  Transfer →
                </Button>
              </Link>
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--accent-light, #d8e5df)',
              border: '2px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                Phase 6: Attendance & Support
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--ink)' }}>
                Absence barometer & grievance desk.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <Link to="/student/attendance">
                <Button variant="primary" size="sm">
                  Attendance →
                </Button>
              </Link>
              <Link to="/student/complaints">
                <Button variant="secondary" size="sm">
                  Tickets →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Role Portal Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <PortalCard
          title="Student Portal"
          badge="Role: STUDENT"
          desc="Access your scheduled slot, view your QR code for turnstile check-in, browse open batches, or apply for transfers."
          links={[
            { label: 'Student Dashboard', to: '/student/dashboard' },
            { label: 'Student QR Code', to: '/student/qr-code' },
            { label: 'Browse Gym Slots', to: '/student/slots' },
            { label: 'Request Slot Transfer', to: '/student/transfer' },
            { label: 'Attendance History', to: '/student/attendance' },
            { label: 'Support & Complaints', to: '/student/complaints' },
          ]}
        />

        <PortalCard
          title="Gym Staff Scanner"
          badge="Role: STAFF / TRAINER"
          desc="Camera scanner for turnstile desk verification, attendance marking, duplicate guard, and manual AP lookup."
          links={[
            { label: 'Turnstile QR Scanner', to: '/staff/scanner' },
            { label: 'Manual AP Check-In', to: '/staff/manual-checkin' },
            { label: 'Session Live Roster', to: '/staff/session-roster' },
          ]}
        />

        <PortalCard
          title="Sports Administration"
          badge="Role: ADMIN"
          desc="Facility configuration, registration windows, transfer triage, attendance audit & correction, and absence monitoring."
          links={[
            { label: 'Admin Dashboard', to: '/admin/dashboard' },
            { label: 'Facilities & Slots', to: '/admin/facilities' },
            { label: 'Registration Windows', to: '/admin/windows' },
            { label: 'Transfer Requests', to: '/admin/transfers' },
            { label: 'Attendance Audit', to: '/admin/attendance' },
            { label: 'Absence Monitoring', to: '/admin/absence' },
            { label: 'Complaints Desk', to: '/admin/complaints' },
            { label: 'Bulk Excel Import', to: '/admin/imports' },
            { label: 'Reports Export', to: '/admin/reports' },
          ]}
        />

        <PortalCard
          title="System Administration"
          badge="Role: SUPER_ADMIN"
          desc="Super Admin control center for staff provisioning, college email domain rules, and immutable audit logs."
          links={[
            { label: 'Staff Provisioning', to: '/super-admin/staff' },
            { label: 'System Settings', to: '/super-admin/settings' },
            { label: 'Audit Trail Inspector', to: '/super-admin/audit' },
          ]}
        />
      </div>

      <footer style={{ borderTop: '2px solid var(--surface-dark)', paddingTop: '1.5rem', color: 'var(--muted)', fontSize: 'var(--step-small)' }}>
        <p>
          Landing Page: <a href="/web/index.html" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>View Official Public Landing Page</a> · SRM University-AP Sports Facilities
        </p>
      </footer>
    </div>
  );
}

function PortalCard({
  title,
  badge,
  desc,
  links,
}: {
  title: string;
  badge: string;
  desc: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-offset)',
        padding: '1.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--ink)', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', backgroundColor: 'var(--surface-tint)', padding: '0.15rem 0.4rem', border: '1px solid var(--ink)' }}>
          {badge}
        </span>
      </div>

      <p style={{ fontSize: '0.925rem', color: 'var(--muted)', lineHeight: '1.45', margin: 0 }}>{desc}</p>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: 'auto', paddingTop: '0.75rem' }}>
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.85rem',
                background: 'var(--bg)',
                border: '1px solid var(--ink)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background var(--t-hover)',
              }}
            >
              <span>{link.label}</span>
              <ArrowRight size={14} color="var(--accent)" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceholderSlate({ title, role }: { title: string; role: string }) {
  const { user } = useAuthStore();

  return (
    <div className="wrap" style={{ paddingBlock: '4rem' }}>
      <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'underline', marginBottom: '1.5rem', display: 'inline-block' }}>
        ← Return to Portal Hub
      </Link>
      <div
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--ink)',
          boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
          padding: '2.5rem',
          maxWidth: '800px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.8rem' }}>
          <Badge status="ACTIVE" size="sm">
            {role} AUTHORIZED
          </Badge>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            User: {user?.full_name} ({user?.email})
          </span>
        </div>

        <h1 className="head" style={{ marginBlock: '0.5rem', color: 'var(--ink)' }}>{title}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.75rem', fontSize: '1.05rem' }}>
          This screen is authenticated and protected by React Router v6 RBAC guards. Implementation continues per the specifications in <code>frontend/docs/frontend-implementation-plan.md</code>.
        </p>

        <div style={{ padding: '1rem', background: 'var(--bg)', borderLeft: '4px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={18} color="var(--accent)" />
          <span className="nums" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            Session Active · Role: {user?.role} · Protected Route Verified
          </span>
        </div>
      </div>
    </div>
  );
}

