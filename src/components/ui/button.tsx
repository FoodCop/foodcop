import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-button font-semibold transition-all duration-normal disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-offset-2 active:scale-95",
  {
    variants: {
      variant: {
        // Primary - FUZO Orange
        default: "bg-fuzo-orange-500 text-white rounded-button shadow-button hover:bg-fuzo-orange-600 hover:shadow-button-hover focus-visible:ring-fuzo-orange-500/30 active:bg-fuzo-orange-700",

        // Secondary - FUZO Pink
        secondary: "bg-fuzo-pink-500 text-white rounded-button shadow-button hover:bg-fuzo-pink-600 hover:shadow-button-hover focus-visible:ring-fuzo-pink-500/30 active:bg-fuzo-pink-700",

        // Accent - FUZO Purple
        accent: "bg-fuzo-purple-500 text-white rounded-button shadow-button hover:bg-fuzo-purple-600 hover:shadow-button-hover focus-visible:ring-fuzo-purple-500/30 active:bg-fuzo-purple-700",

        // Destructive - Error Red
        destructive: "bg-red-500 text-white rounded-button shadow-button hover:bg-red-600 hover:shadow-button-hover focus-visible:ring-red-500/30 active:bg-red-700",

        // Outline - Bordered Primary
        outline: "border-2 border-fuzo-orange-500 text-fuzo-orange-500 bg-transparent rounded-button hover:bg-fuzo-orange-500 hover:text-white focus-visible:ring-fuzo-orange-500/30",

        // Outline Secondary
        "outline-secondary": "border-2 border-fuzo-pink-500 text-fuzo-pink-500 bg-transparent rounded-button hover:bg-fuzo-pink-500 hover:text-white focus-visible:ring-fuzo-pink-500/30",

        // Ghost - Minimal
        ghost: "text-gray-700 hover:bg-gray-100 rounded-button active:bg-gray-200 focus-visible:ring-gray-300/30 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700",

        // Link Style
        link: "text-fuzo-orange-500 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-4 text-sm has-[>svg]:px-3",
        default: "h-11 px-6 text-base has-[>svg]:px-4",  // 44px - Touch target compliant
        lg: "h-14 px-8 text-lg has-[>svg]:px-6",
        icon: "size-11 rounded-button",  // 44px - Touch target
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
