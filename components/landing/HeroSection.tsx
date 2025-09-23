interface HeroSectionProps {
  onNavigateToSignup?: () => void;
}

export function HeroSection({ onNavigateToSignup }: HeroSectionProps) {
  return (
    <section
      className="relative py-20 min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)",
        backgroundImage: `url('/images/landing/Images/hero_image.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "overlay",
      }}
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)",
          animation: "gradientShift 12s ease-in-out infinite",
        }}
      />

      <div className="relative text-center text-white z-10 max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Discover extraordinary eats, hand-picked by our AI connoisseurs.
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
          Seven food-specialist AIs scan top cities to surface unmissable
          restaurants and recipes—from hawker legends to omakase gems. Pin what
          you love.
        </p>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm">
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Street Food
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Fine Dining
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Sushi
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Pastry
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Healthy
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            BBQ
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Vegan
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onNavigateToSignup}
            className="group relative px-8 py-4 bg-white text-[#F14C35] rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            style={{
              boxShadow: "0 8px 24px rgba(255, 255, 255, 0.3)",
            }}
            onMouseOver={(e) => {
              const target = e.currentTarget;
              target.style.transform = "scale(1.05)";
              target.style.boxShadow = "0 12px 32px rgba(255, 255, 255, 0.4)";
            }}
            onMouseOut={(e) => {
              const target = e.currentTarget;
              target.style.transform = "scale(1)";
              target.style.boxShadow = "0 8px 24px rgba(255, 255, 255, 0.3)";
            }}
          >
            Get today's picks
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 scale-0 group-hover:scale-100 transition-transform duration-300" />
          </button>

          <button
            onClick={onNavigateToSignup}
            className="px-8 py-4 border-2 border-white/50 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
          >
            How it works
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%,
          100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-2px) translateY(-2px);
          }
          50% {
            transform: translateX(2px) translateY(2px);
          }
          75% {
            transform: translateX(-1px) translateY(1px);
          }
        }
      `}</style>
    </section>
  );
}
