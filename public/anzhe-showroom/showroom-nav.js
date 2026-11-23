// Handles language switch dropdown interaction for showroom subpages under strict CSP.
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-lang-trigger]");
  var s = document.querySelector(".lang-switch.is-open");
  if (t) {
    e.preventDefault();
    var c = t.closest(".lang-switch");
    var o = !c.classList.contains("is-open");
    c.classList.toggle("is-open", o);
    t.setAttribute("aria-expanded", String(o));
  } else if (s && !e.target.closest(".lang-switch")) {
    s.classList.remove("is-open");
    s.querySelector("[data-lang-trigger]")?.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    var s = document.querySelector(".lang-switch.is-open");
    if (s) {
      s.classList.remove("is-open");
      s.querySelector("[data-lang-trigger]")?.setAttribute("aria-expanded", "false");
    }
  }
});
