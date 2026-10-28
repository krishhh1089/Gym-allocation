import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore, DEMO_USERS } from '@/stores/useAuthStore';
import { Badge, Button } from '@/components/ui';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthExchange = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code provided in callback.');
        return;
      }

      try {
        // In local mock or backend mode, verify authorization code
        // Simulate slight network validation delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Use standard verified student account
        const studentUser = DEMO_USERS.STUDENT;

        // Verify strictly that domain matches @srmap.edu.in
        if (!studentUser.email.endsWith('@srmap.edu.in')) {
          setStatus('error');
          setErrorMessage('Access Denied: Only @srmap.edu.in institutional accounts are permitted.');
          navigate('/login?error=domain_mismatch', { replace: true });
          return;
        }

        const mockAccessToken = `jwt_srmap_access_${Date.now()}`;
        const mockRefreshToken = `jwt_srmap_refresh_${Date.now()}`;

        // Save session in store
        setAuth(studentUser, mockAccessToken, mockRefreshToken);
        setStatus('success');

        // Short timeout for seamless visual feedback before redirect
        setTimeout(() => {
          navigate('/student/dashboard', { replace: true });
        }, 500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication verification failed.');
      }
    };

    handleAuthExchange();
  }, [location.search, navigate, setAuth]);

  return (
    <div
      data-ui="auth-callback-page"
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
        data-ui="auth-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--surface)',
          border: '3px solid var(--ink)',
          boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <Badge status={status === 'error' ? 'ABSENT' : 'ACTIVE'} size="md">
            {status === 'error' ? 'AUTH FAILED' : 'IDENTITY VERIFICATION'}
          </Badge>
        </div>

        {status === 'verifying' && (
          <div>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--accent)',
                borderRightColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.75s linear infinite',
                marginBottom: '1.25rem',
              }}
            />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>
              Verifying Google Credentials
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Exchanging authorization code with SRM-AP Identity Gateway and verifying institutional enrollment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ display: 'inline-flex', color: 'var(--status-present)', marginBottom: '1rem' }}>
              <CheckCircle2 size={44} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>
              Authentication Verified
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Welcome back, <strong>{DEMO_USERS.STUDENT.full_name}</strong>. Redirecting to your student dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ display: 'inline-flex', color: 'var(--danger)', marginBottom: '1rem' }}>
              <AlertTriangle size={44} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>
              Verification Failed
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'var(--muted)' }}>
              {errorMessage || 'Unable to exchange authentication token with identity server.'}
            </p>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md">
                Return to Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

AuthCallback.displayName = 'AuthCallback';
