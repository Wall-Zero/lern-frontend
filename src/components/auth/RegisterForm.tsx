import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string(),
}).refine((data) => data.password === data.password2, {
  message: "Passwords don't match",
  path: ['password2'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError('');
    try {
      await registerUser(data);
      navigate('/datasets');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Brand */}
      <div style={{ marginBottom: '40px' }}>
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
      <div style={{ marginBottom: '32px' }}>
        <h2 className="auth-title" style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '28px',
          fontWeight: 300,
          color: '#fff',
          margin: '0 0 8px 0',
        }}>Create account</h2>
        <p style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
        }}>Start your ML journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

        {/* Username Field */}
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
          }}>Username</label>
          <input
            type="text"
            placeholder="johndoe"
            className={`auth-input ${errors.username ? 'error' : ''}`}
            {...register('username')}
          />
          {errors.username && (
            <p style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '13px',
              color: '#ff6b6b',
              margin: '8px 0 0 0',
            }}>{errors.username.message}</p>
          )}
        </div>

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
            placeholder="At least 8 characters"
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

        {/* Confirm Password Field */}
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
          }}>Confirm Password</label>
          <input
            type="password"
            placeholder="Repeat your password"
            className={`auth-input ${errors.password2 ? 'error' : ''}`}
            {...register('password2')}
          />
          {errors.password2 && (
            <p style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '13px',
              color: '#ff6b6b',
              margin: '8px 0 0 0',
            }}>{errors.password2.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-button"
          disabled={isLoading}
          style={{ marginTop: '4px' }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
              </svg>
              Creating account...
            </span>
          ) : 'Sign Up'}
        </button>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'rgba(255,255,255,0.06)',
        }} />

        {/* Sign in link */}
        <p style={{
          textAlign: 'center',
          fontFamily: '"Outfit", sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
        }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </form>

      {/* Footer */}
      <div style={{
        marginTop: '32px',
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
