import { FuzoButton } from "./FuzoButton";

interface FuzoNavigationProps {
  onNavigateToSignup?: () => void;
}

export function FuzoNavigation({ onNavigateToSignup }: FuzoNavigationProps) {
  return (
    <nav
      style={{
        background: "var(--fuzo-white)",
        borderBottom: "1px solid rgba(11, 31, 58, 0.1)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
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
            justifyContent: "space-between",
            alignItems: "center",
            height: "64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", marginRight: "16px" }}>
              <button
                style={{
                  background: "var(--fuzo-coral)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                aria-label="Open menu"
                onClick={() => {
                  const menu = document.getElementById("fuzo-hamburger-menu");
                  if (menu)
                    menu.style.display =
                      menu.style.display === "block" ? "none" : "block";
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "20px",
                    height: "20px",
                    color: "white",
                    fontSize: "24px",
                    lineHeight: 1,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      y="4"
                      width="20"
                      height="2.5"
                      rx="1.25"
                      fill="white"
                    />
                    <rect
                      y="9"
                      width="20"
                      height="2.5"
                      rx="1.25"
                      fill="white"
                    />
                    <rect
                      y="14"
                      width="20"
                      height="2.5"
                      rx="1.25"
                      fill="white"
                    />
                  </svg>
                </span>
              </button>
              <div
                id="fuzo-hamburger-menu"
                style={{
                  display: "none",
                  position: "absolute",
                  top: "48px",
                  left: 0,
                  background: "var(--fuzo-white)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                  borderRadius: "12px",
                  minWidth: "160px",
                  zIndex: 100,
                  padding: "12px 0",
                }}
              >
                {[
                  { label: "Feed", page: "feed" },
                  { label: "Scout", page: "scout" },
                  { label: "Snap", page: "snap" },
                  { label: "Bites", page: "recipes" },
                  { label: "Chat", page: "chat" },
                  { label: "Profile", page: "profile" },
                ].map((item) => (
                  <a
                    key={item.page}
                    href="#"
                    style={{
                      display: "block",
                      padding: "10px 24px",
                      color: "var(--fuzo-navy)",
                      textDecoration: "none",
                      fontSize: "16px",
                      fontWeight: 500,
                      borderBottom: "1px solid rgba(11,31,58,0.07)",
                    }}
                    onClick={() => {
                      const menuEl = document.getElementById(
                        "fuzo-hamburger-menu"
                      );
                      if (menuEl) menuEl.style.display = "none";
                      // Dispatch custom navigation event consumed by PageRouter
                      window.dispatchEvent(
                        new CustomEvent("navigateToPage", { detail: item.page })
                      );
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "var(--fuzo-coral)",
                margin: 0,
              }}
            >
              FUZO
            </h1>
          </div>
          <div>
            <FuzoButton
              variant="primary"
              size="sm"
              onClick={onNavigateToSignup}
            >
              Get Started
            </FuzoButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
