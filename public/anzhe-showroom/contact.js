(() => {
  const number = '601128853888';
  const phone = '+60 11-2885 3888';
  const email = 'support@flashcast.com.my';
  const coordinates = '3.0830403%2C101.6708234';
  const copy = {
    zh: {
      contactNav:'联系我们', contactTitle:'联系电子锁顾问', contactIntro:'选好了型号，或想确认家里的门能不能装？可以把门的正面和门边照片发给我们。',
      chatLabel:'WhatsApp 咨询', callLabel:'致电 FLASH CAST', callShort:'电话咨询', officeTitle:'吉隆坡办公室', officeHours:'办公时间',
      dailyHours:'每天 10:00–19:00', appointment:'马来西亚时间，到访请提前联系。', directions:'前往办公室', emailLabel:'电邮', wechatLabel:'微信',
      wechatQr:'显示微信二维码', qrAlt:'FLASH CAST 官方联系微信二维码', copyWechat:'复制微信号', copiedWechat:'微信号已复制', selectWechat:'请长按或选择微信号复制',
      generalWhatsApp:'你好，我想咨询 ANZHE 电子锁，请帮我选一款适合我家门的型号。', officeMapApple:'Apple 地图', openWhatsapp:'在 WhatsApp 中继续',
      compareWhatsApp:(a,b)=>'你好，我在比较两款 ANZHE 电子锁：'+a+' 和 '+b+'。以上价格均含安装，请帮我确认哪款更适合我家的门。'
    },
    en: {
      contactNav:'Contact', contactTitle:'Talk to a smart lock advisor', contactIntro:'Have a model in mind or want to check your door? Send us a photo of the front of your door and one of the lock on its edge.',
      chatLabel:'Chat on WhatsApp', callLabel:'Call FLASH CAST', callShort:'Call us', officeTitle:'Kuala Lumpur office', officeHours:'Office hours',
      dailyHours:'Daily, 10:00 am–7:00 pm', appointment:'Malaysia time. Please arrange your visit in advance.', directions:'Get directions', emailLabel:'Email', wechatLabel:'WeChat',
      wechatQr:'Show WeChat QR code', qrAlt:'Official FLASH CAST WeChat contact QR code', copyWechat:'Copy WeChat ID', copiedWechat:'WeChat ID copied', selectWechat:'Select the WeChat ID to copy it',
      generalWhatsApp:'Hi, I’m interested in an ANZHE smart lock. Could you help me choose a model that fits my door?', officeMapApple:'Apple Maps', openWhatsapp:'Continue in WhatsApp',
      compareWhatsApp:(a,b)=>'Hi, I’m comparing two ANZHE smart locks, '+a+' and '+b+'. Both prices include installation. Which one would suit my door?'
    },
    ms: {
      contactNav:'Hubungi kami', contactTitle:'Hubungi penasihat kunci pintar', contactIntro:'Sudah pilih model atau mahu semak kesesuaian pintu? Hantarkan gambar bahagian depan pintu dan kunci di tepi pintu kepada kami.',
      chatLabel:'Hubungi melalui WhatsApp', callLabel:'Telefon FLASH CAST', callShort:'Telefon kami', officeTitle:'Pejabat Kuala Lumpur', officeHours:'Waktu operasi',
      dailyHours:'Setiap hari, 10 pagi–7 malam', appointment:'Waktu Malaysia. Sila buat janji temu sebelum datang.', directions:'Panduan arah', emailLabel:'E-mel', wechatLabel:'WeChat',
      wechatQr:'Paparkan kod QR WeChat', qrAlt:'Kod QR WeChat rasmi FLASH CAST', copyWechat:'Salin ID WeChat', copiedWechat:'ID WeChat disalin', selectWechat:'Pilih ID WeChat untuk menyalinnya',
      generalWhatsApp:'Hai, saya berminat dengan kunci pintar ANZHE. Boleh bantu saya pilih model yang sesuai untuk pintu saya?', officeMapApple:'Peta Apple', openWhatsapp:'Teruskan di WhatsApp',
      compareWhatsApp:(a,b)=>'Hai, saya sedang membandingkan dua kunci pintar ANZHE, '+a+' dan '+b+'. Kedua-dua harga termasuk pemasangan. Boleh cadangkan model yang sesuai untuk pintu saya?'
    }
  };
  for (const [lang, values] of Object.entries(copy)) Object.assign(window.showroomWords[lang], values);
  const words = () => copy[window.showroom.lang];
  const tel = 'tel:+' + number;
  const models = new Map(window.lockCatalog.map(p=>[p.id,p]));
  function messageForModels(ids) {
    const picked=[...new Set(ids)].map(id=>models.get(id)).filter(Boolean);
    if(picked.length===2) {
      const labels=picked.map(p=>p.name+' ('+window.formatShowroomPrice(p.price)+')');
      return words().compareWhatsApp(...labels);
    }
    if(picked.length===1) return window.lockPanels.messageFor(picked[0].id);
    return words().generalWhatsApp;
  }
  function currentMessage() {
    const intent=window.showroom.intent;
    if(intent.kind==='model') return messageForModels([intent.id]);
    if(intent.kind==='compare') return messageForModels(window.lockPanels.selectedIds());
    return words().generalWhatsApp;
  }
  const whatsapp = (message = currentMessage()) => 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  const whatsappForPair = ids => whatsapp(messageForModels(ids));
  const maps = {
    google:'https://www.google.com/maps/search/?api=1&query=' + coordinates,
    waze:'https://www.waze.com/ul?ll=' + coordinates + '&navigate=yes',
    apple:'https://maps.apple.com/?daddr=' + coordinates + '&dirflg=d'
  };
  function refresh() {
    const routes = {wa:whatsapp(), tel, email:'mailto:' + email, ...maps};
    document.querySelectorAll('[data-contact-href]').forEach(link => {link.href = routes[link.dataset.contactHref];});
    document.querySelectorAll('[data-contact-number]').forEach(el => {el.textContent = phone;});
    document.querySelector('[data-contact-email]').textContent = email;
    document.querySelectorAll('[data-contact-status]').forEach(status => {status.textContent = '';});
    document.querySelectorAll('.mast-contact a').forEach(link => {link.title = link.getAttribute('aria-label');});
  }
  window.addEventListener('showroom:selection',()=>{
    const url=whatsapp();
    document.querySelectorAll('[data-contact-href="wa"],[data-qc="wa"]').forEach(link=>{
      if(link.href!==url) link.href=url;
    });
  });
  document.addEventListener('click', async event => {
    const section = event.target.closest('[data-copy-wechat]')?.closest('.qc-wechat, .ct-other dd');
    if (!section) return;
    const wechatId = section.querySelector('[data-contact-wechat]');
    const status = section.querySelector('[data-contact-status]');
    try {
      await navigator.clipboard.writeText(wechatId.textContent.trim());
      status.textContent = words().copiedWechat;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(wechatId);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = words().selectWechat;
    }
  });
  window.lockContact = {tel, whatsapp, whatsappForPair, refresh};
})();
