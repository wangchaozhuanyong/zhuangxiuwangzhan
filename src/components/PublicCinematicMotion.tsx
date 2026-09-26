import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { stripLanguagePrefix } from "@/i18n/routes";

const SECTION_SELECTOR = [
  "[data-cinematic-section]",
  ".scheme-a-home > section:not(.scheme-a-hero)",
  ".fc-route-page > section:not(.fc-route-hero)",
  ".forest-home > section:not(.forest-trust-rail):not(.forest-promo-band)",
].join(", ");

const PublicCinematicMotion = () => {
  const location = useLocation();
  const publicPath = stripLanguagePrefix(location.pathname);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".scheme-a-public-shell");
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
    const seen = new WeakSet<HTMLElement>();
    const observer = !reducedMotion && finePointer && "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target as HTMLElement;
        section.dataset.cinematicState = "visible";
        observer.unobserve(section);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 }) : null;

    // Lazy route bodies can arrive after this effect, including language switches.
    const registerSections = () => {
      root.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach((section) => {
        if (seen.has(section) || section.closest("[aria-hidden='true']")) return;
        seen.add(section);
        const isAlreadyInView = !observer || section.getBoundingClientRect().top <= window.innerHeight * 0.9;
        section.dataset.cinematicState = isAlreadyInView ? "visible" : "pending";
        if (!isAlreadyInView) observer?.observe(section);
      });
    };
    registerSections();
    const contentObserver = new MutationObserver(registerSections);
    contentObserver.observe(root, { childList: true, subtree: true });

    return () => {
      contentObserver.disconnect();
      observer?.disconnect();
    };
  }, [publicPath]);

  return null;
};

export default PublicCinematicMotion;
