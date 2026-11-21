(() => {
  'use strict';
  const root = document.getElementById('quick-contact');
  const contact = document.getElementById('contact');
  const header = document.querySelector('.mast');
  const trigger = root?.querySelector('.fc-contact-entry');
  const menu = root?.querySelector('.qc-options');
  if (!trigger || !menu || !contact) return;

  const words = {
    zh: {open:'联系我们', title:'联系电子锁顾问', wa:'WhatsApp 咨询', call:'拨打电话', visit:'地址与营业时间'},
    en: {open:'Contact us', title:'Talk to a lock adviser', wa:'Chat on WhatsApp', call:'Call us', visit:'Address & opening hours'},
    ms: {open:'Hubungi kami', title:'Hubungi penasihat kunci', wa:'Chat di WhatsApp', call:'Telefon kami', visit:'Alamat & waktu operasi'}
  };
  const whatsapp = menu.querySelector('[data-qc=wa]');
  const telephone = menu.querySelector('[data-qc=call]');
  const address = menu.querySelector('[data-qc=visit]');
  const layer = 'quick-contact';
  let copy = words.zh;
  let frame = 0;
  let lift = 0;
  let protectedElements;
  let scrolling = false;
  let scrollSettleTimer;
  let contactSectionVisible = false;
  const obstacles = '#tray,.dir-card-compare,.dir-card-foot,.dir-filters,.dir-picker-button,.dir-sheet-info .dir-actions,.dir-price,.install-note,.hero-actions,.section-actions,#installation [data-enquire-current]';

  function renderedLift() {
    const transform = getComputedStyle(root).transform;
    return transform === 'none' ? 0 : -new DOMMatrixReadOnly(transform).m42;
  }

  function clearMenu(fromHistory = false, focusTrigger = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded','false');
    if (!fromHistory) window.showroom.layers.leave(layer);
    if (focusTrigger && !root.hidden) trigger.focus({preventScroll:true});
    schedule();
  }

  function openMenu(fromHistory=false) {
    if (root.hidden || root.hasAttribute('data-obstructed') || document.querySelector('dialog[open]')) return false;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded','true');
    if (!fromHistory) window.showroom.layers.enter(layer,() => clearMenu(true,true),() => openMenu(true));
    whatsapp.focus({preventScroll:true});
    return true;
  }

  function place() {
    frame = 0;
    const contactRect = contact.getBoundingClientRect();
    const visibleContactHeight = Math.min(contactRect.bottom,innerHeight) - Math.max(contactRect.top,0);
    contactSectionVisible = visibleContactHeight > (contactSectionVisible ? 0 : 24);
    const hide = contactSectionVisible || Boolean(document.querySelector('dialog[open]'));
    if (hide) {
      clearMenu();
      root.hidden = true;
      return;
    }
    root.hidden = false;
    const findLift = window.showroomPolicy?.findFloatingContactLift;
    if (scrolling || !menu.hidden || !findLift) return;
    protectedElements ??= [...document.querySelectorAll(obstacles)];
    const protectedBounds = protectedElements.map(el=>el.getBoundingClientRect())
      .filter(rect=>rect.width>0 && rect.height>0 && rect.bottom>0 && rect.top<innerHeight);
    const {left,right,top,bottom,width,height} = root.getBoundingClientRect();
    // Read the current transform in case the previous adjustment is still animating.
    const offset = renderedLift();
    const baseline = {left,right,top:top+offset,bottom:bottom+offset,width,height};
    const headerClearance = Math.max(16,(header?.getBoundingClientRect().bottom ?? 0)+12);
    const next = findLift(baseline,protectedBounds,lift,headerClearance);
    if (next === undefined) root.dataset.obstructed = 'true';
    else {
      delete root.dataset.obstructed;
      if (next !== lift) {
        lift = next;
        root.style.setProperty('--fc-contact-lift',lift+'px');
      }
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(place);
  }

  function onScroll() {
    if (!scrolling && root.hasAttribute('data-animate-placement')) {
      // A new gesture can start before the previous adjustment finishes.
      lift = renderedLift();
      delete root.dataset.animatePlacement;
      root.style.setProperty('--fc-contact-lift',lift+'px');
    }
    scrolling = true;
    clearTimeout(scrollSettleTimer);
    scrollSettleTimer = setTimeout(() => {
      scrolling = false;
      root.dataset.animatePlacement = '';
      schedule();
    },160);
    schedule();
  }

  function refresh() {
    if (!window.showroom || !window.lockContact) return;
    const lang = window.showroom.lang;
    copy = words[lang] || words.en;
    trigger.querySelector('.fc-contact-entry__label').textContent = window.showroomPolicy?.contactEntryTriggerText?.[lang] || copy.open;
    menu.querySelector('strong').textContent = copy.title;
    for (const a of menu.querySelectorAll('a')) a.querySelector('span').textContent = copy[a.dataset.qc];
    whatsapp.href = window.lockContact.whatsapp();
    telephone.href = window.lockContact.tel;
    schedule();
  }
  trigger.addEventListener('click',()=>menu.hidden ? openMenu() : clearMenu(false,true));
  address.addEventListener('click',event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const visit = () => requestAnimationFrame(() => {
      if (location.hash !== address.hash) location.hash = address.hash;
      const heading = contact.querySelector('h2') || contact;
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
      heading.focus({preventScroll:true});
      contact.scrollIntoView({block:'start',behavior:'instant'});
      place();
    });
    // Let Back restore the menu opener's document position before following the address link.
    const hasMenuEntry = Boolean(history.state?.precisionLayers?.length);
    if (hasMenuEntry) window.addEventListener('popstate',visit,{once:true});
    clearMenu();
    if (!hasMenuEntry) visit();
  });
  for (const name of ['pointerdown','focusin','click']) {
    document.addEventListener(name,event => {
      if (!root.contains(event.target)) clearMenu();
    },true);
  }
  root.addEventListener('keydown',event => {
    if (event.key === 'Escape' && !menu.hidden) { event.preventDefault(); clearMenu(false,true); }
  });
  for (const a of [whatsapp,telephone]) a.addEventListener('click',() => clearMenu(false,true));
  const sections = new IntersectionObserver(schedule);
  sections.observe(contact);
  addEventListener('scroll',onScroll,{capture:true,passive:true});
  addEventListener('resize',schedule);
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  resize?.observe(root);
  resize?.observe(contact);
  const overlays = new MutationObserver(schedule);
  document.querySelectorAll('dialog,#tray').forEach(el => overlays.observe(el,{attributes:true,attributeFilter:['open','hidden']}));
  const directory = document.getElementById('directory');
  if (directory) new MutationObserver(records=>{
    if (records.some(({target})=>target===directory || target.matches('.dir-cards,.dir-filterbar,.dir-sheet-info'))) {
      protectedElements = undefined;
      schedule();
    }
  }).observe(directory,{childList:true,subtree:true});
  window.quickContact = {refresh};
  refresh();
})();
