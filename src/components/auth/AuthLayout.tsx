import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Space+Mono:wght@400;700&family=Outfit:wght@200;300;400;500;600;700&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }

        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-2deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes dataStream {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .auth-input {
          width: 100%;
          padding: 14px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 400;
          transition: all 0.3s ease;
          outline: none;
        }

        .auth-input:hover {
          border-bottom-color: rgba(255, 255, 255, 0.35);
        }

        .auth-input:focus {
          border-bottom-color: #00ffc8;
          box-shadow: none;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        .auth-input.error {
          border-bottom-color: #ff6b6b;
        }

        .auth-button {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #00ffc8, #00a080);
          border: none;
          border-radius: 0;
          color: #000;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.3);
          position: relative;
          overflow: hidden;
        }

        .auth-button:hover {
          box-shadow: 0 4px 20px rgba(0, 255, 200, 0.45);
        }

        .auth-button:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 0.8s ease-in-out;
        }

        .auth-button:active {
          transform: scale(0.985);
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .auth-link {
          color: #00ffc8;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .auth-link:hover {
          text-shadow: 0 0 10px rgba(0, 255, 200, 0.5);
        }

        @media (max-width: 1024px) {
          .auth-visual {
            display: none !important;
          }
          .auth-form-container {
            width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px !important;
          }
          .auth-title {
            font-size: 28px !important;
          }
        }
      `}</style>

      {/* Left Panel - Form */}
      <div className="auth-form-container" style={{
        width: '42%',
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          padding: '40px',
          animation: 'slideUp 0.8s ease-out',
          position: 'relative',
          zIndex: 1,
        }}>
          {children}
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="auth-visual" style={{
        width: '58%',
        minHeight: '100vh',
        background: '#0a0a0f',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Animated background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(0, 255, 200, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(100, 0, 255, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0, 100, 255, 0.04) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Data streams */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${10 + i * 12}%`,
            top: 0,
            width: '1px',
            height: '100%',
            overflow: 'hidden',
            opacity: 0.1,
          }}>
            <div style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(to bottom, transparent, #00ffc8, transparent)',
              animation: `dataStream ${6 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
          </div>
        ))}

        {/* Main orb */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `
            radial-gradient(ellipse at 30% 30%, rgba(0, 255, 200, 0.4), transparent 60%),
            radial-gradient(ellipse at 70% 70%, rgba(100, 0, 255, 0.3), transparent 60%),
            linear-gradient(135deg, rgba(0, 255, 200, 0.1), rgba(100, 0, 255, 0.1))
          `,
          boxShadow: `
            0 0 80px rgba(0, 255, 200, 0.3),
            0 0 160px rgba(0, 255, 200, 0.1),
            inset 0 0 60px rgba(0, 0, 0, 0.5)
          `,
          animation: 'pulse 4s ease-in-out infinite',
        }}>
          <div style={{
            position: 'absolute',
            inset: '20px',
            border: '1px solid rgba(0, 255, 200, 0.2)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            inset: '50px',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            inset: '80px',
            background: 'radial-gradient(circle, rgba(0, 255, 200, 0.5), transparent 70%)',
            borderRadius: '50%',
          }} />
        </div>

        {/* Floating card - Bias Detected */}
        <div style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          background: 'rgba(20, 20, 30, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 200, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          animation: 'float 6s ease-in-out infinite',
        }}>
          <div style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
          }}>BIAS DETECTED</div>
          <div style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#ff6b6b',
          }}>-23.4%</div>
          <div style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
          }}>Sample skew in Q3 data</div>
        </div>

        {/* Floating card - Model Accuracy */}
        <div style={{
          position: 'absolute',
          bottom: '18%',
          left: '8%',
          background: 'rgba(20, 20, 30, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(100, 0, 255, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          animation: 'floatReverse 7s ease-in-out infinite',
        }}>
          <div style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
          }}>MODEL ACCURACY</div>
          <div style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#00ffc8',
          }}>94.7%</div>
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px',
          }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{
                width: '8px',
                height: '20px',
                background: i < 9 ? 'linear-gradient(to top, #00ffc8, #00a0ff)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
              }} />
            ))}
          </div>
        </div>

        {/* Floating card - AI Insight */}
        <div style={{
          position: 'absolute',
          top: '58%',
          right: '5%',
          background: 'rgba(20, 20, 30, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 200, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '2s',
        }}>
          <div style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '11px',
            color: '#00ffc8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#00ffc8',
              borderRadius: '50%',
              boxShadow: '0 0 10px #00ffc8',
            }} />
            AI INSIGHT READY
          </div>
        </div>

        {/* Orbit particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '10px',
            height: '10px',
            marginLeft: '-5px',
            marginTop: '-5px',
            background: i % 2 === 0 ? '#00ffc8' : '#a855f7',
            borderRadius: '50%',
            boxShadow: `0 0 20px ${i % 2 === 0 ? '#00ffc8' : '#a855f7'}`,
            transform: `rotate(${i * 60}deg) translateX(${180 + i * 10}px)`,
            animation: `pulse ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
};
