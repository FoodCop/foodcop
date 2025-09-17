import { ImageWithFallback } from '../figma/ImageWithFallback';

interface HeroSectionProps {
  onNavigateToSignup?: () => void;
}

export function HeroSection({ onNavigateToSignup }: HeroSectionProps) {

  return (
    <section style={{
      position: 'relative',
      padding: '80px 0',
      background: 'linear-gradient(135deg, #FFF5F2 0%, #FFE8E5 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Background Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)'
      }}></div>
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        width: '100%'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'var(--fuzo-navy)',
                lineHeight: 1.2,
                marginBottom: '16px'
              }}>
                Welcome to <span style={{ color: 'var(--fuzo-coral)' }}>FUZO</span>
              </h1>
              <p style={{
                fontSize: '20px',
                color: '#666',
                maxWidth: '500px',
                lineHeight: 1.6
              }}>
                Discover, cook, and share amazing food adventures with Tako, your friendly food companion. Join our community of food lovers today!
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <button 
                onClick={onNavigateToSignup}
                style={{
                  padding: '16px 32px',
                  background: 'var(--fuzo-coral)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(241, 76, 53, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  const target = e.currentTarget;
                  target.style.background = '#E03A28';
                  target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  const target = e.currentTarget;
                  target.style.background = 'var(--fuzo-coral)';
                  target.style.transform = 'scale(1)';
                }}
              >
                Get Started
              </button>
              <button style={{
                padding: '16px 32px',
                background: 'transparent',
                color: 'var(--fuzo-coral)',
                border: '2px solid var(--fuzo-coral)',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                Learn More
              </button>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '100%',
              height: '320px',
              background: 'linear-gradient(135deg, #FFE4CC 0%, #FFD1B3 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '96px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}>
              🦑
            </div>
            <div style={{
              position: 'absolute',
              top: '-16px',
              right: '-16px',
              width: '96px',
              height: '96px',
              background: 'var(--fuzo-yellow)',
              borderRadius: '50%',
              opacity: 0.2
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-32px',
              left: '-32px',
              width: '128px',
              height: '128px',
              background: 'var(--fuzo-coral)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
