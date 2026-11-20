(() => {
  'use strict';

  const texts = {
    zh: {
      close:'关闭', pick:'选择比较型号', pickTwo:'选两款比较', pickNext:'选第二款', selected:'已选型号', remove:'移除', compare:'比较型号',
      add:'加入对比', added:'已选', change:'更换型号', same:'查看相同功能', differences:'主要差异', noDiff:'已确认的项目中没有其他差异。',
      example:'T06J 与 K26J Pro', gap:'含安装价相差 {price}', samePrice:'两款含安装价相同', included:'含安装',
      price:'含安装价', screen:'室内屏幕', type:'门锁类型', unlock:'怎么开门', visitor:'怎么看访客', security:'安全提醒', emergency:'没电怎么办',
      power:'日常供电', connection:'连接方式', material:'材质', extra:'其他规格', sharedExtra:'其他相同规格', pending:'待确认的项目', missing:'待确认', inch:' 英寸',
      replace:'替换哪一款？', replacement:'已选满两款。选择要用 {model} 替换的型号。', replaceThis:'替换这款', cancel:'保留原选择',
      enquiry:'咨询选中的门锁', enquiryModel:'咨询型号', message:'你好，我想咨询 ANZHE {model}，网页含安装价为 {price}。我可以提供门的正面照和门边锁体照，请帮我确认是否适合安装。',
      preview:'你可以在 WhatsApp 里修改这段话，再点发送。', selection:'已选 {count} / 2', pickInfo:'可选两个型号，查看含安装价和功能差异。', pairLabel:'比较中的两款门锁'
    },
    en: {
      close:'Close', pick:'Choose models to compare', pickTwo:'Choose two locks', pickNext:'Choose a second lock', selected:'Selected models', remove:'Remove', compare:'Compare locks',
      add:'Add', added:'Selected', change:'Change models', same:'Show shared features', differences:'Key differences', noDiff:'No further differences among the confirmed specifications.',
      example:'T06J and K26J Pro', gap:'{price} difference with installation', samePrice:'Both have the same installed price', included:'Installation included',
      price:'Price with installation', screen:'Indoor display', type:'Lock type', unlock:'Ways to unlock', visitor:'Visitor features', security:'Security features', emergency:'If the battery runs flat',
      power:'Everyday power supply', connection:'Connectivity', material:'Materials', extra:'Other specifications', sharedExtra:'Other shared specifications', pending:'Items to confirm', missing:'To be confirmed', inch:' inches',
      replace:'Which lock should be replaced?', replacement:'Two locks are already selected. Choose the one to replace with {model}.', replaceThis:'Replace this model', cancel:'Keep the current pair',
      enquiry:'Enquire about your lock', enquiryModel:'Enquiry model', message:'Hi, I’m interested in the ANZHE {model}, listed at {price} including installation. I can share photos of the front and edge of my door. Could you check whether this model will fit?',
      preview:'You can edit this message in WhatsApp before sending it.', selection:'Selected {count} / 2', pickInfo:'Choose two models to compare their installed prices and features.', pairLabel:'The two locks being compared'
    },
    ms: {
      close:'Tutup', pick:'Pilih model untuk dibandingkan', pickTwo:'Pilih dua kunci', pickNext:'Pilih kunci kedua', selected:'Model dipilih', remove:'Keluarkan', compare:'Bandingkan model',
      add:'Tambah', added:'Dipilih', change:'Tukar model', same:'Lihat ciri yang sama', differences:'Perbezaan utama', noDiff:'Tiada perbezaan lain dalam spesifikasi yang disahkan.',
      example:'T06J dan K26J Pro', gap:'Beza harga termasuk pemasangan ialah {price}', samePrice:'Harga kedua-duanya sama termasuk pemasangan', included:'Termasuk pemasangan',
      price:'Harga termasuk pemasangan', screen:'Skrin dalaman', type:'Jenis kunci', unlock:'Cara membuka kunci', visitor:'Ciri untuk pelawat', security:'Ciri keselamatan', emergency:'Jika bateri habis',
      power:'Bekalan kuasa harian', connection:'Sambungan', material:'Bahan', extra:'Spesifikasi lain', sharedExtra:'Spesifikasi lain yang sama', pending:'Butiran untuk disahkan', missing:'Perlu disahkan', inch:' inci',
      replace:'Model mana hendak digantikan?', replacement:'Dua model sudah dipilih. Pilih model yang hendak digantikan dengan {model}.', replaceThis:'Ganti model ini', cancel:'Kekalkan pilihan asal',
      enquiry:'Tanya tentang kunci pilihan anda', enquiryModel:'Model untuk pertanyaan', message:'Hai, saya berminat dengan ANZHE {model} pada harga {price} termasuk pemasangan. Saya boleh berkongsi gambar bahagian depan dan tepi pintu saya. Boleh semak sama ada model ini sesuai?',
      preview:'Anda boleh menyunting mesej ini dalam WhatsApp sebelum menghantarnya.', selection:'Dipilih {count} / 2', pickInfo:'Pilih dua model untuk membandingkan harga termasuk pemasangan dan cirinya.', pairLabel:'Dua kunci yang dibandingkan'
    }
  };
  const flowText = {
    zh: {
      first:'第一款', second:'第二款', empty:'待选择', start:'选择第一款', next:'选择第二款', view:'查看对比',
      ask:'咨询 {model}', fit:'确认门型与安装', fitChoice:'想咨询哪一款门锁？', fitChoiceHint:'请选择其中一款，查看该型号的含安装价和咨询内容。', general:'先确认我的门型', genericMessage:'你好，我想安装电子锁。我可以提供门内外的正面照，以及门边锁体的照片。请帮我确认门型和适合安装的型号。', backStep:'返回上一步',
      firstHint:'选好第一款后，可继续挑另一款。', secondHint:'第一款已保留。点选另一款，立即查看两款差异。',
      swap:'更换 {model}', swapTitle:'为 {model} 选择替代型号', swapTarget:'要更换', kept:'保留',
      swapHint:'选择候选型号后，仅替换标出的这一栏。', back:'取消更换', replaceBy:'用 {new} 替换 {old}',
      demo:'示例对比', myCompare:'我的对比', chooseOwn:'自己选两款', selectedFirst:'选择第一款门锁', selectedSecond:'选择第二款门锁',
      technology:'屏幕面板类型', reference:'只列出一方支持、规格详略不同，或配置仍需核实的项目归在这里。「待确认」表示现有资料不足以判断。',
      sameSpecsGap:'两款已列出的规格相同。顾问可以帮你核对实物配置及价差原因。', askPair:'用 WhatsApp 咨询这两款',
      access:'开锁方式', card:'门卡开锁', fingerprint:'指纹开锁', pin:'密码开锁', key:'机械钥匙开锁', dynamic:'动态密码开锁',
      app:'手机应用开锁', palm:'掌静脉开锁', face:'人脸开锁', fob:'感应钥匙扣开锁'
    },
    en: {
      first:'First lock', second:'Second lock', empty:'Choose a model', start:'Choose the first lock', next:'Choose the second lock', view:'View comparison',
      ask:'Ask about {model}', fit:'Check my door for installation', fitChoice:'Which lock would you like to ask about?', fitChoiceHint:'Choose one to see its installed price and preview your enquiry.', general:'Check my door first', genericMessage:'Hi, I’d like to fit a smart lock. I can share photos of both sides of my door and the lock on its edge. Could you help identify my door type and suggest a compatible model?', backStep:'Go back',
      firstHint:'Choose the first lock, then select a second one.', secondHint:'Your first lock is saved. Select another to see the differences.',
      swap:'Change {model}', swapTitle:'Choose a replacement for {model}', swapTarget:'To replace', kept:'Stays in place',
      swapHint:'Your choice will replace only the marked lock.', back:'Cancel change', replaceBy:'Replace {old} with {new}',
      demo:'Example comparison', myCompare:'My comparison', chooseOwn:'Choose my own pair', selectedFirst:'Choose your first lock', selectedSecond:'Choose your second lock',
      technology:'Display panel type', reference:'These details are documented for only one lock, described at different levels of detail, or still require a configuration check. “To be confirmed” means the available information is inconclusive.',
      sameSpecsGap:'The listed specifications match. Ask our adviser to check the two models and explain the price difference.', askPair:'Ask about both locks on WhatsApp',
      access:'Ways to unlock', card:'Card access', fingerprint:'Fingerprint access', pin:'PIN access', key:'Mechanical key access', dynamic:'Dynamic code access',
      app:'App access', palm:'Palm-vein access', face:'Face recognition access', fob:'Key fob access'
    },
    ms: {
      first:'Kunci pertama', second:'Kunci kedua', empty:'Pilih model', start:'Pilih kunci pertama', next:'Pilih kunci kedua', view:'Lihat perbandingan',
      ask:'Tanya tentang {model}', fit:'Semak kesesuaian pintu saya', fitChoice:'Model mana yang ingin anda tanyakan?', fitChoiceHint:'Pilih satu model untuk melihat harga termasuk pemasangan dan pratonton pertanyaan anda.', general:'Semak pintu saya dahulu', genericMessage:'Hai, saya ingin memasang kunci pintar. Saya boleh berkongsi gambar kedua-dua sisi pintu dan bahagian kunci di tepi pintu. Boleh bantu kenal pasti jenis pintu dan cadangkan model yang sesuai?', backStep:'Kembali',
      firstHint:'Pilih kunci pertama, kemudian pilih kunci kedua.', secondHint:'Kunci pertama sudah dipilih. Pilih satu lagi untuk melihat perbezaannya.',
      swap:'Tukar {model}', swapTitle:'Pilih pengganti untuk {model}', swapTarget:'Untuk diganti', kept:'Dikekalkan',
      swapHint:'Pilihan anda hanya menggantikan kunci yang ditanda.', back:'Batalkan pertukaran', replaceBy:'Ganti {old} dengan {new}',
      demo:'Contoh perbandingan', myCompare:'Perbandingan saya', chooseOwn:'Pilih dua model sendiri', selectedFirst:'Pilih kunci pertama', selectedSecond:'Pilih kunci kedua',
      technology:'Jenis panel skrin', reference:'Butiran di sini hanya dinyatakan untuk satu model, diterangkan dengan tahap perincian berbeza, atau memerlukan semakan konfigurasi. “Perlu disahkan” bermaksud maklumat yang ada belum mencukupi.',
      sameSpecsGap:'Spesifikasi yang disenaraikan adalah sama. Penasihat kami boleh menyemak kelengkapan kedua-dua model dan menjelaskan perbezaan harga.', askPair:'Tanya tentang kedua-dua kunci di WhatsApp',
      access:'Cara membuka kunci', card:'Akses kad', fingerprint:'Akses cap jari', pin:'Akses PIN', key:'Akses kunci mekanikal', dynamic:'Akses kod dinamik',
      app:'Akses aplikasi', palm:'Akses vena tapak tangan', face:'Akses pengecaman wajah', fob:'Akses tag kunci'
    }
  };
  const byId = new Map(window.lockCatalog.map(p => [p.id,p]));
  const examplePair = ['t06j','k26j-pro'];
  const chosen = [];
  let demo = [...examplePair];
  const panel = document.getElementById('panel');
  const body = document.getElementById('panel-body');
  const tray = document.getElementById('tray');
  let mode = '', candidate = '', enquiryId = '', returnTo = null, originDialog = null, restoreKind = '';
  const steps=[];
  const panelLayer='precision-panel';
  let returnToTray=false;
  let swapSlot=0, swapSource='compare';
  const esc = input => String(input ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang = () => Object.hasOwn(texts,window.showroom?.lang) ? window.showroom.lang : 'zh';
  const t = key => texts[lang()][key];
  const u = key => flowText[lang()][key];
  const price = amount => 'RM' + amount.toLocaleString('en-MY');
  const data = tr => tr?.[lang()] || '';
  const count = () => chosen.length;
  const isCompared = id => chosen.includes(id);
  const image = source => '<img src="' + esc(window.showroom.asset(source)) + '" alt="" decoding="async">';
  const title = value => '<h2 id="panel-title" tabindex="-1">' + esc(value) + '</h2>';
  const label = key => '<span class="pn-label">' + t(key) + '</span>';
  const action = (key, caption) => '<button type="button" class="pn-action" data-pan="' + key + '">' + esc(caption) + '</button>';
  const slotName = i => u(i===0?'first':'second');
  const personalOrDemo = source => source==='example' ? demo : chosen;
  const sourceOf = () => mode==='swap' ? swapSource : mode;
  const withModel = (key,name) => u(key).replace('{model}',name);

  function drawTray() {
    tray.hidden = !count();
    tray.dataset.selectedCount=String(count());
    tray.setAttribute('aria-label',t('selected'));
    if (!count()) { tray.replaceChildren(); return; }
    const slots=[0,1].map(i=>{
      const p=byId.get(chosen[i]);
      return '<div class="pn-tray-slot" data-tray-slot="' + i + '">' +
        (p ? '<span class="pn-tray-thumb">' + image(p.thumbnail) + '</span>' : '<span class="pn-tray-thumb is-empty" aria-hidden="true">+</span>') +
        '<span class="pn-tray-name"><small>' + slotName(i) + '</small><b>' + (p?esc(p.name):u('empty')) + '</b></span>' +
        (p?'<button type="button" data-remove="' + p.id + '" aria-label="' + esc(t('remove')+' '+p.name) + '">×</button>':'') + '</div>';
    }).join('');
    tray.innerHTML='<div class="pn-tray-in">' + slots + action('resume',count()===2?u('view'):u('next')) + '</div>';
  }
  function notify() {
    drawTray();
    window.showroom?.syncCompare?.();
  }
  function pairSummary(ids,marked=-1) {
    return '<div class="pn-slot-pair">' + [0,1].map(i=>{
      const p=byId.get(ids[i]);
      const status=marked===-1?'': '<small class="pn-mark">' + u(i===marked?'swapTarget':'kept') + '</small>';
      return '<div class="pn-slot' + (p?'':' is-empty') + (marked===i?' is-target':'') + '" data-slot="' + i + '"><div class="pn-slot-tag">' + slotName(i) + status + '</div>' +
        (p ? '<div class="pn-slot-info"><span class="pn-slot-thumb">' + image(p.thumbnail) + '</span><div><strong>' + esc(p.name) + '</strong><small>' + price(p.price) + '</small></div></div>'
          : '<div class="pn-placeholder"><i aria-hidden="true">+</i>' + u('empty') + '</div>') + '</div>';
    }).join('') + '</div>';
  }
  function choices(excluded,referenceId) {
    const group=byId.get(referenceId)?.group;
    const candidates=window.lockCatalog.filter(p=>!excluded.includes(p.id));
    if (group) candidates.sort((a,b)=>Number(b.group===group)-Number(a.group===group));
    return '<div class="pn-pick-list">' + candidates.map(p=>
      '<button type="button" class="pn-pick" data-pick="' + p.id + '"><span class="pn-thumb">' + image(p.thumbnail) + '</span><span class="pn-pick-copy"><strong>' + esc(p.name) +
      '</strong><small>' + price(p.price) + ' · ' + t('included') + '</small></span><span class="pn-pick-state" aria-hidden="true">→</span></button>'
    ).join('') + '</div>';
  }
  function chooseView() {
    if (mode==='swap') {
      const ids=personalOrDemo(swapSource);
      return title(withModel('swapTitle',byId.get(ids[swapSlot]).name)) + pairSummary(ids,swapSlot) +
        '<div class="pn-pick-tools"><p>' + u('swapHint') + '</p>' + action('cancelSwap',u('back')) + '</div>' + choices(ids,ids[swapSlot]);
    }
    return title(u(count()?'selectedSecond':'selectedFirst')) + pairSummary(chosen) +
      '<p class="pn-intro">' + u(count()?'secondHint':'firstHint') + '</p>' + choices(chosen,chosen[0]);
  }
  function pairedImages(pair) {
    return '<div class="pn-pair" aria-label="' + t('pairLabel') + '">' + pair.map((p,i) =>
      '<div data-slot="' + i + '"><span class="pn-slot-label">' + slotName(i) + '</span><figure class="pn-portrait">' + image(p.cardImage) + '</figure><h3>' + esc(p.name) +
      '</h3><p class="pn-price"><strong>' + price(p.price) + '</strong><span>' + t('included') + '</span></p><div class="pn-pair-actions"><button class="pn-swap" type="button" data-swap-slot="' +
      i + '">' + esc(withModel('swap',p.name)) + '</button>' + askButton(p) + '</div></div>'
    ).join('') + '</div>';
  }
  function askButton(p) {
    return '<button type="button" class="pn-ask" data-ask-model="'+p.id+'">'+esc(withModel('ask',p.name))+'</button>';
  }
  function rowsFor(a,b) {
    const left=window.lockFeatures[a.id], right=window.lockFeatures[b.id];
    const same=[], diff=[], pending=[];
    function record(caption,av,bv,needsCheck=false) {
      if(!av && !bv) return;
      const group=!av || !bv || needsCheck ? pending : av===bv ? same : diff;
      group.push([caption,av,bv]);
    }
    const commonMethods=[];
    const differentAppOptions=left.comparison.optionalApp!==right.comparison.optionalApp;
    for (const method of new Set([...left.accessMethods,...right.accessMethods])) {
      // A listed option belongs in the visible configuration row for this pair.
      if(method==='app' && differentAppOptions)continue;
      const av=data(left.accessOptions[method]), bv=data(right.accessOptions[method]);
      if (av && bv) {
        commonMethods.push(av===bv ? av : u(method));
        // A stated variant (e.g. 3D face recognition) refines a shared access method.
        // A generic listing on the other side does not establish a different variant.
        if(av!==bv) record(u(method),av,bv,true);
      } else record(u(method),av,bv);
    }
    if (commonMethods.length) {
      const value=commonMethods.join(' · ');
      record(u('access'),value,value);
    }
    const keys=Object.keys(window.lockSpecLabels);
    for (const key of ['screen','type',...keys.filter(k=>!['screen','type','access'].includes(k))]) {
      const caption=data(window.lockSpecLabels[key]);
      if(key==='screen' && a.screen && b.screen) {
        record(t('screen'),a.screen+t('inch'),b.screen+t('inch'));
        record(u('technology'),left.comparison.displayTechnology,right.comparison.displayTechnology);
        continue;
      }
      const av=data(left.specs[key]), bv=data(right.specs[key]);
      if(key==='app' && differentAppOptions){
        record(caption,av,bv);continue;
      }
      // A camera's angle, optional app configuration or extra machining is only
      // documented on some models. A shorter description cannot establish its absence.
      const partialDetail=av!==bv && ['camera','finish','app'].includes(key);
      record(caption,av,bv,partialDetail || left.comparison.unverified.has(key) || right.comparison.unverified.has(key));
    }
    return {diff,same,pending};
  }
  function compareRows(rows,a,b) {
    return '<table class="pn-spec-table"><thead class="pn-blind"><tr><td></td><th scope="col">' + esc(a.name) + '</th><th scope="col">' + esc(b.name) + '</th></tr></thead><tbody>' +
      rows.map(([caption,v,w])=>'<tr><th scope="row">' + esc(caption) + '</th><td>' + esc(v || t('missing')) +
      '</td><td>' + esc(w || t('missing')) + '</td></tr>').join('') + '</tbody></table>';
  }
  function compareView() {
    const pair=personalOrDemo(mode).map(id=>byId.get(id));
    const [a,b]=pair;
    const {diff,same,pending}=rowsFor(a,b);
    const gap=Math.abs(a.price-b.price);
    const summary=gap && !pending.length ? u('sameSpecsGap') : t('noDiff');
    const pairHref=window.lockContact.whatsappForPair([a.id,b.id]);
    const askPair='<p class="pn-end"><a class="pn-ask" data-ask-pair href="'+esc(pairHref)+'" target="_blank" rel="noopener noreferrer">'+esc(u('askPair'))+'</a></p>';
    return title(mode==='example'?u('demo'):t('compare')) + pairedImages(pair) +
      '<p class="pn-gap">' + esc(gap ? t('gap').replace('{price}',price(gap)) : t('samePrice')) + '</p>' +
      '<div class="pn-measurements"><div class="pn-sticky-models" aria-hidden="true"><b>' + esc(a.name) + '</b><b>' + esc(b.name) + '</b></div><h3 class="pn-sub">' + t('differences') + '</h3>' + (diff.length ? compareRows(diff,a,b) : '<p class="pn-no-diff">' + esc(summary) + '</p>') + askPair +
      (same.length ? '<details class="pn-shared"><summary>' + t('same') + ' <span>' + same.length + '</span></summary>' + compareRows(same,a,b) + '</details>' : '') +
      (pending.length ? '<details class="pn-shared pn-pending"><summary>' + t('pending') + ' <span>' + pending.length + '</span></summary><p class="pn-note">' + esc(u('reference')) + '</p>' + compareRows(pending,a,b) + '</details>' : '') +
      '</div>' + (mode==='example'?'<div class="pn-end">' + action('resume',count()?u('myCompare'):u('chooseOwn')) + '</div>':'');
  }
  function replaceView() {
    const p=byId.get(candidate);
    return title(t('replace')) + '<p class="pn-intro">' + esc(t('replacement').replace('{model}',p.name)) + '</p><div class="pn-replace">' +
      chosen.map((id,i) => {
        const old=byId.get(id), text=u('replaceBy').replace('{new}',p.name).replace('{old}',old.name);
        return '<button type="button" data-replace="' + i + '"><figure>' + image(old.cardImage) + '</figure><small>'+slotName(i)+'</small><strong>' + esc(old.name) +
          '</strong><small>' + price(old.price) + '</small><span>' + esc(text) + '</span></button>';
      }).join('') + '</div>' + action('cancelReplace',t('cancel'));
  }
  function enquiryView() {
    const p=byId.get(enquiryId);
    const options='<option value="">' + u('general') + '</option>' + window.lockCatalog.map(x=>'<option value="' + x.id + '"' + (x.id===p?.id?' selected':'') + '>' + esc(x.name) + '</option>').join('');
    const message=messageFor(p?.id);
    return title(p?withModel('ask',p.name):u('fit')) + '<div class="pn-enquiry-choice">' + (p?'<div class="pn-enquiry-thumb">'+image(p.cardImage)+'</div>':'') + '<label>' + label('enquiryModel') +
      '<select data-panel-model>' + options + '</select>' + (p?'<small>' + price(p.price) + ' · ' + t('included') + '</small>':'') + '</label></div>' +
      '<blockquote class="pn-message">' + esc(message) + '</blockquote><p class="pn-note">' + t('preview') + '</p>' +
      '<div class="ct-panel-actions"><a class="ct-primary" href="'+esc(window.lockContact.whatsapp(message))+'" target="_blank" rel="noopener noreferrer"><svg class="ct-icon" aria-hidden="true"><use href="#ico-wa"></use></svg>'+esc(window.showroomWords[lang()].openWhatsapp)+'</a>' +
      '<a class="ct-secondary" href="'+esc(window.lockContact.tel)+'">'+esc(window.showroomWords[lang()].callShort)+'</a></div>';
  }
  function fitChoices() {
    return title(u('fitChoice')) + '<p class="pn-intro">'+u('fitChoiceHint')+'</p><div class="pn-replace pn-fit-options">' +
      chosen.map(id=>{
        const p=byId.get(id);
        return '<button type="button" data-ask-model="'+p.id+'"><figure>'+image(p.cardImage)+'</figure><strong>'+esc(p.name)+'</strong><small>'+price(p.price)+' · '+t('included')+'</small><span>'+esc(withModel('ask',p.name))+'</span></button>';
      }).join('')+'</div>';
  }

  function signature() { return JSON.stringify([lang(),mode,chosen,demo,candidate,enquiryId,swapSlot,swapSource,steps.length]); }
  function paint() {
    panel.dataset.mode=mode;
    const close=panel.querySelector('[data-panel-close]');
    close.setAttribute('aria-label',steps.length?u('backStep'):t('close'));
    close.textContent=steps.length?'←':'×';
    body.dataset.panelSignature=signature();
    if (mode==='pick' || mode==='swap') body.innerHTML=chooseView();
    else if (mode==='replace') body.innerHTML=replaceView();
    else if (mode==='fit-pick') body.innerHTML=fitChoices();
    else if (mode==='enquiry') body.innerHTML=enquiryView();
    else body.innerHTML=compareView();
  }
  function show(next) {
    mode=next;
    paint();
    body.scrollTop=0;
    body.querySelector('#panel-title').focus({preventScroll:true});
  }
  function messageFor(id) {
    const p=byId.get(id);
    return p?t('message').replace('{model}',p.name).replace('{price}',price(p.price)):u('genericMessage');
  }
  function restoreSelection(ids) {
    const valid=Array.isArray(ids)?[...new Set(ids.filter(id=>byId.has(id)))].slice(0,2):[];
    chosen.splice(0,chosen.length,...valid);
  }
  function capturePanel() {
    return {...rememberView(), enquiryId, candidate, swapSource, swapSlot, chosen:[...chosen], demo:[...demo]};
  }
  function restorePanel(state, reopen) {
    enquiryId=state.enquiryId;candidate=state.candidate;swapSource=state.swapSource;swapSlot=state.swapSlot;
    restoreSelection(state.chosen);
    demo=[...state.demo];
    reopen(state.mode);
    restorePosition(state);
    if (state.mode==='enquiry') window.showroom.noteModel(enquiryId || null);
    else if (['compare','fit-pick','pick','replace'].includes(state.mode)) window.showroom.noteCompare();
    notify();
  }
  function open(next,opener) {
    const fresh=!panel.open;
    if (fresh) {
      returnTo=opener instanceof HTMLElement ? opener : document.activeElement;
      originDialog=returnTo?.closest('dialog[open]') || null;
      restoreKind=returnTo?.hasAttribute('data-detail-ask')?'ask':'compare';
      const openerKind=restoreKind;
      returnToTray=Boolean(returnTo?.closest('#tray'));
      window.showroom?.layers?.enter(panelLayer,()=>dismiss(true),state=>{
        // Reopening a parent detail sheet can replace the original CTA node.
        const fallback=document.querySelector('#details[open] [data-detail-'+openerKind+']');
        restorePanel(state,mode=>open(mode,opener?.isConnected?opener:fallback));
      },capturePanel);
    }
    show(next);
    if (fresh) {
      panel.showModal();
      body.querySelector('#panel-title').focus({preventScroll:true});
    }
  }
  function rememberView() {
    return {mode,scroll:body.scrollTop,expanded:[...body.querySelectorAll('details')].map(n=>n.open)};
  }
  function restoreView(view) {
    show(view.mode);
    restorePosition(view);
  }
  function restorePosition(view) {
    [...body.querySelectorAll('details')].forEach((n,i)=>{n.open=!!view.expanded[i];});
    body.scrollTop=view.scroll;
  }
  function enterStep(next,openerSelector) {
    const key=panelLayer+'-step-'+steps.length;
    steps.push({key,openerSelector,view:rememberView()});
    window.showroom?.layers?.enter(key,()=>backStep(true),
      state=>restorePanel(state,mode=>enterStep(mode,openerSelector)),capturePanel);
    show(next);
  }
  function backStep(browser=false) {
    const step=steps.pop();
    if (!step) { dismiss(browser);return; }
    if (!browser) window.showroom?.layers?.leave(step.key);
    restoreView(step.view);
    body.querySelector(step.openerSelector)?.focus({preventScroll:true});
  }
  function dismiss(browser=false) {
    if (!panel.open) return;
    if (steps.length) { backStep(browser);return; }
    if (!browser) window.showroom?.layers?.leave(panelLayer);
    panel.close();
    restoreAfterClose();
  }
  function resume(opener) {
    window.showroom?.noteCompare?.();
    const next=count()===2?'compare':'pick';
    if (mode==='example' && panel.open) enterStep(next,'[data-pan=resume]');
    else open(next,opener);
  }
  function toggleCompare(id,opener) {
    if (!byId.has(id)) return;
    if (isCompared(id)) { resume(opener);return; }
    window.showroom?.noteCompare?.();
    if (count()===2) { candidate=id;open('replace',opener);return; }
    chosen.push(id);
    open(count()===2?'compare':'pick',opener);
    if (count()===2) returnToTray=true;
    notify();
  }
  function remove(id) {
    const index=chosen.indexOf(id);
    if (index<0) return;
    const keyboardFocus=document.activeElement?.matches(':focus-visible');
    chosen.splice(index,1);
    window.showroom?.noteCompare?.();
    notify();
    const catalogControl=[...document.querySelectorAll('#directory [data-dir-compare="'+id+'"],#directory [data-dir-model="'+id+'"]')].find(el=>el.getClientRects().length);
    const next=tray.querySelector('[data-pan=resume]') || catalogControl || document.querySelector('[data-nav-comparison]');
    next?.focus({preventScroll:!keyboardFocus});
  }
  function pickModel(id,button) {
    if (!byId.has(id)) return;
    if (mode!=='swap') { toggleCompare(id,button);return; }
    const target=personalOrDemo(swapSource);
    if (target.includes(id)) return;
    target[swapSlot]=id;
    if (swapSource==='compare') window.showroom?.noteCompare?.();
    backStep();
    if (swapSource==='compare') notify();
  }
  function enquire(id,opener) {
    const p=byId.get(id);
    enquiryId=p?.id || '';
    if (p) window.showroom?.noteModel?.(id);
    if (panel.open && opener?.matches('[data-ask-model]')) {
      enterStep('enquiry','[data-ask-model="'+id+'"]');
    } else open('enquiry',opener);
  }
  function fit(opener) {
    const intent=window.showroom?.intent;
    if (intent?.kind==='model' && byId.has(intent.id)) { enquire(intent.id,opener);return; }
    if (intent?.kind==='compare' && count()===2) { open('fit-pick',opener);return; }
    if (intent?.kind==='compare' && count()===1) {
      // The current comparison is unambiguous; an installation check does not change it.
      enquiryId=chosen[0];open('enquiry',opener);return;
    }
    enquiryId='';open('enquiry',opener);
  }
  function dispatch(e) {
    const button=e.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-panel-close')) { dismiss();return; }
    if (button.dataset.remove) { remove(button.dataset.remove);return; }
    if (button.dataset.pick) { pickModel(button.dataset.pick,button);return; }
    if (button.dataset.askModel) { enquire(button.dataset.askModel,button);return; }
    if (button.dataset.swapSlot!==undefined) {
      swapSlot=Number(button.dataset.swapSlot);swapSource=sourceOf();
      enterStep('swap','[data-swap-slot="'+swapSlot+'"]');return;
    }
    if (button.dataset.replace!==undefined) {
      const slot=Number(button.dataset.replace);
      if (!byId.has(candidate) || ![0,1].includes(slot) || count()!==2) return;
      chosen[slot]=candidate;candidate='';
      window.showroom?.noteCompare?.();
      returnToTray=true;
      show('compare');notify();return;
    }
    if (button.dataset.pan==='resume') resume(button);
    if (button.dataset.pan==='cancelSwap') backStep();
    if (button.dataset.pan==='cancelReplace') dismiss();
  }
  panel.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  panel.addEventListener('click',e=>{
    if (e.target===panel) {
      const r=panel.getBoundingClientRect();
      if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dismiss();
      return;
    }
    dispatch(e);
  });
  tray.addEventListener('click',dispatch);
  panel.addEventListener('change',e=>{
    if (!e.target.matches('[data-panel-model]')) return;
    enquiryId=byId.has(e.target.value)?e.target.value:'';
    window.showroom?.noteModel?.(enquiryId || null);
    paint();
    body.querySelector('[data-panel-model]').focus({preventScroll:true});
  });
  function restoreAfterClose() {
    if (panel.open || !mode) return;
    mode='';candidate='';panel.dataset.mode='';
    const owner=originDialog;
    const old=returnTo?.isConnected && returnTo.getClientRects().length?returnTo:null;
    const preferBoard=returnToTray;
    returnTo=null;originDialog=null;returnToTray=false;
    if ((owner && !owner.open) || [...document.querySelectorAll('dialog[open]')].some(d=>d!==owner)) return;
    const detail=document.querySelector('#details[open]');
    const board=tray.querySelector('[data-pan=resume]');
    const detailControl=detail?.querySelector(restoreKind==='ask'?'[data-detail-ask]':'[data-detail-compare]');
    const focus=detail ? (detail.contains(old)?old:detailControl) :
      (preferBoard && board ? board : old || board || document.querySelector('[data-choose-compare]'));
    focus?.focus({preventScroll:true});
  }
  // Native close events can arrive after another layer has already handled Back.
  panel.addEventListener('close',restoreAfterClose);
  function refresh() {
    drawTray();
    if (!panel.open || body.dataset.panelSignature===signature()) return;
    const view=rememberView();
    restoreView(view);
  }
  window.lockPanels={count,resume,toggleCompare,isCompared,enquire,fit,messageFor,selectedIds:()=>[...chosen],restoreSelection,
    example:opener=>{demo=[...examplePair];open('example',opener);},choose:resume,refresh};
})();
