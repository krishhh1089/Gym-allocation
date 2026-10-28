import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types/api';
import { Badge, Button } from '@/components/ui';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  // If not authenticated, redirect to login page with return state
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role check is required and user does not have required permissions
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Determine the default home portal for the current user's role
    const rolePortalMap: Record<UserRole, { path: string; name: string }> = {
      STUDENT: { path: '/student/dashboard', name: 'Student Dashboard' },
      STAFF: { path: '/staff/scanner', name: 'Turnstile QR Scanner' },
      TRAINER: { path: '/staff/scanner', name: 'Turnstile QR Scanner' },
      ADMIN: { path: '/admin/dashboard', name: 'Sports Admin Dashboard' },
      SUPER_ADMIN: { path: '/super-admin/staff', name: 'Super Admin Center' },
    };

    const userHome = rolePortalMap[user.role] || { path: '/', name: 'Portal Hub' };

    return (
      <div
        data-ui="forbidden-slate"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: 'var(--surface)',
            border: '3px solid var(--ink)',
            boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
            padding: '2.5rem 2rem',
            position: 'relative',
          }}
        >
          {/* Header Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <Badge status="ABSENT" size="md">
              ACCESS RESTRICTED (HTTP 403)
            </Badge>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
              SECURITY POLICY #RBAC-SRMAP
            </span>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                padding: '0.65rem',
                backgroundColor: 'var(--status-absent-bg)',
                border: '2px solid var(--danger)',
                display: 'inline-flex',
                color: 'var(--danger)',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.65rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Access Prohibited for Role
              </h1>
              <p
                style={{
                  marginTop: '0.35rem',
                  fontSize: '0.925rem',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                Your account does not possess the credentials required to view this university section.
              </p>
            </div>
          </div>

          {/* User & Permission Summary */}
          <div
            style={{
              backgroundColor: 'var(--surface-tint)',
              border: '1.5px solid var(--ink)',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px dashed var(--border-color-faint)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--muted)' }}>Authenticated As:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{user.full_name} ({user.email})</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px dashed var(--border-color-faint)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--muted)' }}>Current Role:</span>
              <Badge status={user.role === 'STUDENT' ? 'ACTIVE' : 'NEUTRAL'} size="sm">
                {user.role}
              </Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Required Roles:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>
                {allowedRoles.join(' or ')}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <Link to={userHome.path} style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md" leftIcon={<CheckCircle2 size={16} />}>
                Go to {userHome.name}
              </Button>
            </Link>

            <Link to="/" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
                Portal Hub
              </Button>
            </Link>

            <Button
              variant="outline"
              size="md"
              leftIcon={<LogOut size={16} />}
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render children or outlet if authorized
  return children ? <>{children}</> : <Outlet />;
};

ProtectedRoute.displayName = 'ProtectedRoute';
