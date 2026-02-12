import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useState } from 'react';
import logo_lern from '../../assets/logo.png';
import { Mail, Lock, User } from 'lucide-react';

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

export const RegisterFormDark = () => {
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
    <div className="glass-card p-8 rounded-3xl space-y-8">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#00ffc8] to-[#00a080] p-1 animate-float">
          <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center overflow-hidden">
            <img
              src={logo_lern}
              alt="LERN Logo"
              className="w-20 h-20 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-gradient-cyan">
          Create account
        </h2>
        <p className="text-lg text-white/50">
          Start your ML journey today
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm animate-slide-up">
            {apiError}
          </div>
        )}

        <Input
          label="Username"
          placeholder="johndoe"
          icon={User}
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          error={errors.password2?.message}
          {...register('password2')}
        />

        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isLoading}
        >
          Sign Up
        </Button>

        <p className="text-center text-base text-white/50 pt-4">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-[#00ffc8] hover:text-[#00ff66] font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};