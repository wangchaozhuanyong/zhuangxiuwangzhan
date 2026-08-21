type ScrollBlock = ScrollLogicalPosition;

const runWithInstantScroll = (callback: () => void) => {
  const root = document.documentElement;
  const previousValue = root.style.getPropertyValue("scroll-behavior");
  const previousPriority = root.style.getPropertyPriority("scroll-behavior");

  root.style.setProperty("scroll-behavior", "auto", "important");
  try {
    callback();
  } finally {
    if (previousValue) {
      root.style.setProperty("scroll-behavior", previousValue, previousPriority);
    } else {
      root.style.removeProperty("scroll-behavior");
    }
  }
};

export const scrollWindowToImmediately = (top: number) => {
  runWithInstantScroll(() => {
    window.scrollTo({
      top: Math.max(0, Math.round(top)),
      left: 0,
      behavior: "auto",
    });
  });
};

export const focusElementImmediately = (target: HTMLElement, block: ScrollBlock = "center") => {
  runWithInstantScroll(() => {
    target.scrollIntoView({
      behavior: "auto",
      block,
      inline: "nearest",
    });
  });
  target.focus({ preventScroll: true });
};

export const focusElementByIdWhenReady = (id: string, block: ScrollBlock = "center") => {
  window.setTimeout(() => {
    const target = document.getElementById(id);
    if (target instanceof HTMLElement) focusElementImmediately(target, block);
  }, 0);
};
