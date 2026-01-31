import { AuthLayout } from '../../components/auth/AuthLayout';
import { LoginForm } from '../../components/auth/LoginForm';
import { usePageTitle } from '../../hooks/usePageTitle';

export const Login = () => {
  usePageTitle('Login');
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};