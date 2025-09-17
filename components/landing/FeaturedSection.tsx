import React from "react";

interface FeaturedSectionProps {
  // Layout configuration
  layout?: "centered" | "split" | "card";
  backgroundType?: "solid" | "gradient" | "image";
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;

  // Content
  icon?: string;
  iconBackgroundColor?: string;
  title: string;
  description: string;

  // Visual elements
  visualContent?: React.ReactNode;

  // Styling
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  cardBackground?: string;
  maxWidth?: string;
  padding?: string;

  // Actions
  actions?: React.ReactNode;
}

export function FeaturedSection({
  layout = "split",
  backgroundType = "solid",
  backgroundColor = "var(--fuzo-white)",
  backgroundImage,
  backgroundGradient,
  icon,
  iconBackgroundColor = "var(--fuzo-coral)",
  title,
  description,
  visualContent,
  textAlign = "left",
  textColor = "var(--fuzo-navy)",
  cardBackground = "var(--fuzo-white)",
  maxWidth = "1200px",
  padding = "80px 0",
  actions,
}: FeaturedSectionProps) {
  // Generate background style
  const getBackgroundStyle = () => {
    const baseStyle: React.CSSProperties = {
      padding,
      position: "relative",
    };

    switch (backgroundType) {
      case "solid":
        return { ...baseStyle, background: backgroundColor };
      case "gradient":
        return {
          ...baseStyle,
          background: backgroundGradient || backgroundColor,
        };
      case "image":
        return {
          ...baseStyle,
          backgroundImage: backgroundImage
            ? `linear-gradient(rgba(11, 31, 58, 0.7), rgba(11, 31, 58, 0.7)), url('${backgroundImage}')`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        };
      default:
        return { ...baseStyle, background: backgroundColor };
    }
  };

  // Render content based on layout
  const renderContent = () => {
    const contentStyle: React.CSSProperties = {
      maxWidth,
      margin: "0 auto",
      padding: "0 20px",
    };

    const textContent = (
      <div style={{ textAlign }}>
        {icon && (
          <div
            style={{
              display: "flex",
              justifyContent:
                textAlign === "center"
                  ? "center"
                  : textAlign === "right"
                  ? "flex-end"
                  : "flex-start",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: iconBackgroundColor,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
              }}
            >
              {icon}
            </div>
          </div>
        )}

        <h2
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: textColor,
            marginBottom: "24px",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize: "18px",
            color:
              textColor === "var(--fuzo-navy)"
                ? "rgba(11, 31, 58, 0.8)"
                : "rgba(255, 255, 255, 0.9)",
            lineHeight: 1.6,
            marginBottom: actions ? "24px" : "0",
          }}
        >
          {description}
        </p>

        {actions && <div>{actions}</div>}
      </div>
    );

    switch (layout) {
      case "centered":
        return (
          <div style={contentStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  background: cardBackground,
                  borderRadius: "16px",
                  padding: "48px",
                  maxWidth: "600px",
                  textAlign: "center",
                  boxShadow:
                    backgroundType === "image"
                      ? "0 20px 40px rgba(0, 0, 0, 0.2)"
                      : "0 20px 40px rgba(0, 0, 0, 0.1)",
                }}
              >
                {textContent}
              </div>
            </div>
          </div>
        );

      case "card":
        return (
          <div style={contentStyle}>
            <div
              style={{
                background: cardBackground,
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
                {visualContent && <div>{visualContent}</div>}
                <div>{textContent}</div>
              </div>
            </div>
          </div>
        );

      case "split":
      default:
        return (
          <div style={contentStyle}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "48px",
                alignItems: "center",
              }}
            >
              {visualContent && <div>{visualContent}</div>}
              <div>{textContent}</div>
            </div>
          </div>
        );
    }
  };

  return <section style={getBackgroundStyle()}>{renderContent()}</section>;
}
