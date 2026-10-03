import type { CSSProperties } from "react";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";

/** Shared public interaction timings. CSS reads the matching custom properties. */
export const PUBLIC_MOTION = {
  handoff: 240,
  exit: 120,
  enter: 320,
  image: 200,
  menuClose: 180,
  control: 180,
  hover: 220,
  feedbackDelay: INTERACTION_POLICY.feedbackDelay,
  timeout: INTERACTION_POLICY.recoveryDelay,
  scroll: 320,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const publicMotionStyle = {
  "--motion-handoff": `${PUBLIC_MOTION.handoff}ms`,
  "--motion-image": `${PUBLIC_MOTION.image}ms`,
  "--motion-close": `${PUBLIC_MOTION.menuClose}ms`,
  "--motion-feedback": "140ms",
  "--motion-control": `${PUBLIC_MOTION.control}ms`,
  "--motion-hover": `${PUBLIC_MOTION.hover}ms`,
  "--motion-ease": PUBLIC_MOTION.easing,
} as CSSProperties;
