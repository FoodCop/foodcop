import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        // Primary - Yellow default, orange hover, white active
        default: "bg-[var(--button-bg-default)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)] active:bg-[var(--button-bg-active)]",

        // Secondary - Transparent with hover
        secondary: "bg-transparent text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]",

        // Accent - Already yellow
        accent: "bg-[var(--button-bg-default)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]",

        // Destructive - Error Red
        destructive: "bg-red-500 text-white hover:bg-red-600",

        // Outline - Bordered
        outline: "border-2 border-gray-300 text-[var(--button-text)] bg-transparent hover:bg-[var(--button-bg-hover)] hover:border-[var(--button-bg-hover)]",

        // Ghost - Minimal
        ghost: "text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]",

        // Link Style
        link: "text-[var(--button-text)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
