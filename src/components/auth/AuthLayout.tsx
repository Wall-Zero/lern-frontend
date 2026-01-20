import type { ReactNode } from 'react';
import tradingBg from '../../assets/background.png';

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
      <div
        className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-12 text-white"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(123, 92, 214, 0.65),
              rgba(154, 123, 232, 0.65)
            ),
            url(${tradingBg})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center max-w-md">
          <h1 className="text-5xl font-bold mb-4">LERN Platform</h1>
          <p className="text-xl mb-10">AI-Powered Financial Analysis</p>

          <div className="space-y-6">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
              <p className="text-4xl font-bold">1,247+</p>
              <p className="text-sm opacity-90">Models Trained</p>
            </div>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
              <p className="text-4xl font-bold">98.5%</p>
              <p className="text-sm opacity-90">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
