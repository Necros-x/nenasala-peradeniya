"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

interface CounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function Counter({ value, suffix = "", duration = 2, className = "" }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: duration,
        ease: [0.22, 1, 0.36, 1], // Matching project-wide easing
      });
      return controls.stop;
    }
  }, [isInView, value, duration, motionValue]);

  const displayValue = useTransform(motionValue, (latest) =>
    Intl.NumberFormat("en-US").format(Math.round(latest))
  );

  return (
    <span className={className} ref={ref}>
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
