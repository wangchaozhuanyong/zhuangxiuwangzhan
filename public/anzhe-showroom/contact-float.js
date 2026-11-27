(() => {
  'use strict';
  const root = document.getElementById('quick-contact');
  const contact = document.getElementById('contact');
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
  const copyWechat = menu.querySelector('[data-copy-wechat]');
  const wechatStatus = menu.querySelector('[data-contact-status]');
  const layer = 'quick-contact';
  function clearMenu(fromHistory = false, focusTrigger = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded','false');
    if (!fromHistory) window.showroom.layers.leave(layer);
    if (focusTrigger && !root.hidden) trigger.focus({preventScroll:true});
  }

  function openMenu(fromHistory=false) {
    if (root.hidden || root.hasAttribute('data-obstructed') || document.querySelector('dialog[open]')) return false;
    if (wechatStatus) wechatStatus.textContent = '';
    menu.hidden = false;
    menu.scrollTop = 0;
    trigger.setAttribute('aria-expanded','true');
    if (!fromHistory) window.showroom.layers.enter(layer,() => clearMenu(true,true),() => openMenu(true));
    (copyWechat || whatsapp).focus({preventScroll:true});
    return true;
  }

  function refresh() {
    if (!window.showroom || !window.lockContact) return;
    const lang = window.showroom.lang;
    const copy = words[lang] || words.en;
    trigger.querySelector('.fc-contact-entry__label').textContent = window.showroomPolicy?.contactEntryTriggerText?.[lang] || copy.open;
    menu.querySelector('strong').textContent = copy.title;
    for (const a of menu.querySelectorAll('a[data-qc]')) {
      if (copy[a.dataset.qc]) a.querySelector('span').textContent = copy[a.dataset.qc];
    }
    whatsapp.href = window.lockContact.whatsapp();
    telephone.href = window.lockContact.tel;
    root.hidden = false;
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
    });
    // Restore the menu opener's history entry before following the section link.
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
  window.showroomPolicy?.observeFixedFloatingEntry?.(root, obstructed => {
    if (obstructed === root.hasAttribute('data-obstructed')) return;
    if (obstructed) {
      root.dataset.obstructed = 'true';
      clearMenu();
    } else {
      delete root.dataset.obstructed;
    }
  }, document.querySelector('.hero-actions'));
  window.quickContact = {refresh};
  refresh();
})();
