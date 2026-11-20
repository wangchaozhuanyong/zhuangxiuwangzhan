(() => {
  'use strict';

  const text = {
    zh: {
      all:'全部',entrance:'入户门',room:'室内门',slim:'窄框铝门',filter:'按门型筛选',index:'型号索引',model:'型号',choose:'选择型号',chooseOther:'切换型号',close:'关闭',
      installed:'含安装',views:'产品视图',product:'产品图',installation:'安装实拍',width:'面板宽度',outside:'门外侧',inside:'门内侧',handle:'把手细节',
      dimensions:'锁体尺寸',fit:'适用门型',access:'开锁方式',visitor:'访客与屏幕',screen:'室内屏幕',security:'安全提醒',privacy:'室内反锁',peephole:'防猫眼开启',
      power:'应急供电',ask:'咨询 {model}',compare:'加入对比',nextCompare:'选第二款',viewCompare:'查看对比',replace:'替换对比型号',
      full:'完整规格',back:'返回选款',prev:'上一款',next:'下一款',overview:'主要功能',models:'款',show:'查看型号',total:'含安装',
      pageUp:'向上浏览型号',pageDown:'向下浏览型号',range:'当前可见第 {range} 款，共 {total} 款',
      indexKeys:'用上下方向键选款，按回车阅读本款规格。',
      panel:'窄框面板',colour:'颜色',panelWidth:'面板宽度',indexCount:'款型号',stockroom:'产品档案',doorFit:'窄框铝门',fitNote:'选购前，请量门框的可用宽度，并核对现有锁孔。',
    },
    en: {
      all:'All',entrance:'Entrance doors',room:'Room doors',slim:'Slim aluminium doors',filter:'Filter by door type',index:'Model index',model:'Model',choose:'Choose a model',chooseOther:'Change model',close:'Close',
      installed:'Installation included',views:'Product views',product:'Product view',installation:'Installed view',width:'Panel width',outside:'Outside',inside:'Inside',handle:'Handle detail',
      dimensions:'Lock dimensions',fit:'Door type',access:'Access methods',visitor:'Visitors & display',screen:'Indoor display',security:'Security alerts',privacy:'Inside privacy lock',peephole:'Peephole protection',
      power:'Emergency power',ask:'Enquire about {model}',compare:'Add to comparison',nextCompare:'Choose second lock',viewCompare:'View comparison',replace:'Replace a lock',
      full:'Full specifications',back:'Back to models',prev:'Previous',next:'Next',overview:'Key features',models:'models',show:'View model',total:'Installed price',
      pageUp:'Scroll to previous models',pageDown:'Scroll to more models',range:'Showing models {range} of {total}',
      indexKeys:'Use the up and down arrows to choose a model. Press Enter to read its specifications.',
      panel:'Slim panel',colour:'Colour',panelWidth:'Panel width',indexCount:'models',stockroom:'Model file',doorFit:'Slim aluminium doors',fitNote:'Measure the usable width of your door frame and check the existing lock cut-out before ordering.',
    },
    ms: {
      all:'Semua',entrance:'Pintu utama',room:'Pintu bilik',slim:'Pintu aluminium sempit',filter:'Tapis ikut jenis pintu',index:'Indeks model',model:'Model',choose:'Pilih model',chooseOther:'Tukar model',close:'Tutup',
      installed:'Termasuk pemasangan',views:'Paparan produk',product:'Imej produk',installation:'Foto pemasangan',width:'Lebar panel',outside:'Bahagian luar',inside:'Bahagian dalam',handle:'Butiran pemegang',
      dimensions:'Ukuran kunci',fit:'Jenis pintu',access:'Cara buka kunci',visitor:'Pelawat dan skrin',screen:'Skrin dalaman',security:'Amaran keselamatan',privacy:'Kunci privasi dalaman',peephole:'Perlindungan lubang intai',
      power:'Kuasa kecemasan',ask:'Tanya tentang {model}',compare:'Tambah ke perbandingan',nextCompare:'Pilih kunci kedua',viewCompare:'Lihat perbandingan',replace:'Gantikan model',
      full:'Spesifikasi penuh',back:'Kembali ke model',prev:'Sebelumnya',next:'Seterusnya',overview:'Ciri utama',models:'model',show:'Lihat model',total:'Harga siap pasang',
      pageUp:'Tatal ke model sebelumnya',pageDown:'Tatal ke model seterusnya',range:'Memaparkan model {range} daripada {total}',
      indexKeys:'Gunakan anak panah atas atau bawah untuk memilih model. Tekan Enter untuk membaca spesifikasinya.',
      panel:'Panel sempit',colour:'Warna',panelWidth:'Lebar panel',indexCount:'model',stockroom:'Fail model',doorFit:'Pintu aluminium berbingkai sempit',fitNote:'Sebelum memesan, ukur ruang yang tersedia pada bingkai pintu dan periksa lubang kunci sedia ada.',
    },
  };
  const images = {
    'v37j-p16':[['outside','v37-out.webp'],['inside','v37-in.webp'],['handle','v37-handle.webp']],
    'k26j-pro':[['outside','k26-front.webp'],['inside','k26-inside.webp']],
  };
  const filters=['all','entrance','room','slim'];
  const state={id:'d10b',filter:'all',view:0,detailOrigin:null,pickerOrigin:null,returnY:0};
  const phone=window.matchMedia('(max-width:700px)');
  const pickerLayout=window.matchMedia('(min-width:701px) and (max-width:1050px)');
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const $=(selector,root=document)=>root.querySelector(selector);
  const lib=()=>window.lockCatalog;
  const model=()=>lib().find(p=>p.id===state.id);
  const options=()=>{
    if(images[state.id])return images[state.id];
    const views=[['product',model().image.slice('assets/'.length)]];
    if(state.id==='d10b')views.push(['installation','p-d10b.webp'],['width','d10b-width.webp']);
    return views;
  };
  const list=()=>lib().filter(p=>state.filter==='all'||p.group===state.filter);
  const mobileList=()=>{
    const items=list();
    if(state.filter!=='all')return items;
    const featured=['v37j-p16','k26j-pro','g13','d10b'];
    return [...featured.map(id=>items.find(p=>p.id===id)),...items.filter(p=>!featured.includes(p.id))];
  };
  const site=()=>window.showroom;
  const lang=()=>text[site().lang]?site().lang:'en';
  const t=k=>text[lang()][k];
  const loc=field=>field?.[lang()] || '';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money=n=>'RM'+n.toLocaleString('en-MY');
  const asset=filename=>esc(site().asset('assets/'+filename));
  const priceLabel=p=>p.name+' · '+money(p.price)+' · '+t('installed');
  const viewName=()=>t(options()[state.view][0]);
  const layer=(method,...args)=>site().layers?.[method]?.(...args);
  const focus=el=>{if(el?.isConnected)el.focus({preventScroll:true});};
  const focusable=el=>el?.isConnected&&el.getClientRects().length>0;
  const setAttr=(el,key,value)=>el.setAttribute(key,String(value));
  const detail=()=>$('#details');
  const picker=()=>$('#model-picker');
  const arrow='<span aria-hidden="true">↗</span>';

  function drawFilters() {
    const root=$('.dir-filters');
    setAttr(root,'aria-label',t('filter'));
    root.innerHTML=filters.map(key=>{
      const count=key==='all'?lib().length:lib().filter(p=>p.group===key).length;
      return '<button type="button" data-dir-filter="'+key+'" aria-pressed="'+(state.filter===key)+'"><span>'+t(key)+'</span><small>'+count+'</small></button>';
    }).join('');
  }
  function thumb(source, eager=false) {
    return '<span class="dir-thumb"><img src="'+esc(site().asset(source))+'" alt="" decoding="async" loading="'+(eager?'eager':'lazy')+'"></span>';
  }
  function indexItems(items,kind) {
    return items.map(p=>'<button type="button" data-dir-'+kind+'="'+p.id+'"'+(kind==='model'?' tabindex="'+(p.id===state.id?0:-1)+'"':'')+' aria-label="'+esc(priceLabel(p))+'" aria-pressed="'+(p.id===state.id)+'">'+
      thumb(p.thumbnail,kind==='pick')+'<b class="dir-index-model">'+esc(p.name)+'</b><small class="dir-index-price">'+money(p.price)+'</small></button>').join('');
  }
  function mobileCards(items) {
    return items.map(p=>{
      const highlights=window.lockFeatures[p.id].highlights.map(field=>'<span>'+esc(loc(field))+'</span>').join('');
      return '<article class="dir-card"><button type="button" class="dir-card-open" data-dir-card="'+p.id+'" aria-haspopup="dialog" aria-label="'+esc(t('show')+' '+priceLabel(p))+'">'+
        '<span class="dir-card-photo">'+thumb(p.cardImage)+'</span><span class="dir-card-info"><span class="dir-card-category"><small>'+t(p.group)+'</small><i aria-hidden="true">↗</i></span><b>'+esc(p.name)+'</b><span class="dir-card-highlights">'+highlights+'</span><span class="dir-card-foot"><small>'+t('total')+'</small><strong>'+money(p.price)+'</strong></span></span></button>'+
        '<button type="button" class="dir-card-compare" data-dir-compare="'+p.id+'" aria-haspopup="dialog"></button></article>';
    }).join('');
  }
  function boardMarkup() {
    return '<figure class="dir-board"><div class="dir-plate-head"><b class="dir-board-model"></b><span class="dir-board-label"></span></div>'+
      '<div class="dir-drawing"><span class="dir-cross dir-cross-a" aria-hidden="true"></span><span class="dir-cross dir-cross-b" aria-hidden="true"></span><img class="dir-drawing-img" alt="" decoding="async" loading="lazy"></div>'+
      '<figcaption class="dir-board-foot"><span class="dir-view-label"></span><div class="dir-views" role="group"></div><b class="dir-board-dimension"></b></figcaption></figure>';
  }
  function drawBoard(root) {
    const p=model(), items=options(), [label,file]=items[state.view], board=$('.dir-board',root);
    if(!board)return;
    board.dataset.model=p.id;board.dataset.view=label;
    board.dataset.photo=label==='width'||label==='handle'?'plate':label==='installation'?'installed':'product';
    $('.dir-board-model',board).textContent=p.name;
    $('.dir-board-label',board).textContent=items.length>1?String(state.view+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0'):t('product');
    const img=$('img',board), src=site().asset('assets/'+file);
    if(img.getAttribute('src')!==src)img.src=src;
    img.alt=p.name+' · '+viewName();
    const dims=loc(window.lockFeatures[p.id].specs.dimensions);
    $('.dir-view-label',board).textContent=items.length===1?t('dimensions'):t('views');
    const dimension=$('.dir-board-dimension',board);
    dimension.hidden=items.length!==1||!dims;dimension.textContent=dims;
    $('.dir-board-foot',board).hidden=items.length===1&&!dims;
    const controls=$('.dir-views',board);
    controls.hidden=items.length<2;
    setAttr(controls,'aria-label',t('views'));
    if(controls.children.length!==items.length)controls.innerHTML=items.map((v,i)=>'<button type="button" data-dir-view="'+i+'"></button>').join('');
    $$('.dir-views button',board).forEach((b,i)=>{b.textContent=t(items[i][0]);setAttr(b,'aria-pressed',i===state.view);});
  }
  function featureRows(p,f) {
    const s=f.specs;
    const rows = [
      ['fit',p.group==='slim'?t('doorFit'):t(p.group)],
      ...(p.id==='d10b'?[['panelWidth','38.6 mm']]:[]),
      ['access',loc(s.access)],
      [f.visitor?'visitor':'screen',loc(f.visitor||s.screen)],
      ['privacy',loc(s.privacy)],['peephole',loc(s.peephole)],
      ['security',loc(f.security)],['power',[loc(f.emergency || s.emergency),loc(s.phoneBackup)].filter(Boolean).join(' · ')],
    ];
    return rows.filter(row=>row[1]).map(([key,value])=>'<div data-dir-feature="'+key+'"><dt>'+t(key)+'</dt><dd>'+esc(value)+'</dd></div>').join('');
  }
  function identityMarkup(headingId) {
    const p=model(),f=window.lockFeatures[p.id];
    return '<div class="dir-identity"><span class="dir-kicker">'+esc(loc(f.type))+'</span><h3 id="'+headingId+'" tabindex="-1">'+esc(p.name)+'</h3><div class="dir-price"><strong>'+money(p.price)+'</strong><small>'+t('installed')+'</small></div></div>';
  }
  function factsMarkup() {
    const p=model(),f=window.lockFeatures[p.id];
    return '<div class="dir-facts"><h4>'+t('overview')+'</h4><dl>'+featureRows(p,f)+'</dl>'+(p.id==='d10b'?'<p class="dir-fit-note">'+t('fitNote')+'</p>':'')+'</div>';
  }
  function actions(p) {
    return '<div class="dir-actions"><button type="button" data-dir-ask="'+p.id+'" data-detail-ask aria-haspopup="dialog">'+esc(t('ask').replace('{model}',p.name))+arrow+'</button>'+
      '<button type="button" data-dir-compare="'+p.id+'" data-detail-compare aria-haspopup="dialog"></button></div>';
  }
  function comparisonState(root=document) {
    const count=window.lockPanels?.count?.() || 0;
    $$('[data-dir-compare]',root).forEach(b=>{
      const selected=site().isCompared(b.dataset.dirCompare);
      const key=selected?(count===1?'nextCompare':'viewCompare'):(count===2?'replace':'compare');
      const p=lib().find(p=>p.id===b.dataset.dirCompare);
      const label=t(key)+' · '+p.name;
      if(b.getAttribute('aria-label')===label && b.getAttribute('aria-pressed')===String(selected))return;
      b.innerHTML='<span aria-hidden="true">'+(selected?'✓':count===2?'⇄':'+')+'</span> '+t(key);
      setAttr(b,'aria-label',label);
      setAttr(b,'aria-pressed',selected);
    });
  }
  function specTable(p) {
    const f=window.lockFeatures[p.id], values=f.specs;
    const keys=[...new Set(['dimensions','type','material','finish','color','weight',...Object.keys(window.lockSpecLabels)])];
    const pairs=[['model',t('model'),p.name],...keys.filter(k=>values[k]).map(k=>[k,loc(window.lockSpecLabels[k]),loc(values[k])])];
    return '<p class="dir-product-copy">'+esc(loc(p.copy))+'</p><dl class="dir-spec-table">'+pairs.map(([key,label,value])=>'<div data-dir-property="'+key+'"><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
  }
  function fullSpecs() {
    const p=model();
    return '<section class="dir-full-spec"><div class="dir-spec-heading"><h4>'+t('full')+'</h4><span class="dir-spec-model">'+esc(p.name)+'</span></div>'+
      '<div class="dir-spec-body">'+specTable(p)+'</div></section>';
  }
  function ensureIndex() {
    const rail=$('.dir-index-list'), selected=rail.querySelector('[aria-pressed="true"]');
    if(!selected || !rail.clientHeight)return;
    const b=selected.getBoundingClientRect(),r=rail.getBoundingClientRect();
    if(b.top<r.top)rail.scrollTop+=b.top-r.top;
    if(b.bottom>r.bottom)rail.scrollTop+=b.bottom-r.bottom;
  }
  function updateIndexRange() {
    const rail=$('.dir-index-list');
    if(!rail.clientHeight || !rail.children.length)return;
    const rows=Array.from(rail.children), bounds=rail.getBoundingClientRect();
    const visible=rows.filter(row=>{
      const box=row.getBoundingClientRect();
      return box.bottom>=bounds.top+1 && box.top<=bounds.bottom-1;
    });
    if(!visible.length)return;
    const first=rows.indexOf(visible[0])+1,last=rows.indexOf(visible.at(-1))+1;
    const interval=first===last?String(first):first+'–'+last;
    const indicator=$('.dir-index-range'), value=interval+' / '+rows.length;
    if(indicator.textContent!==value)indicator.textContent=value;
    indicator.setAttribute('aria-label',t('range').replace('{range}',interval).replace('{total}',rows.length));
    const active=document.activeElement;
    const up=$('[data-dir-page="-1"]'), down=$('[data-dir-page="1"]');
    up.disabled=rail.scrollTop<=1;
    down.disabled=rail.scrollHeight-rail.clientHeight-rail.scrollTop<=1;
    if(active===up && up.disabled)focus(visible[0]);
    if(active===down && down.disabled)focus(visible.at(-1));
  }
  function drawLists() {
    const items=list();
    const rail=$('.dir-index-list'), lastOffset=rail.scrollTop;
    rail.setAttribute('aria-description',t('indexKeys'));
    rail.innerHTML=indexItems(items,'model');
    rail.scrollTop=lastOffset;
    $('.dir-cards').innerHTML=mobileCards(mobileList());
    $('.dir-index-caption').textContent=t('index');
    $('.dir-index-amount').textContent=items.length+' '+t('indexCount');
    for(const b of $$('[data-dir-page]')){
      b.title=t(b.dataset.dirPage==='1'?'pageDown':'pageUp');
      b.setAttribute('aria-label',b.title);
    }
    $('.dir-picker-button span').textContent=t('chooseOther');
    ensureIndex();
    updateIndexRange();
    if(picker().open)drawPicker();
    comparisonState($('.dir-cards'));
  }
  function drawWorkspace() {
    const root=$('.dir-workspace');
    const previousScroll=root.dataset.model===state.id?$('.dir-reading',root)?.scrollTop:0;
    setAttr(root,'data-model',state.id);
    drawBoard(root);
    $('.dir-sheet-info',root).innerHTML=identityMarkup('dir-name')+
      '<div class="dir-reading" role="region" tabindex="0" aria-labelledby="dir-name dir-full-label">'+factsMarkup()+
      '<div class="dir-desktop-spec">'+fullSpecs()+'</div></div>'+actions(model());
    $('.dir-desktop-spec h4',root).id='dir-full-label';
    $('.dir-reading',root).scrollTop=previousScroll||0;
    $('.dir-picker-current').textContent=model().name;
    setAttr($('.dir-picker-button'),'aria-label',t('chooseOther')+' · '+model().name);
    $$('.dir-index-list [data-dir-model]').forEach(b=>{
      const selected=b.dataset.dirModel===state.id;
      setAttr(b,'aria-pressed',selected);
      b.tabIndex=selected?0:-1;
    });
    ensureIndex();
    comparisonState(root);
  }
  function drawDetail() {
    const modal=detail(),items=mobileList(),i=items.findIndex(p=>p.id===state.id);
    modal.dataset.model=state.id;
    modal.innerHTML='<div class="dir-mobile-frame"><div class="dir-mobile-bar"><button type="button" data-dir-back><i aria-hidden="true">←</i>'+t('back')+'</button>'+
      '<div class="dir-pager"><button type="button" data-dir-prev aria-label="'+t('prev')+'"'+(i===0?' disabled':'')+'>‹</button><span>'+(i+1)+' / '+items.length+'</span><button type="button" data-dir-next aria-label="'+t('next')+'"'+(i===items.length-1?' disabled':'')+'>›</button></div></div>'+
      '<div class="dir-mobile-scroll" role="region" tabindex="0" aria-label="'+esc(model().name+' · '+t('full'))+'"><div class="dir-mobile-sheet">'+identityMarkup('detail-name')+boardMarkup()+factsMarkup()+fullSpecs()+'</div></div>'+actions(model())+'</div>';
    drawBoard(modal);comparisonState(modal);
  }
  function drawPicker() {
    const modal=picker(),last=$('.dir-pick-items',modal)?.scrollTop??0;
    setAttr(modal,'aria-labelledby','dir-pick-title');
    modal.innerHTML='<div class="dir-pick-top"><h3 id="dir-pick-title">'+t('choose')+'</h3><button type="button" data-dir-pick-close aria-label="'+t('close')+'">×</button></div>'+
      '<div class="dir-pick-items">'+indexItems(list(),'pick')+'</div>';
    $('.dir-pick-items',modal).scrollTop=last;
  }
  function focusCurrentSelection() {
    const control=phone.matches?$('[data-dir-card="'+state.id+'"]'):
      pickerLayout.matches?$('[data-dir-picker]'):$('[data-dir-model="'+state.id+'"]');
    if(!focusable(control))return;
    focus(control);
    const reveal=()=>{
      if(document.activeElement===control)control.scrollIntoView({block:'nearest',behavior:'instant'});
    };
    // Browsers restore the previous scroll offset after dismissing the obsolete dialog.
    if(history.state?.precisionLayers?.length)window.addEventListener('popstate',()=>requestAnimationFrame(reveal),{once:true});
    reveal();
  }
  function closeMobile(fromHistory=false) {
    const modal=detail();
    if(!modal.open)return;
    if(!fromHistory)layer('leave','directory-detail');
    modal.close();
    const origin=state.detailOrigin, sameCard=origin?.dataset.dirCard;
    state.detailOrigin=null;
    const fallback=sameCard?$('[data-dir-card="'+sameCard+'"]'):null;
    if(phone.matches && focusable(origin))focus(origin);
    else if(focusable(fallback))focus(fallback);
    else focusCurrentSelection();
    if(phone.matches && Math.abs(scrollY-state.returnY)>1)window.scrollTo({top:state.returnY,behavior:'instant'});
  }
  function closePicker(fromHistory=false) {
    if(!picker().open)return;
    if(!fromHistory)layer('leave','directory-picker');
    picker().close();
    if(focusable(state.pickerOrigin))focus(state.pickerOrigin);
    else focusCurrentSelection();
  }
  function openPicker(button) {
    if(picker().open)return;
    state.pickerOrigin=button;drawPicker();picker().showModal();
    layer('enter','directory-picker',()=>closePicker(true),saved=>{
      if(!pickerLayout.matches)return false;
      restore(saved);
      openPicker($('.dir-picker-button'));
      $('.dir-pick-items',picker()).scrollTop=saved.scroll;
    },()=>({...snapshot(),scroll:$('.dir-pick-items',picker()).scrollTop}));
    const b=picker().querySelector('[aria-pressed="true"]');
    if(b){b.scrollIntoView({block:'nearest'});focus(b);}
  }
  function select(id,user=true) {
    if(!lib().some(p=>p.id===id))return false;
    if(user)site().noteModel?.(id);
    if(id===state.id)return true;
    state.id=id;state.view=0;
    if(!phone.matches)drawWorkspace();
    return true;
  }
  function show(id,opener) {
    const p=lib().find(item=>item.id===id);if(!p)return;
    if(!list().some(item=>item.id===id)){
      state.filter='all';drawFilters();drawLists();
    }
    select(id);
    if(phone.matches){
      if(detail().open){drawDetail();return;}
      state.returnY=window.scrollY;state.detailOrigin=opener||document.activeElement;
      drawDetail();detail().showModal();layer('enter','directory-detail',()=>closeMobile(true),saved=>{
        if(!phone.matches)return false;
        restore(saved);
        show(state.id,focusable(opener)?opener:$('[data-dir-card="'+state.id+'"]'));
        $('.dir-mobile-scroll',detail()).scrollTop=saved.scroll;
      },()=>({...snapshot(),scroll:$('.dir-mobile-scroll',detail()).scrollTop}));
      focus($('[data-dir-back]',detail()));
    }else{
      const head=$('#collection');
      head.scrollIntoView({block:'start',behavior:'instant'});
      focus($('#dir-name',head));
    }
  }
  function move(step) {
    const items=mobileList(),i=items.findIndex(p=>p.id===state.id),next=items[i+step];
    if(!next)return;select(next.id);drawDetail();
    const b=$(step>0?'[data-dir-next]':'[data-dir-prev]',detail());
    focus(!b.disabled?b:$(step>0?'[data-dir-prev]':'[data-dir-next]',detail()));
  }
  function click(e) {
    const b=e.target.closest('button');if(!b)return;
    const d=b.dataset;
    if(d.dirPage!==undefined){
      const rail=$('.dir-index-list');
      // Leave one familiar row in view between pages.
      const step=Math.max(1,rail.clientHeight-rail.firstElementChild.offsetHeight);
      rail.scrollBy({top:Number(d.dirPage)*step,behavior:'instant'});return;
    }
    if(d.dirFilter!==undefined){
      if(!filters.includes(d.dirFilter)||state.filter===d.dirFilter)return;
      state.filter=d.dirFilter;
      const eligible=list(),intent=site().intent;
      if(!eligible.some(p=>p.id===state.id))select(eligible[0].id,false);
      if(eligible.length===1)site().noteModel(eligible[0].id);
      else if(intent?.kind==='model' && !eligible.some(p=>p.id===intent.id))site().noteModel(null);
      drawFilters();drawLists();focus($('[data-dir-filter="'+state.filter+'"]'));return;
    }
    if(d.dirModel!==undefined){
      select(d.dirModel);
      if(e.detail===0 && document.activeElement===b)focus($('.dir-reading'));
      return;
    }
    if(d.dirPick!==undefined){select(d.dirPick);closePicker();return;}
    if(d.dirPicker!==undefined){openPicker(b);return;}
    if(d.dirPickClose!==undefined){closePicker();return;}
    if(d.dirCard!==undefined){show(d.dirCard,b);return;}
    if(d.dirBack!==undefined){closeMobile();return;}
    if(d.dirPrev!==undefined||d.dirNext!==undefined){move(d.dirPrev!==undefined?-1:1);return;}
    if(d.dirView!==undefined){
      const i=Number(d.dirView);if(!options()[i])return;
      state.view=i;drawBoard(detail().open?detail():$('.dir-workspace'));return;
    }
    if(d.dirAsk!==undefined){site().enquire(d.dirAsk,b);return;}
    if(d.dirCompare!==undefined)site().toggleCompare(d.dirCompare,b);
  }
  let mounted=false;
  function mount() {
    const root=$('#directory');
    const tray=$('#tray');
    root.innerHTML='<div class="dir-filterbar"><div class="dir-filters" role="group"></div></div>'+
      '<button type="button" class="dir-picker-button" data-dir-picker aria-haspopup="dialog"><span></span><b class="dir-picker-current"></b><i aria-hidden="true">⌄</i></button>'+
      '<div class="dir-workspace"><aside class="dir-index" aria-labelledby="dir-index-title"><div class="dir-index-head"><b class="dir-index-caption" id="dir-index-title"></b><span class="dir-index-amount"></span></div>'+
      '<div class="dir-index-list" id="dir-index-list" role="toolbar" aria-orientation="vertical" aria-labelledby="dir-index-title"></div><div class="dir-index-nav">'+
      '<button type="button" data-dir-page="-1" aria-controls="dir-index-list">↑</button><output class="dir-index-range" aria-live="off"></output>'+
      '<button type="button" data-dir-page="1" aria-controls="dir-index-list">↓</button></div></aside>'+
      boardMarkup()+'<section class="dir-sheet-info" aria-labelledby="dir-name"></section></div>'+
      '<div class="dir-cards"></div>';
    $('.dir-cards',root).before(tray);
    new ResizeObserver(()=>{
      root.style.setProperty('--dir-tray-height',tray.offsetHeight+'px');
    }).observe(tray);
    $('.dir-cards',root).addEventListener('focusin',e=>{
      if(tray.hidden || !e.target.matches(':focus-visible'))return;
      const edge=tray.getBoundingClientRect().bottom,card=e.target.getBoundingClientRect();
      if(card.top<edge && card.bottom>0)e.target.scrollIntoView({block:'start',behavior:'instant'});
    });
    const rail=$('.dir-index-list',root);
    rail.addEventListener('keydown',e=>{
      const row=e.target.closest('[data-dir-model]');
      if(!row || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)return;
      const rows=Array.from(rail.children),index=rows.indexOf(row);
      const next={ArrowUp:Math.max(0,index-1),ArrowDown:Math.min(rows.length-1,index+1),Home:0,End:rows.length-1}[e.key];
      if(next===undefined)return;
      e.preventDefault();
      select(rows[next].dataset.dirModel);
      focus(rows[next]);
    });
    rail.addEventListener('scroll',updateIndexRange,{passive:true});
    new ResizeObserver(updateIndexRange).observe(rail);
    [root,detail(),picker()].forEach(el=>el.addEventListener('click',click));
    [[detail(),closeMobile],[picker(),closePicker]].forEach(([el,close])=>{
      el.addEventListener('cancel',e=>{e.preventDefault();close();});
      el.addEventListener('click',e=>{if(e.target!==el)return;const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
    });
    function finishMobileDetail() {
      // A consultation or comparison can sit above this dialog. Its Back entry must
      // be consumed first, even if the viewport has changed in the meantime.
      if(!phone.matches && detail().open && !$('#panel').open)closeMobile();
    }
    phone.addEventListener('change',()=>{
      if(!phone.matches)drawWorkspace();
      finishMobileDetail();
    });
    $('#panel').addEventListener('close',finishMobileDetail);
    pickerLayout.addEventListener('change',()=>{
      if(!pickerLayout.matches && picker().open)closePicker();
    });
    mounted=true;
  }
  function refresh() {
    if(!mounted)mount();
    const mobileY=$('.dir-mobile-scroll',detail())?.scrollTop||0;
    drawFilters();drawLists();drawWorkspace();
    if(detail().open){drawDetail();$('.dir-mobile-scroll',detail()).scrollTop=mobileY;}
  }
  function snapshot() {
    return {id:state.id,filter:state.filter,view:state.view};
  }
  function restore(data) {
    if(!data || !filters.includes(data.filter))return;
    const p=lib().find(item=>item.id===data.id);
    if(!p || (data.filter!=='all' && p.group!==data.filter))return;
    const changed=state.id!==p.id || state.filter!==data.filter || state.view!==data.view;
    state.id=p.id;state.filter=data.filter;
    state.view=Number.isInteger(data.view) && data.view>=0 && data.view<options().length?data.view:0;
    if(changed || !mounted)refresh();
  }
  window.directory={refresh,syncCompare:comparisonState,show,snapshot,restore};
})();
