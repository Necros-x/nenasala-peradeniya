import { Variants } from "framer-motion";

const customEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: customEase,
    },
  },
};

export const textMaskReveal: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: (custom: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: customEase,
      delay: custom * 0.1,
    },
  }),
};

export const imageScaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: customEase,
    },
  },
};

export const cardFadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: customEase,
    },
  },
};
