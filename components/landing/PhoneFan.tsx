"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./PhoneFan.module.css";

/**
 * A reusable element that displays three phones in a fanning animation on scroll.
 * Control the size of this element with the `className` prop.
 */
export function PhoneFan({
  leftSrc = "/img/screen-left.jpg",
  centerSrc = "/img/screen-center.jpg",
  rightSrc = "/img/screen-right.jpg",
  className = "",
}: {
  leftSrc?: string;
  centerSrc?: string;
  rightSrc?: string;
  className?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const prefersReduced = useReducedMotion();

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const MotionDiv = prefersReduced ? "div" : motion.div;

  // Don't render animated content until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className={`relative ${className}`}>
        {/* Static fallback during hydration */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <PhoneFrame src={centerSrc} elevated />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Left phone */}
      <MotionDiv
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        initial={{ x: -150, y: -51, rotateZ: -20, scale: 0.597 }}
        animate={{ x: -150, y: -51, rotateZ: -20, scale: 0.597 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        aria-hidden
      >
        <PhoneFrame src={leftSrc} className="origin-bottom" />
      </MotionDiv>

      {/* Center phone */}
      <MotionDiv
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        initial={{ y: -10, scale: 0.676 }}
        animate={{ y: -10, scale: 0.676 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <PhoneFrame src={centerSrc} elevated />
      </MotionDiv>

      {/* Right phone */}
      <MotionDiv
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        initial={{ x: 150, y: -51, rotateZ: 20, scale: 0.597 }}
        animate={{ x: 150, y: -51, rotateZ: 20, scale: 0.597 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        aria-hidden
      >
        <PhoneFrame src={rightSrc} className="origin-bottom" />
      </MotionDiv>
    </div>
  );
}

/**
 * A full-width section component that showcases the PhoneFan animation.
 */
export function PhoneFanSection({
  leftSrc,
  centerSrc,
  rightSrc,
}: {
  leftSrc?: string;
  centerSrc?: string;
  rightSrc?: string;
}) {
  return (
    <section
      className="relative overflow-hidden py-28 md:py-36"
      style={{ position: "relative" }} // Ensure non-static position for Framer Motion
      aria-label="FUZO mobile previews"
    >
      {/* soft gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F14C35]/10 via-[#FF8C3A]/10 to-[#FFD74A]/20" />
      <div className="mx-auto grid max-w-6xl place-items-center px-6">
        <div
          className={`${styles.phonefanContainer} h-[60vh] md:h-[70vh] w-full max-w-5xl`}
        >
          <PhoneFan
            leftSrc={leftSrc}
            centerSrc={centerSrc}
            rightSrc={rightSrc}
            className="h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}

/** A lightweight "phone" with bezel + notch; screen fills the frame. */
function PhoneFrame({
  src,
  className = "",
  elevated = false,
}: {
  src: string;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <motion.div
      className={`relative aspect-[9/19.5] w-40 sm:w-52 md:w-64 rounded-[2rem] border-[10px] border-zinc-900 bg-black overflow-hidden ${styles.phoneFrame} ${className}`}
      style={{
        boxShadow: elevated
          ? "0 30px 80px rgba(0,0,0,.35)"
          : "0 20px 60px rgba(0,0,0,.25)",
      }}
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
      {/* Screen */}
      <img
        alt=""
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Side buttons (purely decorative) */}
      <div className="absolute left-0 top-16 h-10 w-1 rounded-r bg-zinc-800/80" />
      <div className="absolute right-0 top-24 h-16 w-1 rounded-l bg-zinc-800/80" />
    </motion.div>
  );
}
