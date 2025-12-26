import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Form Side */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 items-center justify-center p-12">
        <div className="text-white text-center">
          <h1 className="text-5xl font-bold mb-4">LERN Platform</h1>
          <p className="text-xl mb-8">AI-Powered Financial Analysis</p>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <p className="text-3xl font-bold">1,247+</p>
              <p className="text-sm">Models Trained</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <p className="text-3xl font-bold">98.5%</p>
              <p className="text-sm">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};