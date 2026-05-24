

## Problem Analysis

The Hero section content (title, description, CTAs, stats) is constrained to `max-w-xl` and left-aligned within a centered `max-w-6xl` container. On wide desktop screens, this creates a visually lopsided layout where everything clusters on the left ~40% of the viewport.

## Plan

### File: `src/components/sections/HeroSection.tsx`

**Desktop-only centering** — wrap hero content to center on `md:` breakpoints while preserving mobile left-alignment:

1. Change the inner `<div className="max-w-xl">` to center on desktop: add `md:mx-auto md:text-center md:max-w-2xl` (wider max-width for desktop readability)
2. Center the subtitle `<p>` tag on desktop: add `md:mx-auto`
3. Center CTA buttons on desktop: add `sm:justify-center`
4. Center the description paragraph on desktop: add `md:mx-auto`
5. Center HeroStats on desktop: update flex alignment to `sm:justify-center`
6. Adjust the background gradient from left-bias (`from-black/60 via-black/25 to-transparent`) to a center-friendly overlay (`bg-black/40`) on desktop, keeping the directional gradient on mobile
7. Stats row: change `sm:text-left` to `sm:text-center` for balanced appearance

All changes use `md:` or `sm:` prefixes only, so mobile layout remains completely untouched.

### Summary of visual effect
- Desktop: content centered in viewport, wider text block (max-w-2xl), centered buttons and stats
- Mobile: no changes at all

