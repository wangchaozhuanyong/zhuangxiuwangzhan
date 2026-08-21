import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PublicCinematicMotion = () => {
  const location = useLocation();

  useGSAP((_, contextSafe) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animatedHeroes = new WeakSet<HTMLElement>();
    const animatedSections = new WeakSet<HTMLElement>();
    const animatedMedia = new WeakSet<HTMLElement>();
    let setupFrame = 0;
    let refreshTimer = 0;

    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 90);
    };

    const scan = contextSafe(() => {
      const root = document.getElementById("main-content");
      if (!root) return;

      const heroMedia = root.querySelector<HTMLElement>(
        ":is(.forest-home-hero__media, .page-hero__media, .product-detail-opening__media)",
      );
      const hero = heroMedia?.closest<HTMLElement>(
        ":is(.forest-home-hero, .page-hero, .product-detail-opening)",
      );

      if (hero && !animatedHeroes.has(hero)) {
        animatedHeroes.add(hero);
        const heroImage = heroMedia?.querySelector<HTMLElement>("img");
        const heroCopy = hero.querySelectorAll<HTMLElement>(
          ":is(.forest-kicker, .page-hero__label, .new-client-page__eyebrow, h1, .forest-home-hero__copy > p, .page-hero__description, .page-hero__meta, .page-hero__actions, .forest-home-hero__actions, .product-detail-opening__description, .product-detail-actions)",
        );
        const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (heroImage) {
          entrance.fromTo(heroImage, { scale: 1.025, autoAlpha: 0.78 }, { scale: 1, autoAlpha: 1, duration: 0.82 }, 0);
        }
        if (heroCopy.length) {
          entrance.fromTo(heroCopy, { y: 20 }, { y: 0, duration: 0.58, stagger: 0.045 }, 0.1);
        }
        entrance.fromTo(".site-header__inner", { y: -7 }, { y: 0, duration: 0.4 }, 0.38);
      }

      const sections = root.querySelectorAll<HTMLElement>(
        "[data-cinematic-section], .forest-home > section:not(.forest-trust-rail):not(.forest-promo-band), main > section:not(.page-hero):not(.product-detail-opening)",
      );
      sections.forEach((section) => {
        if (animatedSections.has(section) || section.closest("[aria-hidden='true']")) return;
        animatedSections.add(section);
        gsap.fromTo(
          section,
          { y: 18 },
          {
            y: 0,
            duration: 0.58,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 90%", once: true },
          },
        );
      });

      if (window.matchMedia("(min-width: 1024px)").matches) {
        root.querySelectorAll<HTMLElement>("[data-cinematic-media]").forEach((media) => {
          if (animatedMedia.has(media)) return;
          const image = media.querySelector<HTMLElement>("img");
          if (!image) return;
          animatedMedia.add(media);
          gsap.fromTo(
            image,
            { scale: 1.018 },
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
        });
      }

      refresh();
    });

    const scheduleScan = () => {
      window.cancelAnimationFrame(setupFrame);
      setupFrame = window.requestAnimationFrame(scan);
    };

    const root = document.getElementById("main-content");
    const observer = root ? new MutationObserver(scheduleScan) : null;
    observer?.observe(root as HTMLElement, { childList: true, subtree: true });
    window.addEventListener("load", scheduleScan, { once: true });
    window.addEventListener("resize", scheduleScan);
    scheduleScan();

    return () => {
      window.cancelAnimationFrame(setupFrame);
      window.clearTimeout(refreshTimer);
      observer?.disconnect();
      window.removeEventListener("load", scheduleScan);
      window.removeEventListener("resize", scheduleScan);
    };
  }, { dependencies: [location.pathname], revertOnUpdate: true });

  return null;
};

export default PublicCinematicMotion;
