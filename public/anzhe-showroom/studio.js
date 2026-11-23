(() => {
  'use strict';
  const words = window.showroomWords;
  const root = document.documentElement;
  if (!window.showroomPolicy) {
    // Keep the static styles usable when the independent boot script failed to load.
    document.querySelectorAll('link[data-public-style]').forEach(link => { link.media = 'all'; });
  }
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
  const initialPreference = window.showroomPolicy?.getDefaultLanguage() || (offlineImages ? 'zh' : 'en');
  let lang = languageFromURL() || initialPreference;
  const saveLanguage = value => window.showroomPolicy?.rememberLanguage(value);
  let intent = {kind:'none'};
  const text = key => words[lang][key];
  const formatPrice = id => window.formatShowroomPrice(byModel.get(id).price);

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

  // A fragment keeps the return path out of HTTP requests.
  // Keep it only on this history entry so reloads retain it and a fresh direct visit starts clean.
  function readMainSiteReturn() {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const entering = fragment.has('fc-return');
    const raw = entering ? fragment.get('fc-return') : history.state?.showroomReturn;
    if (typeof raw !== 'string') return null;
    let destination = null;
    try {
      const main = 'https://flashcast.com.my';
      const url = new URL(raw, main);
      const path = decodeURIComponent(url.pathname);
      if (raw.startsWith('/') && url.origin === main && /^\/(en|ms|zh)(?:\/|$)/.test(path) &&
          !/[\\?#\x00-\x1f]/.test(path) && !path.includes('//') &&
          !/^\/(en|ms|zh)\/(admin|auth|api)(?:\/|$)/i.test(path) &&
          (!url.search || /^\?page=[1-9]\d{0,4}$/.test(url.search)) &&
          (!url.hash || /^#[a-z][a-z0-9_-]{0,100}$/i.test(url.hash))) {
        destination = url;
      }
    } catch {}
    if (entering) {
      const clean = new URL(location.href);
      clean.hash = '';
      history.replaceState({ ...history.state, showroomReturn: destination ? raw : null }, '', clean);
    }
    return destination?.href;
  }
  const mainSiteReturn = readMainSiteReturn();
  if (mainSiteReturn) {
    // Native section links create a fresh history entry, initially with no state.
    const destination = new URL(mainSiteReturn);
    const relative = destination.pathname + destination.search + destination.hash;
    const retainReturn = () => {
      if (history.state?.showroomReturn !== relative) {
        history.replaceState({ ...history.state, showroomReturn: relative }, '');
      }
    };
    window.addEventListener('popstate', retainReturn);
    window.addEventListener('hashchange', retainReturn);
    window.addEventListener('pagehide', retainReturn);
  }

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

  function enableHeroImageRetry() {
    for (const button of document.querySelectorAll('[data-hero-image-retry]')) {
      const frame = button.closest('.panel-view');
      const img = frame.querySelector('img');
      const source = new URL(img.src);
      let attempt = 0;
      function showFailure() {
        frame.dataset.imageState = 'error';
        button.hidden = false;
        button.disabled = false;
      }
      img.addEventListener('error', showFailure);
      img.addEventListener('load', () => {
        delete frame.dataset.imageState;
        button.hidden = true;
        button.disabled = false;
      });
      button.addEventListener('click', () => {
        frame.dataset.imageState = 'retrying';
        button.disabled = true;
        if (source.protocol !== 'data:') source.searchParams.set('image_retry', String(++attempt));
        img.src = source.href;
      });
      if (img.complete && !img.naturalWidth) showFailure();
    }
  }

  function render() {
    root.lang = window.showroomPolicy?.languageTag(lang) || lang;
    document.title = text('title');
    const mainService = document.querySelector('[data-main-service]');
    if (mainService) mainService.href = 'https://flashcast.com.my/' + lang + '/services/digital-lock';
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const publicUrl = new URL('/' + lang + '/', canonical.href).href;
      const description = text('description');
      canonical.href = publicUrl;
      document.querySelector('meta[name="description"]').content = description;
      for (const [key,value] of Object.entries({url:publicUrl, title:document.title, description, locale:lang + '_MY'})) {
        document.querySelector('meta[property="og:' + key + '"]').content = value;
      }
      const inLanguage = lang === 'zh' ? 'zh-Hans' : root.lang;
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'CollectionPage') {
          Object.assign(data, {url:publicUrl, name:document.title, description, inLanguage});
        } else if (data['@type'] === 'FAQPage' && data.inLanguage !== inLanguage) {
          data.inLanguage = inLanguage;
          data.mainEntity.forEach((question, index) => {
            question.name = text('installFaq' + (index + 1));
            question.acceptedAnswer.text = text('installAnswer' + (index + 1));
          });
        } else {
          continue;
        }
        script.textContent = JSON.stringify(data);
      }
    }
    const back = document.querySelector('[data-main-return]');
    if (mainSiteReturn && back) {
      back.href = mainSiteReturn;
      back.setAttribute('aria-label', text('returnToMain'));
      back.hidden = false;
    }
    document.querySelectorAll('[data-t]').forEach(el => {el.textContent = text(el.dataset.t);});
    document.querySelectorAll('[data-alt]').forEach(el => {el.alt = text(el.dataset.alt);});
    document.querySelectorAll('[data-aria]').forEach(el => el.setAttribute('aria-label', text(el.dataset.aria)));
    document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === lang)));
    const triggerLabel = document.querySelector('.lang-current-label');
    if (triggerLabel) {
      const labels = { zh: '中文', en: 'EN', ms: 'BM' };
      triggerLabel.textContent = labels[lang] || lang.toUpperCase();
    }
    const openSwitch = document.querySelector('.lang-switch.is-open');
    if (openSwitch) {
      openSwitch.classList.remove('is-open');
      openSwitch.querySelector('[data-lang-trigger]')?.setAttribute('aria-expanded', 'false');
    }
    document.querySelector('[data-hero-price]').textContent = formatPrice('v37j-p16');
    const samplePrices = [...document.querySelectorAll('[data-price-for]')].map(el => byModel.get(el.dataset.priceFor).price);
    document.querySelector('[data-example-gap]').textContent = window.formatShowroomPrice(Math.abs(samplePrices[0] - samplePrices[1]));
    document.querySelectorAll('[data-price-for]').forEach(el => {el.textContent = formatPrice(el.dataset.priceFor);});
    window.directory.refresh();
    window.lockPanels.refresh();
    syncCompare();
    window.lockContact.refresh();
    window.quickContact?.refresh();
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-lang-trigger]');
    if (trigger) {
      event.preventDefault();
      const sw = trigger.closest('.lang-switch');
      const willOpen = !sw.classList.contains('is-open');
      sw.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
      return;
    }
    const openSwitch = document.querySelector('.lang-switch.is-open');
    if (openSwitch && !event.target.closest('.lang-switch')) {
      openSwitch.classList.remove('is-open');
      openSwitch.querySelector('[data-lang-trigger]')?.setAttribute('aria-expanded', 'false');
    }

    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.lang && supported(button.dataset.lang)) {
      if (button.dataset.lang === lang) {
        const sw = button.closest('.lang-switch');
        if (sw) {
          sw.classList.remove('is-open');
          sw.querySelector('[data-lang-trigger]')?.setAttribute('aria-expanded', 'false');
        }
        return;
      }
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
      window.directory.show('v37j-p16', button, event.detail>0);
    } else if (button.matches('[data-nav-comparison],[data-choose-compare]')) {
      window.lockPanels.resume(button);
    } else if (button.matches('[data-example]')) {
      window.lockPanels.example(button);
    } else if (button.matches('[data-enquire-current]')) {
      window.lockPanels.fit(button);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const openSwitch = document.querySelector('.lang-switch.is-open');
      if (openSwitch) {
        openSwitch.classList.remove('is-open');
        openSwitch.querySelector('[data-lang-trigger]')?.setAttribute('aria-expanded', 'false');
      }
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
  enableHeroImageRetry();
  render();
  if (savedSelection?.directory) window.directory.restore(savedSelection.directory);
  window.showroomInteractive = true;
  window.dispatchEvent(new Event('showroom:ready'));
  addEventListener('pagehide',saveSelection);
  document.addEventListener('visibilitychange',()=>{if (document.hidden) saveSelection();});
})();
