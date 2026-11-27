// The native disclosure is usable as soon as its HTML is parsed, before deferred scripts run.
document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const menu = document.querySelector<HTMLDetailsElement>("details.lang-switch[open]");
  if (!menu) return;
  menu.open = false;
  event.preventDefault();
  menu.querySelector<HTMLElement>("[data-lang-trigger]")?.focus({ preventScroll: true });
});

document.addEventListener("click", event => {
  const menu = document.querySelector<HTMLDetailsElement>("details.lang-switch[open]");
  if (menu && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
});
