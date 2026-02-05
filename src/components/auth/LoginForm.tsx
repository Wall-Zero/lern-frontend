import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Brand */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '24px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '1px',
        }}>LERN</div>
        <div style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '2.5px',
          color: 'rgba(255,255,255,0.2)',
          marginTop: '4px',
        }}>Analytics Platform</div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h2 className="auth-title" style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '28px',
          fontWeight: 300,
          color: '#fff',
          margin: '0 0 8px 0',
        }}>Welcome back</h2>
        <p style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
        }}>Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {apiError && (
          <div style={{
            borderLeft: '3px solid #ff6b6b',
            background: 'rgba(255, 107, 107, 0.08)',
            padding: '12px 16px',
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            color: '#ff6b6b',
          }}>
            {apiError}
          </div>
        )}

        {/* Email Field */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '8px',
          }}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className={`auth-input ${errors.email ? 'error' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '13px',
              color: '#ff6b6b',
              margin: '8px 0 0 0',
            }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '8px',
          }}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className={`auth-input ${errors.password ? 'error' : ''}`}
            {...register('password')}
          />
          {errors.password && (
            <p style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '13px',
              color: '#ff6b6b',
              margin: '8px 0 0 0',
            }}>{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-button"
          disabled={isLoading}
          style={{ marginTop: '8px' }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
              </svg>
              Signing in...
            </span>
          ) : 'Sign In'}
        </button>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'rgba(255,255,255,0.06)',
          margin: '4px 0',
        }} />

        {/* Sign up link */}
        <p style={{
          textAlign: 'center',
          fontFamily: '"Outfit", sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
        }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Sign up
          </Link>
        </p>
      </form>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'center',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.5px',
        }}>Secured connection</span>
      </div>
    </div>
  );
};
