interface HeroSectionProps {
  onNavigateToSignup?: () => void;
}

export function HeroSection({ onNavigateToSignup }: HeroSectionProps) {
  return (
    <section
      style={{
        position: "relative",
        padding: "80px 0",
        backgroundImage: `url('/images/landing/Images/share-image.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "white",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            marginBottom: "32px",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
          }}
        >
          The undiscovered gastronomy.
        </h1>
        <button
          onClick={onNavigateToSignup}
          style={{
            padding: "20px 40px",
            background: "var(--fuzo-coral)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(241, 76, 53, 0.4)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            const target = e.currentTarget;
            target.style.background = "#E03A28";
            target.style.transform = "scale(1.05)";
            target.style.boxShadow = "0 12px 32px rgba(241, 76, 53, 0.6)";
          }}
          onMouseOut={(e) => {
            const target = e.currentTarget;
            target.style.background = "var(--fuzo-coral)";
            target.style.transform = "scale(1)";
            target.style.boxShadow = "0 8px 24px rgba(241, 76, 53, 0.4)";
          }}
        >
          Sign Up
        </button>
      </div>
    </section>
  );
}
