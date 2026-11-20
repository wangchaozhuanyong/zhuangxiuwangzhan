(() => {
  'use strict';
  const words = window.showroomWords;
  const root = document.documentElement;
  const base = root.dataset.root || '';
  const imageBundle = document.getElementById('offline-images');
  const offlineImages = imageBundle ? JSON.parse(imageBundle.textContent) : null;
  if (offlineImages) {
    imageBundle.remove();
    document.querySelectorAll('img[data-offline-src]').forEach(img => {
      img.src = offlineImages[img.dataset.offlineSrc];
      img.removeAttribute('data-offline-src');
    });
  }
  const byModel = new Map(window.lockCatalog.map(p => [p.id, p]));
  const supported = value => Object.hasOwn(words, value) ? value : null;
  function languageFromURL() {
    const url = new URL(location.href);
    return url.pathname.split('/').reverse().find(supported) || supported(url.searchParams.get('lang'));
  }
  let saved;
  try {
    const cookie = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('flashcast_lang='));
    saved = supported(cookie?.split('=')[1]) || supported(localStorage.getItem('fc-lang'));
  } catch {}
  const preferred = (navigator.languages?.[0] || navigator.language || '').toLowerCase().split(/[-_]/)[0];
  const initialPreference = saved || (offlineImages ? 'zh' : supported(preferred)) || 'en';
  let lang = languageFromURL() || initialPreference;
  function saveLanguage(value) {
    try {
      localStorage.setItem('fc-lang',value);
      if (location.protocol !== 'file:') document.cookie = 'flashcast_lang=' + value + '; Max-Age=31536000; Path=/; SameSite=Lax';
    } catch {}
  }
  let intent = {kind:'none'};
  const text = key => words[lang][key];
  const formatPrice = id => 'RM' + byModel.get(id).price.toLocaleString('en-MY');

  // Each open surface owns one same-page history entry.
  // A rapid close followed by an open is reconciled when the browser finishes its pending back step.
  const session = String(performance.timeOrigin) + '-' + Math.random().toString(36).slice(2);
  const stack = [];
  const forwardEntries = new Map();
  let historyPending = false;
  let reconciling = false;
  let sequence = 0;
  const physical = () => history.state?.precisionSession === session ? history.state.precisionLayers : [];
  function reconcileHistory() {
    if (historyPending || reconciling) return;
    const actual = physical();
    const requested = stack.map(entry => entry.token);
    let same = 0;
    while (same < actual.length && same < requested.length && actual[same] === requested[same]) same++;
    if (same < actual.length) {
      historyPending = true;
      history.go(same - actual.length);
      return;
    }
    for (let i = same; i < requested.length; i++) {
      // A new branch discards the browser's old Forward entries as well.
      forwardEntries.clear();
      history.pushState({...history.state, precisionSession:session, precisionLayers:requested.slice(0,i+1)}, '');
    }
  }
  const layers = {
    enter(key, onBack, onForward, capture) {
      if (stack.some(entry => entry.key === key)) return;
      stack.push({key, token:++sequence, onBack, onForward, capture});
      reconcileHistory();
    },
    leave(key) {
      const index = stack.findIndex(entry => entry.key === key);
      if (index < 0) return;
      rememberClosed(stack.splice(index),false);
      reconcileHistory();
    }
  };
  function rememberClosed(entries, navigateBack) {
    for (const entry of entries.reverse()) {
      if (entry.onForward) {
        entry.snapshot = entry.capture?.();
        forwardEntries.set(entry.token,entry);
      }
      if (navigateBack) entry.onBack();
    }
  }
  window.addEventListener('popstate', () => {
    const nextLanguage = languageFromURL() || initialPreference;
    if (!offlineImages && nextLanguage !== lang) {
      lang = nextLanguage;
      saveLanguage(lang);
      render();
    }
    if (historyPending) {
      historyPending = false;
      reconcileHistory();
      return;
    }
    const actual = physical();
    let same = 0;
    while (same < actual.length && same < stack.length && actual[same] === stack[same].token) same++;
    reconciling = true;
    try {
      rememberClosed(stack.splice(same),true);
      for (const token of actual.slice(same)) {
        const entry = forwardEntries.get(token);
        if (!entry) break;
        stack.push(entry);
        if (entry.onForward(entry.snapshot) === false) {
          stack.pop();
          break;
        }
        forwardEntries.delete(token);
      }
      if (stack.length !== actual.length) {
        history.replaceState({...history.state, precisionSession:session, precisionLayers:stack.map(e=>e.token)}, '');
      }
    } finally { reconciling = false; }
  });

  const selectionChanged = () => window.dispatchEvent(new Event('showroom:selection'));
  function syncCompare() {
    window.directory.syncCompare();
    const count = window.lockPanels.count();
    const button = document.querySelector('[data-nav-comparison]');
    button.textContent = text('compare') + (count ? ' · ' + count + '/2' : '');
    button.setAttribute('aria-label', text(['pairStart','nextPick','viewPair'][count]));
    const fromSection = document.querySelector('[data-choose-compare] span');
    fromSection.textContent = text(count ? ['','nextPick','viewPair'][count] : 'chooseOwn');
    selectionChanged();
  }
  window.showroom = {
    get lang(){ return lang; }, get intent(){ return intent; },
    get lastModel(){ return intent.kind === 'model' ? intent.id : null; },
    asset: value => offlineImages ? offlineImages[value] : base + value, layers, syncCompare,
    isCompared: id => window.lockPanels.isCompared(id),
    toggleCompare: (id, opener) => window.lockPanels.toggleCompare(id, opener),
    enquire: (id, opener) => window.lockPanels.enquire(id, opener),
    noteModel(id){
      if (id === null) intent = {kind:'none'};
      else if (byModel.has(id)) intent = {kind:'model', id};
      selectionChanged();
    },
    noteCompare(){ intent = {kind:'compare'};selectionChanged(); },
  };

  function render() {
    root.lang = lang === 'zh' ? 'zh-Hans' : lang;
    document.title = text('title');
    document.querySelectorAll('[data-t]').forEach(el => {el.textContent = text(el.dataset.t);});
    document.querySelectorAll('[data-alt]').forEach(el => {el.alt = text(el.dataset.alt);});
    document.querySelectorAll('[data-aria]').forEach(el => el.setAttribute('aria-label', text(el.dataset.aria)));
    document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === lang)));
    document.querySelector('[data-hero-price]').textContent = formatPrice('v37j-p16');
    const samplePrices = [...document.querySelectorAll('[data-price-for]')].map(el => byModel.get(el.dataset.priceFor).price);
    document.querySelector('[data-example-gap]').textContent = 'RM' + Math.abs(samplePrices[0] - samplePrices[1]).toLocaleString('en-MY');
    document.querySelectorAll('[data-price-for]').forEach(el => {el.textContent = formatPrice(el.dataset.priceFor);});
    window.directory.refresh();
    window.lockPanels.refresh();
    syncCompare();
    window.lockContact.refresh();
    window.quickContact?.refresh();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.lang && supported(button.dataset.lang)) {
      if (button.dataset.lang === lang) return;
      lang = button.dataset.lang;
      saveLanguage(lang);
      if (location.protocol !== 'file:') {
        const target = new URL(location.href);
        if (/\/(zh|ms|en)\/(index\.html)?$/.test(target.pathname)) {
          target.pathname = target.pathname.replace(/\/(zh|ms|en)\/(index\.html)?$/, '/' + lang + '/');
          target.searchParams.delete('lang');
        } else target.searchParams.set('lang', lang);
        history.replaceState(history.state, '', target);
      }
      render();
    } else if (button.matches('[data-show-featured]')) {
      window.directory.show('v37j-p16', button);
    } else if (button.matches('[data-nav-comparison],[data-choose-compare]')) {
      window.lockPanels.resume(button);
    } else if (button.matches('[data-example]')) {
      window.lockPanels.example(button);
    } else if (button.matches('[data-enquire-current]')) {
      window.lockPanels.fit(button);
    }
  });
  // Remember a customer's choices within this browser tab across reloads.
  const storageKey = 'anzhe:selection:v1';
  function saveSelection() {
    try {
      sessionStorage.setItem(storageKey,JSON.stringify({
        directory:window.directory.snapshot(), comparison:window.lockPanels.selectedIds(), intent
      }));
    } catch {}
  }
  let savedSelection;
  try { savedSelection = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
  if (savedSelection && typeof savedSelection === 'object') {
    window.lockPanels.restoreSelection(savedSelection.comparison);
    if (savedSelection.intent?.kind === 'model' && byModel.has(savedSelection.intent.id)) {
      intent = {kind:'model',id:savedSelection.intent.id};
    } else if (savedSelection.intent?.kind === 'compare' && window.lockPanels.count()) {
      intent = {kind:'compare'};
    }
  }
  render();
  if (savedSelection?.directory) window.directory.restore(savedSelection.directory);
  addEventListener('pagehide',saveSelection);
  document.addEventListener('visibilitychange',()=>{if (document.hidden) saveSelection();});
})();
