interface CookWatchSectionProps {
  onNavigateToSignup?: () => void;
}

export function CookWatchSection({ onNavigateToSignup }: CookWatchSectionProps) {
  return (
    <section
      className="py-20 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(11, 31, 58, 0.7), rgba(11, 31, 58, 0.7)), url('/images/landing/Images/camera_image.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-center">
          <div className="bg-white rounded-3xl p-8 md:p-12 max-w-2xl text-center shadow-2xl">
            <div>
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-[#F14C35] rounded-full flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/images/landing/Images/camera.png"
                    alt="Cooking icon"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
                Cook it tonight
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Short step-by-step videos and chef-level recipes matched to your taste. Healthy swaps, prep times and nutrition at a glance.
              </p>
              
              <button
                onClick={onNavigateToSignup}
                className="group relative px-8 py-4 bg-[#F14C35] text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onMouseOver={(e) => {
                  const target = e.currentTarget;
                  target.style.transform = "scale(1.05)";
                  target.style.boxShadow = "0 12px 32px rgba(241, 76, 53, 0.4)";
                }}
                onMouseOut={(e) => {
                  const target = e.currentTarget;
                  target.style.transform = "scale(1)";
                  target.style.boxShadow = "0 8px 24px rgba(241, 76, 53, 0.3)";
                }}
              >
                Browse recipes
                <div className="absolute inset-0 rounded-xl ring-2 ring-[#F14C35]/50 scale-0 group-hover:scale-100 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
