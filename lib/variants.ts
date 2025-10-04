import { cva, type VariantProps } from "class-variance-authority";

// Hero button variants for landing page
export const heroButtonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--fuzo-coral)] text-white hover:bg-[var(--fuzo-coral-dark)] shadow-md hover:shadow-lg",
        secondary:
          "bg-[var(--fuzo-navy)] text-white hover:bg-[var(--fuzo-navy-dark)] shadow-md hover:shadow-lg",
        outline:
          "border-2 border-[var(--fuzo-coral)] text-[var(--fuzo-coral)] hover:bg-[var(--fuzo-coral)] hover:text-white",
        ghost: "text-[var(--fuzo-navy)] hover:bg-[var(--fuzo-cream)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8 text-lg",
        xl: "h-12 px-10 text-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Card variants for content sections
export const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
  {
    variants: {
      variant: {
        default: "border-border bg-background",
        elevated: "border-[var(--fuzo-coral)] bg-[var(--fuzo-cream)] shadow-lg",
        minimal: "border-transparent bg-transparent shadow-none",
      },
      padding: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

// Navigation item variants
export const navItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-[var(--fuzo-navy)] hover:text-[var(--fuzo-coral)]",
        active: "text-[var(--fuzo-coral)] bg-[var(--fuzo-cream)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type HeroButtonVariants = VariantProps<typeof heroButtonVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type NavItemVariants = VariantProps<typeof navItemVariants>;
