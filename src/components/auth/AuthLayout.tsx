import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Space+Mono:wght@400;700&family=Outfit:wght@200;300;400;500;600;700&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
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
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 200, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 200, 0.5); }
        }

        .auth-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
        }

        .auth-input:focus {
          border-color: #00ffc8;
          background: rgba(0, 255, 200, 0.05);
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.1);
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .auth-input.error {
          border-color: #ff6b6b;
          background: rgba(255, 107, 107, 0.05);
        }

        .auth-button {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #00ffc8, #00a080);
          border: none;
          border-radius: 12px;
          color: #000;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.3);
        }

        .auth-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(0, 255, 200, 0.5);
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

        /* Mobile Responsive */
        @media (max-width: 1024px) {
          .auth-visual {
            display: none !important;
          }
          .auth-form-container {
            width: 100% !important;
            padding: 40px 20px !important;
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

      {/* Animated background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(0, 255, 200, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(100, 0, 255, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(0, 100, 255, 0.04) 0%, transparent 70%)
        `,
        pointerEvents: 'none'
      }} />

      {/* Data streams */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${10 + i * 12}%`,
          top: 0,
          width: '1px',
          height: '100%',
          overflow: 'hidden',
          opacity: 0.1
        }}>
          <div style={{
            width: '100%',
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, #00ffc8, transparent)',
            animation: `dataStream ${6 + i * 0.5}s linear infinite`,
            animationDelay: `${i * 0.4}s`
          }} />
        </div>
      ))}

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Form Side */}
        <div className="auth-form-container" style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            animation: 'slideUp 0.8s ease-out'
          }}>
            {children}
          </div>
        </div>

        {/* Visual Side */}
        <div className="auth-visual" style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '40px'
        }}>
          {/* Main orb */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '350px',
            height: '350px',
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
            animation: 'pulse 4s ease-in-out infinite'
          }}>
            <div style={{
              position: 'absolute',
              inset: '25px',
              border: '1px solid rgba(0, 255, 200, 0.2)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              inset: '60px',
              border: '1px solid rgba(0, 255, 200, 0.3)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              inset: '95px',
              background: 'radial-gradient(circle, rgba(0, 255, 200, 0.5), transparent 70%)',
              borderRadius: '50%'
            }} />
          </div>

          {/* Floating stat cards */}
          <div style={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            background: 'rgba(20, 20, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 200, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            animation: 'float 6s ease-in-out infinite'
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '8px'
            }}>MODELS TRAINED</div>
            <div style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              color: '#00ffc8'
            }}>1,247+</div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            background: 'rgba(20, 20, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(100, 0, 255, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '1s'
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '8px'
            }}>ACCURACY RATE</div>
            <div style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              color: '#a855f7'
            }}>98.5%</div>
          </div>

          <div style={{
            position: 'absolute',
            top: '55%',
            right: '5%',
            background: 'rgba(20, 20, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 200, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            animation: 'float 5s ease-in-out infinite',
            animationDelay: '2s'
          }}>
            <div style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '11px',
              color: '#00ffc8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: '#00ffc8',
                borderRadius: '50%',
                boxShadow: '0 0 10px #00ffc8'
              }} />
              SECURE CONNECTION
            </div>
          </div>

          {/* Orbit particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '8px',
              height: '8px',
              marginLeft: '-4px',
              marginTop: '-4px',
              background: i % 2 === 0 ? '#00ffc8' : '#a855f7',
              borderRadius: '50%',
              boxShadow: `0 0 15px ${i % 2 === 0 ? '#00ffc8' : '#a855f7'}`,
              transform: `rotate(${i * 60}deg) translateX(${200 + i * 10}px)`,
              animation: `pulse ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};
