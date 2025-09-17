export function PinFoodSection() {
  return (
    <section
      style={{
        background: "var(--fuzo-yellow)",
        padding: "80px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            background: "var(--fuzo-white)",
            borderRadius: "16px",
            padding: "48px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  height: "256px",
                  background:
                    "linear-gradient(135deg, #BFDBFE 0%, #A7F3D0 100%)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "64px",
                }}
              >
                🗺️
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "var(--fuzo-coral)",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                📍 Map View
              </div>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "var(--fuzo-navy)",
                  marginBottom: "24px",
                  lineHeight: 1.2,
                }}
              >
                Pin Your Food Adventures
              </h2>
              <p
                style={{
                  fontSize: "18px",
                  color: "rgba(11, 31, 58, 0.8)",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                }}
              >
                Mark your favorite restaurants, discover hidden gems, and create
                your personal food map. Tako helps you remember every delicious
                moment and guides you to new culinary experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
