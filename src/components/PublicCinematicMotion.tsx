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
    const sections = Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR))
      .filter((section) => !section.closest("[aria-hidden='true']"));

    if (reducedMotion || !finePointer || !("IntersectionObserver" in window)) {
      sections.forEach((section) => { section.dataset.cinematicState = "visible"; });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target as HTMLElement;
        section.dataset.cinematicState = "visible";
        observer.unobserve(section);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    sections.forEach((section) => {
      const isAlreadyInView = section.getBoundingClientRect().top <= window.innerHeight * 0.9;
      section.dataset.cinematicState = isAlreadyInView ? "visible" : "pending";
      if (!isAlreadyInView) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [publicPath]);

  return null;
};

export default PublicCinematicMotion;
