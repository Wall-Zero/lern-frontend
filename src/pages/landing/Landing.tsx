import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DataFutureLanding = () => {
  const [phase, setPhase] = useState<'terminal' | 'glitching' | 'future'>('terminal');
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const navigate = useNavigate();

  const fullText = "Take me to the future of analysis";

  // Typing effect
  useEffect(() => {
    if (phase !== 'terminal') return;

    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 80 + Math.random() * 60);
      return () => clearTimeout(timeout);
    } else {
      // Finished typing, wait then glitch
      const timeout = setTimeout(() => {
        setPhase('glitching');
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [typedText, phase]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Glitch transition
  useEffect(() => {
    if (phase !== 'glitching') return;

    let intensity = 0;
    const interval = setInterval(() => {
      intensity += 0.05;
      setGlitchIntensity(intensity);

      if (intensity >= 1) {
        clearInterval(interval);
        setPhase('future');
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase]);

  const handleLaunchApp = () => {
    navigate('/login');
  };

  const handleStartTrial = () => {
    navigate('/register');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: phase === 'future' ? '#0a0a0f' : '#0d0d0d',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      transition: 'background 0.8s ease'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Space+Mono:wght@400;700&family=Outfit:wght@200;300;400;500;600;700&display=swap');

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          97% { opacity: 0.9; }
        }

        @keyframes glitchText {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(3px, -3px); }
          60% { transform: translate(-3px, -3px); }
          80% { transform: translate(3px, 3px); }
        }

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
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes expandLine {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 200, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 200, 0.6); }
        }

        .crt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          z-index: 100;
        }

        .scanline {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 255, 100, 0.1);
          animation: scanline 8s linear infinite;
          z-index: 101;
        }

        .terminal-screen {
          animation: flicker 4s infinite;
        }

        .glitch-active {
          animation: glitchText 0.1s infinite;
        }

        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(0, 255, 200, 0.5);
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1);
          filter: drop-shadow(0 0 20px rgba(0, 255, 200, 0.8));
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .hero-visual {
            height: 400px !important;
            order: -1;
          }
          .features-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 16px 20px !important;
          }
          .nav-links {
            display: none !important;
          }
          .nav-button {
            padding: 8px 16px !important;
            font-size: 12px !important;
          }
          .hero-section {
            padding: 0 20px !important;
            padding-top: 100px !important;
          }
          .hero-title {
            font-size: 36px !important;
          }
          .hero-subtitle {
            font-size: 12px !important;
            letter-spacing: 1.5px !important;
          }
          .hero-description {
            font-size: 16px !important;
          }
          .hero-buttons {
            flex-direction: column !important;
          }
          .hero-buttons button {
            width: 100% !important;
          }
          .hero-visual {
            height: 300px !important;
          }
          .main-orb {
            width: 180px !important;
            height: 180px !important;
          }
          .floating-card {
            display: none !important;
          }
          .floating-card-main {
            padding: 12px !important;
            font-size: 10px !important;
          }
          .features-section {
            padding: 60px 20px !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .features-title {
            font-size: 28px !important;
          }
          .features-description {
            font-size: 14px !important;
          }
          .feature-card {
            padding: 24px !important;
          }
          .cta-section {
            padding: 60px 20px !important;
          }
          .cta-title {
            font-size: 28px !important;
          }
          .cta-description {
            font-size: 14px !important;
          }
          .cta-button {
            padding: 16px 32px !important;
            font-size: 16px !important;
          }
          .footer-container {
            flex-direction: column !important;
            gap: 24px !important;
            text-align: center !important;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 28px !important;
          }
          .hero-visual {
            height: 250px !important;
          }
          .main-orb {
            width: 140px !important;
            height: 140px !important;
          }
          .cta-title {
            font-size: 24px !important;
          }
        }
      `}</style>

      {/* Terminal Phase */}
      {(phase === 'terminal' || phase === 'glitching') && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: phase === 'glitching' ? 1 - glitchIntensity : 1,
          transition: 'opacity 0.1s'
        }}>
          <div className="crt-overlay" />
          <div className="scanline" />

          <div className={`terminal-screen ${phase === 'glitching' ? 'glitch-active' : ''}`} style={{
            background: 'linear-gradient(145deg, #0a0f0a, #0d120d)',
            border: '3px solid #1a2a1a',
            borderRadius: '20px',
            padding: '40px 50px',
            boxShadow: `
              inset 0 0 100px rgba(0, 255, 100, 0.03),
              0 0 60px rgba(0, 255, 100, 0.1),
              0 20px 60px rgba(0, 0, 0, 0.5)
            `,
            maxWidth: '700px',
            width: '90%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Screen glow effect */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              right: '-50%',
              bottom: '-50%',
              background: 'radial-gradient(ellipse at center, rgba(0, 255, 100, 0.03) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{
              fontFamily: '"VT323", monospace',
              fontSize: '28px',
              color: '#00ff66',
              textShadow: '0 0 10px rgba(0, 255, 100, 0.8), 0 0 20px rgba(0, 255, 100, 0.4)',
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{ color: '#00aa44' }}>visitor@data</span>
              <span style={{ color: '#006622' }}>:</span>
              <span style={{ color: '#00cc55' }}>~</span>
              <span style={{ color: '#006622' }}>$ </span>
              <span>{typedText}</span>
              <span style={{
                opacity: cursorVisible ? 1 : 0,
                marginLeft: '2px',
                background: '#00ff66',
                boxShadow: '0 0 10px rgba(0, 255, 100, 0.8)'
              }}>▋</span>
            </div>
          </div>

          {/* Glitch fragments */}
          {phase === 'glitching' && (
            <>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: 'fixed',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${100 + Math.random() * 200}px`,
                  height: `${20 + Math.random() * 40}px`,
                  background: i % 2 === 0 ? 'rgba(0, 255, 200, 0.3)' : 'rgba(255, 0, 100, 0.2)',
                  transform: `rotate(${Math.random() * 10 - 5}deg)`,
                  opacity: glitchIntensity * 0.5,
                  mixBlendMode: 'screen'
                }} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Future Phase */}
      {phase === 'future' && (
        <div style={{
          minHeight: '100vh',
          position: 'relative'
        }}>
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
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'fixed',
              left: `${8 + i * 8}%`,
              top: 0,
              width: '1px',
              height: '100%',
              overflow: 'hidden',
              opacity: 0.15
            }}>
              <div style={{
                width: '100%',
                height: '200px',
                background: 'linear-gradient(to bottom, transparent, #00ffc8, transparent)',
                animation: `dataStream ${6 + i * 0.5}s linear infinite`,
                animationDelay: `${i * 0.3}s`
              }} />
            </div>
          ))}

          {/* Navigation */}
          <nav className="nav-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            padding: '24px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 50,
            background: 'linear-gradient(to bottom, rgba(10, 10, 15, 0.9), transparent)',
            animation: 'slideUp 0.8s ease-out'
          }}>
            <div style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #00ffc8, #00a080)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
              }}>
                <span style={{ fontSize: '18px' }}>◈</span>
              </div>
              LERN
            </div>

            <div className="nav-links" style={{
              display: 'flex',
              gap: '40px',
              fontFamily: '"Space Mono", monospace',
              fontSize: '13px',
              letterSpacing: '0.5px'
            }}>
              {['Platform', 'Marketplace', 'Pricing', 'Docs'].map((item, i) => (
                <a key={item} href="#" style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                  animation: 'slideUp 0.8s ease-out',
                  animationDelay: `${0.1 + i * 0.05}s`,
                  animationFillMode: 'both'
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#00ffc8'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.7)'}
                >{item}</a>
              ))}
            </div>

            <button
              className="nav-button"
              onClick={handleLaunchApp}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0, 255, 200, 0.4)',
                color: '#00ffc8',
                padding: '10px 24px',
                borderRadius: '8px',
                fontFamily: '"Space Mono", monospace',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                animation: 'slideUp 0.8s ease-out',
                animationDelay: '0.3s',
                animationFillMode: 'both'
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = 'rgba(0, 255, 200, 0.1)';
                (e.target as HTMLElement).style.borderColor = '#00ffc8';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = 'transparent';
                (e.target as HTMLElement).style.borderColor = 'rgba(0, 255, 200, 0.4)';
              }}
            >
              Log In →
            </button>
          </nav>

          {/* Hero Section */}
          <section className="hero-section" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            padding: '0 48px',
            position: 'relative'
          }}>
            <div className="hero-grid" style={{
              maxWidth: '1400px',
              margin: '0 auto',
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '80px',
              alignItems: 'center'
            }}>
              {/* Left content */}
              <div>
                <div className="hero-subtitle" style={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '12px',
                  color: '#00ffc8',
                  letterSpacing: '3px',
                  marginBottom: '24px',
                  animation: 'slideUp 0.8s ease-out',
                  animationDelay: '0.4s',
                  animationFillMode: 'both',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '1px',
                    background: 'linear-gradient(to right, #00ffc8, transparent)'
                  }} />
                  THE FUTURE OF DATA ANALYTICS
                </div>

                <h1 className="hero-title" style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '72px',
                  fontWeight: 200,
                  color: '#fff',
                  lineHeight: 1.1,
                  margin: '0 0 32px 0',
                  animation: 'slideUp 0.8s ease-out',
                  animationDelay: '0.5s',
                  animationFillMode: 'both'
                }}>
                  Your AI companion that{' '}
                  <span style={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00ffc8, #00a0ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    truly understands
                  </span>{' '}
                  your data
                </h1>

                <p className="hero-description" style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '20px',
                  fontWeight: 300,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.7,
                  margin: '0 0 48px 0',
                  maxWidth: '500px',
                  animation: 'slideUp 0.8s ease-out',
                  animationDelay: '0.6s',
                  animationFillMode: 'both'
                }}>
                  Challenge your bias. Build better models. Access a marketplace of curated datasets.
                  Let intelligence amplify your analytics.
                </p>

                <div className="hero-buttons" style={{
                  display: 'flex',
                  gap: '16px',
                  animation: 'slideUp 0.8s ease-out',
                  animationDelay: '0.7s',
                  animationFillMode: 'both'
                }}>
                  <button
                    onClick={handleStartTrial}
                    style={{
                      background: 'linear-gradient(135deg, #00ffc8, #00a080)',
                      border: 'none',
                      color: '#000',
                      padding: '16px 32px',
                      borderRadius: '12px',
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 0 30px rgba(0, 255, 200, 0.3)'
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.target as HTMLElement).style.boxShadow = '0 0 50px rgba(0, 255, 200, 0.5)';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLElement).style.transform = 'translateY(0)';
                      (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(0, 255, 200, 0.3)';
                    }}
                  >
                    Start Free Trial
                  </button>

                  <button style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                    (e.target as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                    (e.target as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  >
                    <span style={{ fontSize: '20px' }}>▶</span> Watch Demo
                  </button>
                </div>
              </div>

              {/* Right visual */}
              <div className="hero-visual" style={{
                position: 'relative',
                height: '600px',
                animation: 'slideUp 1s ease-out',
                animationDelay: '0.6s',
                animationFillMode: 'both'
              }}>
                {/* Main orb */}
                <div className="main-orb" style={{
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
                  animation: 'pulse 4s ease-in-out infinite'
                }}>
                  {/* Inner rings */}
                  <div style={{
                    position: 'absolute',
                    inset: '20px',
                    border: '1px solid rgba(0, 255, 200, 0.2)',
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '50px',
                    border: '1px solid rgba(0, 255, 200, 0.3)',
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '80px',
                    background: 'radial-gradient(circle, rgba(0, 255, 200, 0.5), transparent 70%)',
                    borderRadius: '50%'
                  }} />
                </div>

                {/* Floating cards */}
                <div className="floating-card" style={{
                  position: 'absolute',
                  top: '10%',
                  right: '5%',
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
                  }}>BIAS DETECTED</div>
                  <div style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#ff6b6b'
                  }}>-23.4%</div>
                  <div style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>Sample skew in Q3 data</div>
                </div>

                <div className="floating-card" style={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '0%',
                  background: 'rgba(20, 20, 30, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(100, 0, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  animation: 'floatReverse 7s ease-in-out infinite'
                }}>
                  <div style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '8px'
                  }}>MODEL ACCURACY</div>
                  <div style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#00ffc8'
                  }}>94.7%</div>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '8px'
                  }}>
                    {[...Array(10)].map((_, i) => (
                      <div key={i} style={{
                        width: '8px',
                        height: '20px',
                        background: i < 9 ? 'linear-gradient(to top, #00ffc8, #00a0ff)' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px'
                      }} />
                    ))}
                  </div>
                </div>

                <div className="floating-card" style={{
                  position: 'absolute',
                  top: '60%',
                  right: '-5%',
                  background: 'rgba(20, 20, 30, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 255, 200, 0.2)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  animation: 'float 5s ease-in-out infinite',
                  animationDelay: '1s'
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
                    animationDelay: `${i * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="features-section" style={{
            padding: '120px 48px',
            position: 'relative'
          }}>
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '80px'
              }}>
                <h2 className="features-title" style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '48px',
                  fontWeight: 300,
                  color: '#fff',
                  margin: '0 0 24px 0'
                }}>
                  Intelligence that <span style={{ fontWeight: 600 }}>evolves</span> with your data
                </h2>
                <p className="features-description" style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Not just another analytics tool. A thinking partner that challenges assumptions
                  and uncovers what you didn't know to look for.
                </p>
              </div>

              <div className="features-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '32px'
              }}>
                {[
                  {
                    icon: '◉',
                    title: 'Bias Detection Engine',
                    description: 'AI that actively challenges your analytical blind spots. Get alerts when your models show signs of bias or when data suggests conclusions you might be overlooking.',
                    color: '#ff6b6b'
                  },
                  {
                    icon: '◈',
                    title: 'Adaptive Model Builder',
                    description: 'Build predictive models through conversation. Describe what you\'re looking for, and watch as your AI companion constructs, tests, and refines the analytics.',
                    color: '#00ffc8'
                  },
                  {
                    icon: '◇',
                    title: 'Data Marketplace',
                    description: 'Access curated datasets from verified sources. Enrich your models with external data that complements your existing analytics infrastructure.',
                    color: '#a855f7'
                  }
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="feature-card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '24px',
                      padding: '40px',
                      transition: 'all 0.4s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      className="feature-icon"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                        border: `1px solid ${feature.color}40`,
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        color: feature.color,
                        marginBottom: '24px',
                        transition: 'all 0.4s ease'
                      }}
                    >
                      {feature.icon}
                    </div>

                    <h3 style={{
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: '#fff',
                      margin: '0 0 16px 0'
                    }}>
                      {feature.title}
                    </h3>

                    <p style={{
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '15px',
                      fontWeight: 300,
                      color: 'rgba(255, 255, 255, 0.5)',
                      lineHeight: 1.7,
                      margin: 0
                    }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section" style={{
            padding: '120px 48px',
            position: 'relative'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0, 255, 200, 0.1), transparent 70%)',
                pointerEvents: 'none'
              }} />

              <h2 className="cta-title" style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '56px',
                fontWeight: 200,
                color: '#fff',
                margin: '0 0 24px 0',
                position: 'relative'
              }}>
                Ready to leave the{' '}
                <span style={{
                  fontFamily: '"VT323", monospace',
                  color: '#00ff66',
                  textShadow: '0 0 10px rgba(0, 255, 100, 0.5)'
                }}>
                  command line
                </span>{' '}
                behind?
              </h2>

              <p className="cta-description" style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '48px',
                position: 'relative'
              }}>
                Join the next generation of data analysts who work alongside intelligence.
              </p>

              <button
                className="cta-button"
                onClick={handleStartTrial}
                style={{
                  background: 'linear-gradient(135deg, #00ffc8, #00a080)',
                  border: 'none',
                  color: '#000',
                  padding: '20px 48px',
                  borderRadius: '14px',
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 0 40px rgba(0, 255, 200, 0.4)',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.target as HTMLElement).style.boxShadow = '0 0 60px rgba(0, 255, 200, 0.6)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = '0 0 40px rgba(0, 255, 200, 0.4)';
                }}
              >
                Get Early Access
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer style={{
            padding: '48px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div className="footer-container" style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.3)'
              }}>
                © 2026 LERN. The future of data analytics.
              </div>

              <div style={{
                display: 'flex',
                gap: '32px',
                fontFamily: '"Space Mono", monospace',
                fontSize: '12px'
              }}>
                {['Twitter', 'GitHub', 'Discord'].map(item => (
                  <a key={item} href="#" style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    textDecoration: 'none',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#00ffc8'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.4)'}
                  >{item}</a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default DataFutureLanding;
