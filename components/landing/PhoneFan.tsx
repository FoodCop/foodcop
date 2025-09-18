// components/PhoneFan.tsx
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

/**
 * Props: pass image URLs for the three phone screens.
 * Place <PhoneFan /> anywhere on the LP (usually after the hero).
 */
export default function PhoneFan({
  leftSrc = "/img/screen-left.jpg",
  centerSrc = "/img/screen-center.jpg",
  rightSrc = "/img/screen-right.jpg",
}: {
  leftSrc?: string;
  centerSrc?: string;
  rightSrc?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // progress = 0 when the section top hits viewport bottom; 1 when section bottom hits viewport top
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const prefersReduced = useReducedMotion();

  // fan-out in the middle (0.3 → 0.7), closed at the ends (0 and 1)
  const key = [0, 0.3, 0.5, 0.7, 1];

  // Left phone transforms
  const leftX = useTransform(scrollYProgress, key, [0, -90, -110, -90, 0]);
  const leftR = useTransform(scrollYProgress, key, [0, -12, -14, -12, 0]);
  const leftS = useTransform(scrollYProgress, key, [0.96, 1, 1.02, 1, 0.96]);
  const leftShadow = useTransform(
    scrollYProgress,
    key,
    [0.2, 0.5, 0.7, 0.5, 0.2]
  );

  // Center phone pops slightly
  const cY = useTransform(scrollYProgress, key, [10, 0, -10, 0, 10]);
  const cS = useTransform(scrollYProgress, key, [0.95, 1, 1.04, 1, 0.95]);

  // Right phone transforms (mirror of left)
  const rightX = useTransform(scrollYProgress, key, [0, 90, 110, 90, 0]);
  const rightR = useTransform(scrollYProgress, key, [0, 12, 14, 12, 0]);
  const rightS = useTransform(scrollYProgress, key, [0.96, 1, 1.02, 1, 0.96]);
  const rightShadow = useTransform(
    scrollYProgress,
    key,
    [0.2, 0.5, 0.7, 0.5, 0.2]
  );

  const MotionDiv = prefersReduced ? "div" : motion.div;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-28 md:py-36"
      aria-label="FUZO mobile previews"
    >
      {/* soft gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F14C35]/10 via-[#FF8C3A]/10 to-[#FFD74A]/20" />
      <div className="mx-auto grid max-w-6xl place-items-center px-6">
        <div className="relative h-[70vh] w-full max-w-5xl">
          {/* Left phone */}
          <MotionDiv
            className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={
              !prefersReduced
                ? { x: leftX, rotateZ: leftR, scale: leftS }
                : undefined
            }
            aria-hidden
          >
            <PhoneFrame
              src={leftSrc}
              shadowOpacity={!prefersReduced ? leftShadow : undefined}
              className="origin-center"
            />
          </MotionDiv>

          {/* Center phone */}
          <MotionDiv
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={!prefersReduced ? { y: cY, scale: cS } : undefined}
          >
            <PhoneFrame src={centerSrc} elevated />
          </MotionDiv>

          {/* Right phone */}
          <MotionDiv
            className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={
              !prefersReduced
                ? { x: rightX, rotateZ: rightR, scale: rightS }
                : undefined
            }
            aria-hidden
          >
            <PhoneFrame
              src={rightSrc}
              shadowOpacity={!prefersReduced ? rightShadow : undefined}
              className="origin-center"
            />
          </MotionDiv>
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
  shadowOpacity,
}: {
  src: string;
  className?: string;
  elevated?: boolean;
  shadowOpacity?: any; // MotionValue<number> | undefined
}) {
  return (
    <motion.div
      className={`relative aspect-[9/19.5] w-40 sm:w-52 md:w-64 rounded-[2rem] border-[10px] border-zinc-900 bg-black overflow-hidden ${className}`}
      style={{
        boxShadow: elevated
          ? "0 30px 80px rgba(0,0,0,.35)"
          : shadowOpacity
          ? shadowOpacity.to
            ? (shadowOpacity as any).to(
                (v: number) => `0 20px 60px rgba(0,0,0,${v})`
              )
            : `0 20px 60px rgba(0,0,0,.25)`
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


