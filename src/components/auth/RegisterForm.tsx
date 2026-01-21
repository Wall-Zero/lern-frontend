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
    <div className="auth-card" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '40px',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #00ffc8, #00a080)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 255, 200, 0.4)'
        }}>
          <span style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#000'
          }}>L</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 className="auth-title" style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '32px',
          fontWeight: 600,
          color: '#fff',
          margin: '0 0 8px 0'
        }}>Create account</h2>
        <p style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '15px',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0
        }}>Start your ML journey today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {apiError && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            color: '#ff6b6b'
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
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>USERNAME</label>
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
              margin: '8px 0 0 0'
            }}>{errors.username.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>EMAIL</label>
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
              margin: '8px 0 0 0'
            }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>PASSWORD</label>
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
              margin: '8px 0 0 0'
            }}>{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>CONFIRM PASSWORD</label>
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
              margin: '8px 0 0 0'
            }}>{errors.password2.message}</p>
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
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
              </svg>
              Creating account...
            </span>
          ) : 'Sign Up'}
        </button>

        {/* Sign in link */}
        <p style={{
          textAlign: 'center',
          fontFamily: '"Outfit", sans-serif',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: '8px 0 0 0'
        }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};
