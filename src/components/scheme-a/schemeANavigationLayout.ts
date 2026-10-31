/** Keep width observers outside the initial public bundle; compact navigation is the safe fallback. */
export function observeSchemeANavigationLayout(
  header: HTMLElement,
  desktopTrigger: HTMLButtonElement | null,
  compactTrigger: HTMLButtonElement | null,
) {
  const bar = header?.querySelector<HTMLElement>(".scheme-a-chrome__bar");
  const brand = header?.querySelector<HTMLElement>(".scheme-a-chrome__brand");
  const navigation = header?.querySelector<HTMLElement>(".scheme-a-chrome__primary");
  const actions = header?.querySelector<HTMLElement>(".scheme-a-chrome__actions");
  if (!bar || !brand || !navigation || !actions) return;

  let frame = 0;
  let disposed = false;
  const update = () => {
    frame = 0;
    if (disposed) return;
    const active = document.activeElement;
    // Measure the full, non-shrinking navigation before choosing its layout.
    // Removing and restoring this attribute in one frame avoids a visible flash
    // and lets a previously collapsed header expand again when space returns.
    header.removeAttribute("data-navigation-compact");
    if (window.matchMedia("(min-width: 1180px)").matches) {
      const barStyle = getComputedStyle(bar);
      const navigationStyle = getComputedStyle(navigation);
      const available = bar.clientWidth - parseFloat(barStyle.paddingLeft) - parseFloat(barStyle.paddingRight);
      const required = brand.getBoundingClientRect().width + navigation.getBoundingClientRect().width
        + actions.getBoundingClientRect().width + parseFloat(navigationStyle.marginLeft)
        + parseFloat(navigationStyle.marginRight) + 2 * (parseFloat(barStyle.columnGap) || 0);
      header.toggleAttribute("data-navigation-compact", required > available + 0.5);
    }
    // A resize or language switch must not leave keyboard focus on a hidden trigger.
    if (active instanceof HTMLElement && !active.getClientRects().length) {
      if (navigation.contains(active) || active.matches(".scheme-a-chrome__quote")) compactTrigger?.focus({ preventScroll: true });
      else if (active === compactTrigger) desktopTrigger?.focus({ preventScroll: true });
    }
  };
  const schedule = () => {
    if (!disposed && !frame) frame = window.requestAnimationFrame(update);
  };
  const observer = new ResizeObserver(schedule);
  [bar, brand, navigation, actions].forEach((element) => observer.observe(element));
  const textObserver = new MutationObserver(schedule);
  [brand, navigation].forEach((element) => textObserver.observe(element, { subtree: true, childList: true, characterData: true }));
  window.addEventListener("resize", schedule, { passive: true });
  document.fonts?.addEventListener("loadingdone", schedule);
  void document.fonts?.ready.then(schedule);
  update();
  return () => {
    disposed = true;
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    textObserver.disconnect();
    window.removeEventListener("resize", schedule);
    document.fonts?.removeEventListener("loadingdone", schedule);
    header.removeAttribute("data-navigation-compact");
  };
}
