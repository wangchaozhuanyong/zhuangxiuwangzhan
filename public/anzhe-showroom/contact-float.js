(() => {
  'use strict';
  const root = document.getElementById('quick-contact');
  const header = document.querySelector('.mast');
  const contact = document.getElementById('contact');
  if (!root || !header || !contact) return;

  const words = {
    zh: {open:'联系顾问', close:'关闭联系菜单', title:'联系电子锁顾问', wa:'WhatsApp 咨询', call:'拨打电话', visit:'地址与营业时间'},
    en: {open:'Contact us', close:'Close contact options', title:'Talk to a lock adviser', wa:'Chat on WhatsApp', call:'Call us', visit:'Address & opening hours'},
    ms: {open:'Hubungi kami', close:'Tutup pilihan hubungan', title:'Hubungi penasihat kunci', wa:'Chat di WhatsApp', call:'Telefon kami', visit:'Alamat & waktu operasi'}
  };
  const icon = name => '<svg aria-hidden="true" focusable="false" width="22" height="22"><use href="#ico-'+name+'"></use></svg>';
  const row = (key, glyph, end) => '<a class="qc-link" data-qc="'+key+'">'+icon(glyph)+'<span></span><i aria-hidden="true">'+end+'</i></a>';
  // The offline and language builds also come through here with pre-rendered markup.
  root.innerHTML = '<button class="qc-trigger" type="button" aria-expanded="false" aria-controls="qc-options">'+
    icon('chat')+icon('close')+'<span></span></button>'+
    '<nav id="qc-options" class="qc-options" aria-labelledby="qc-heading" hidden><strong id="qc-heading"></strong>'+
    row('wa','wa','↗')+row('call','phone','↗')+row('visit','pin','↓')+'</nav>';
  const trigger = root.querySelector('.qc-trigger');
  const menu = root.querySelector('.qc-options');
  const whatsapp = menu.querySelector('[data-qc=wa]');
  const telephone = menu.querySelector('[data-qc=call]');
  const address = menu.querySelector('[data-qc=visit]');
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener noreferrer';
  address.href = '#contact';
  const layer = 'quick-contact';
  let copy = words.zh;
  let frame = 0;
  let collisionObserver;
  let lastMargin;
  let obstaclesChanged = false;
  const nearby = new Set();
  const obstacles = '#tray,.dir-card-compare,.dir-card-foot,.dir-filters,.dir-picker-button,.dir-sheet-info .dir-actions,.hero-actions,.section-actions,#installation [data-enquire-current]';

  function clearMenu(fromHistory = false, focusTrigger = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-label',copy.open);
    if (!fromHistory) window.showroom.layers.leave(layer);
    if (focusTrigger && !root.hidden) trigger.focus({preventScroll:true});
    schedule();
  }

  function openMenu(fromHistory=false) {
    if (root.hidden || root.hasAttribute('data-obstructed') || document.querySelector('dialog[open]')) return false;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded','true');
    trigger.setAttribute('aria-label',copy.close);
    if (!fromHistory) window.showroom.layers.enter(layer,() => clearMenu(true,true),() => openMenu(true));
    whatsapp.focus({preventScroll:true});
    return true;
  }

  function place() {
    frame = 0;
    const contactRect = contact.getBoundingClientRect();
    const hide = header.getBoundingClientRect().bottom > 0 ||
      (contactRect.top < innerHeight && contactRect.bottom > 0) ||
      Boolean(document.querySelector('dialog[open]'));
    if (hide) {
      clearMenu();
      root.hidden = true;
      return;
    }
    root.hidden = false;
    const r = trigger.getBoundingClientRect();
    const viewport = document.documentElement;
    // Track intersections with the button's occupied area, including a 3px clearance.
    const margin = [3-r.top,r.right+3-viewport.clientWidth,r.bottom+3-viewport.clientHeight,3-r.left]
      .map(n=>Math.round(n)+'px').join(' ');
    if (!collisionObserver || margin!==lastMargin || obstaclesChanged) {
      collisionObserver?.disconnect();
      nearby.clear();
      lastMargin = margin;
      collisionObserver = new IntersectionObserver((entries, observer)=>{
        if (observer!==collisionObserver) return;
        for (const entry of entries) {
          if (entry.isIntersecting) nearby.add(entry.target);
          else nearby.delete(entry.target);
        }
        root.toggleAttribute('data-obstructed',menu.hidden && nearby.size>0);
      },{rootMargin:margin});
      document.querySelectorAll(obstacles).forEach(el=>collisionObserver.observe(el));
    }
    obstaclesChanged = false;
    root.toggleAttribute('data-obstructed',menu.hidden && nearby.size>0);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(place);
  }

  function refresh() {
    if (!window.showroom || !window.lockContact) return;
    copy = words[window.showroom.lang] || words.en;
    trigger.querySelector('span').textContent = copy.open;
    trigger.setAttribute('aria-label',menu.hidden ? copy.open : copy.close);
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
  sections.observe(header);
  sections.observe(contact);
  addEventListener('resize',schedule);
  const overlays = new MutationObserver(schedule);
  document.querySelectorAll('dialog,#tray').forEach(el => overlays.observe(el,{attributes:true,attributeFilter:['open','hidden']}));
  const directory = document.getElementById('directory');
  if (directory) new MutationObserver(records=>{
    if (records.some(({target})=>target===directory || target.matches('.dir-cards,.dir-filterbar,.dir-sheet-info'))) {
      obstaclesChanged = true;
      schedule();
    }
  }).observe(directory,{childList:true,subtree:true});
  window.quickContact = {refresh};
  refresh();
})();
