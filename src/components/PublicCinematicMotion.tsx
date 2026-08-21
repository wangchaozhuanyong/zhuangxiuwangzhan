import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PublicCinematicMotion = () => {
  const location = useLocation();

  useGSAP((_, contextSafe) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prefersNativeTouchScroll = window.matchMedia(
      "(max-width: 767px), (hover: none) and (pointer: coarse)",
    ).matches;

    // ScrollTrigger refreshes can interrupt inertial scrolling when mobile
    // browser chrome changes the visual viewport or lazy images mount. Keep
    // touch devices on the browser's native scrolling path instead.
    if (prefersReducedMotion || prefersNativeTouchScroll) return;

    const animatedHeroes = new WeakSet<HTMLElement>();
    const animatedSections = new WeakSet<HTMLElement>();
    const animatedMedia = new WeakSet<HTMLElement>();
    const ownedTriggers = new Set<ScrollTrigger>();
    let setupFrame = 0;
    let refreshTimer = 0;

    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 90);
    };

    const scan = contextSafe(() => {
      const root = document.querySelector<HTMLElement>(".scheme-a-public-shell");
      if (!root) return;
      let addedScrollTrigger = false;

      const heroMedia = root.querySelector<HTMLElement>(
        ":is(.scheme-a-hero__media, .fc-route-hero-media, .forest-home-hero__media, .page-hero__media, .product-detail-opening__media)",
      );
      const hero = heroMedia?.closest<HTMLElement>(
        ":is(.scheme-a-hero, .fc-route-hero, .forest-home-hero, .page-hero, .product-detail-opening)",
      );

      if (hero && !animatedHeroes.has(hero)) {
        animatedHeroes.add(hero);
        const heroImage = heroMedia?.querySelector<HTMLElement>("img");
        const heroCopy = hero.querySelectorAll<HTMLElement>(
          ":is(.scheme-a-eyebrow, .forest-kicker, .page-hero__label, .new-client-page__eyebrow, h1, .scheme-a-hero__lead, .forest-home-hero__copy > p, .page-hero__description, .page-hero__meta, .page-hero__actions, .scheme-a-actions, .forest-home-hero__actions, .product-detail-opening__description, .product-detail-actions)",
        );
        const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });

        entrance.fromTo(heroMedia, { opacity: 0.82 }, { opacity: 1, duration: 0.82 }, 0);
        if (heroImage) {
          entrance.fromTo(
            heroImage,
            { scale: 1.055 },
            { scale: 1, duration: 0.88 },
            0,
          );
        }
        if (heroCopy.length) {
          entrance.fromTo(
            heroCopy,
            { y: 28, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.68, stagger: 0.065 },
            0.08,
          );
        }
        entrance.fromTo(
          ".scheme-a-chrome__bar",
          { y: -10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.48 },
          0.42,
        );
      }

      const sections = root.querySelectorAll<HTMLElement>(
        "[data-cinematic-section], .scheme-a-home > section:not(.scheme-a-hero), .fc-route-page > section:not(.fc-route-hero), .forest-home > section:not(.forest-trust-rail):not(.forest-promo-band)",
      );
      sections.forEach((section) => {
        if (animatedSections.has(section) || section.closest("[aria-hidden='true']")) return;
        animatedSections.add(section);
        const sectionTween = gsap.fromTo(
          section,
          { y: 34, opacity: 0.78 },
          {
            y: 0,
            opacity: 1,
            duration: 0.76,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 88%", once: true },
          },
        );
        if (sectionTween.scrollTrigger) {
          ownedTriggers.add(sectionTween.scrollTrigger);
          addedScrollTrigger = true;
        }
      });

      if (window.matchMedia("(min-width: 1024px)").matches) {
        root.querySelectorAll<HTMLElement>("[data-cinematic-media]").forEach((media) => {
          if (animatedMedia.has(media)) return;
          const image = media.querySelector<HTMLElement>("img");
          if (!image) return;
          animatedMedia.add(media);
          const mediaTween = gsap.fromTo(
            image,
            { scale: 1.035 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: media,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
              },
            },
          );
          if (mediaTween.scrollTrigger) {
            ownedTriggers.add(mediaTween.scrollTrigger);
            addedScrollTrigger = true;
          }
        });
      }

      if (addedScrollTrigger) refresh();
    });

    const scheduleScan = () => {
      window.cancelAnimationFrame(setupFrame);
      setupFrame = window.requestAnimationFrame(scan);
    };

    const root = document.querySelector<HTMLElement>(".scheme-a-public-shell");
    const observer = root ? new MutationObserver(scheduleScan) : null;
    observer?.observe(root as HTMLElement, { childList: true, subtree: true });
    window.addEventListener("load", scheduleScan, { once: true });
    window.addEventListener("pageshow", scheduleScan);
    document.fonts?.ready.then(scheduleScan).catch(() => undefined);
    scheduleScan();

    return () => {
      window.cancelAnimationFrame(setupFrame);
      window.clearTimeout(refreshTimer);
      observer?.disconnect();
      ownedTriggers.forEach((trigger) => trigger.kill());
      window.removeEventListener("load", scheduleScan);
      window.removeEventListener("pageshow", scheduleScan);
    };
  }, { dependencies: [location.pathname], revertOnUpdate: true });

  return null;
};

export default PublicCinematicMotion;
