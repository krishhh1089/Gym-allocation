import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types/api';
import { Button, Badge } from '@/components/ui';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  KeyRound,
  GraduationCap,
  Dumbbell,
  Building2,
  Lock,
} from 'lucide-react';

export const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, devSwitchRole } = useAuthStore();

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Parse URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const isExpired = searchParams.get('expired') === '1';
  const urlError = searchParams.get('error');

  // Determine return target after login
  const locationState = location.state as { from?: { pathname: string } } | null;
  const returnUrl = locationState?.from?.pathname || null;

  const handleRoleSelect = (role: UserRole) => {
    devSwitchRole(role);

    if (returnUrl) {
      navigate(returnUrl, { replace: true });
      return;
    }

    // Default destination based on role
    switch (role) {
      case 'STUDENT':
        navigate('/student/dashboard', { replace: true });
        break;
      case 'STAFF':
      case 'TRAINER':
        navigate('/staff/scanner', { replace: true });
        break;
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'SUPER_ADMIN':
        navigate('/super-admin/staff', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const handleGoogleOAuthLogin = () => {
    setIsLoadingGoogle(true);
    // In production, redirects to backend OAuth endpoint or Google GIS flow
    // In local dev without backend, redirects to /auth/callback?code=mock_oauth_code
    window.location.href = `/auth/callback?code=mock_srmap_auth_code_${Date.now()}`;
  };

  return (
    <div
      data-ui="login-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      {/* Back to Home Link */}
      <div style={{ width: '100%', maxWidth: '580px', marginBottom: '1.25rem' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Return to Portal Hub
        </Link>
      </div>

      {/* Main Login Card */}
      <div
        data-ui="login-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--surface)',
          border: '3px solid var(--ink)',
          boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
          padding: '2.5rem 2rem',
          position: 'relative',
        }}
      >
        {/* Institutional Monogram / Header */}
        <div style={{ marginBottom: '1.75rem', borderBottom: '2px solid var(--ink)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              SRM UNIVERSITY-AP · SPORTS PORTAL
            </span>
            <Badge status="ACTIVE" size="sm">
              OAUTH 2.0 VERIFIED
            </Badge>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0 0 0.35rem 0',
              lineHeight: 1.15,
            }}
          >
            GymSlot Single Sign-On
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>
            Access the official gym allocation, QR attendance passes, and staff check-in terminal.
          </p>
        </div>

        {/* Feedback / Alert Banners */}
        {isExpired && (
          <div
            style={{
              backgroundColor: 'var(--status-absent-bg)',
              border: '2px solid var(--danger)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>Your session has expired for security. Please sign in again.</span>
          </div>
        )}

        {urlError && (
          <div
            style={{
              backgroundColor: 'var(--status-absent-bg)',
              border: '2px solid var(--danger)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>
              {urlError === 'domain_mismatch'
                ? 'Access Denied: Only institutional @srmap.edu.in accounts are permitted.'
                : 'Authentication failed. Please verify your credentials.'}
            </span>
          </div>
        )}

        {/* Current Active Session Callout */}
        {isAuthenticated && user && (
          <div
            style={{
              backgroundColor: 'var(--status-present-bg)',
              border: '2px solid var(--accent)',
              padding: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent)' }}>
                  Currently Signed In
                </span>
              </div>
              <Badge status="ACTIVE" size="sm">{user.role}</Badge>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--ink)' }}>
              <strong>{user.full_name}</strong> ({user.email})
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRoleSelect(user.role)}
                rightIcon={<ArrowRight size={14} />}
              >
                Proceed to Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Primary Google SSO Action */}
        <div style={{ marginBottom: '2rem' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoadingGoogle}
            onClick={handleGoogleOAuthLogin}
            leftIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            }
          >
            Continue with SRM-AP Google Account
          </Button>

          <p
            style={{
              margin: '0.75rem 0 0 0',
              fontSize: '0.825rem',
              color: 'var(--muted)',
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <ShieldCheck size={14} color="var(--accent)" />
            Restricted strictly to <strong>@srmap.edu.in</strong> university domains.
          </p>
        </div>

        {/* Local Development & Review Checkpoint Role Switcher */}
        <div
          style={{
            borderTop: '2px dashed var(--ink)',
            paddingTop: '1.5rem',
            backgroundColor: 'var(--surface-tint)',
            margin: '0 -2rem -2.5rem -2rem',
            padding: '1.5rem 2rem 2rem 2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <KeyRound size={16} color="var(--accent)" />
            <strong style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Phase 2 Review — Quick Role Switcher
            </strong>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', color: 'var(--muted)' }}>
            Instantly simulate authentication for any role to test RBAC protected route gates:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              onClick={() => handleRoleSelect('STUDENT')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--ink)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <GraduationCap size={16} color="var(--accent)" />
              <div>
                <div>Student</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
                  AP22110010045
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('STAFF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--ink)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Dumbbell size={16} color="var(--status-late)" />
              <div>
                <div>Gym Staff</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
                  Scanner Desk
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('ADMIN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--ink)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Building2 size={16} color="var(--accent)" />
              <div>
                <div>Sports Admin</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
                  Sports Council
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('SUPER_ADMIN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--ink)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Lock size={16} color="var(--danger)" />
              <div>
                <div>Super Admin</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
                  IT Director
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Login.displayName = 'Login';
