export function CookWatchSection() {
  return (
    <section
      style={{
        padding: "80px 0",
        position: "relative",
        backgroundImage: `linear-gradient(rgba(11, 31, 58, 0.7), rgba(11, 31, 58, 0.7)), url('https://images.unsplash.com/photo-1654064755996-80036b6e6984?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHhjb29raW5nJTIwa2l0Y2hlbiUyMHV0ZW5zaWxzJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NTY4MzI5NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
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
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--fuzo-white)",
              borderRadius: "16px",
              padding: "48px",
              maxWidth: "600px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "var(--fuzo-coral)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "48px" }}>👨‍🍳</span>
                </div>
              </div>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "var(--fuzo-navy)",
                  marginBottom: "24px",
                }}
              >
                Cook, Watch & Try
              </h2>
              <p
                style={{
                  fontSize: "18px",
                  color: "rgba(11, 31, 58, 0.8)",
                  lineHeight: 1.6,
                }}
              >
                Follow step-by-step cooking videos, try new recipes from around
                the world, and share your culinary creations with the FUZO
                community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
