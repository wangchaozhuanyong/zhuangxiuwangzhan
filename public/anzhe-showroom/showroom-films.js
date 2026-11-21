(() => {
  'use strict';
  const labels = {
    zh: {
      filmHeading: '电子锁实拍', filmIntro: '近看门锁内外面板、把手与亮屏效果。', filmBrowse: '看商品实拍',
      filmClose: '关闭视频', filmPrev: '上一条视频', filmNext: '下一条视频', filmContact: 'WhatsApp 咨询这款锁',
      filmError: '视频暂时无法播放。', filmOpen: '打开视频文件',
      message: title => '你好，我看了「' + title + '」的电子锁实拍，想了解价格和安装。'
    },
    en: {
      filmHeading: 'Smart locks on video', filmIntro: 'See the inside and outside panels, handles and screens up close.', filmBrowse: 'Watch the videos',
      filmClose: 'Close video', filmPrev: 'Previous video', filmNext: 'Next video', filmContact: 'Ask about this lock on WhatsApp',
      filmError: 'This video could not be played.', filmOpen: 'Open the video file',
      message: title => 'Hi, I watched the smart lock video “' + title + '”. Could you tell me about the price and installation?'
    },
    ms: {
      filmHeading: 'Video kunci pintar', filmIntro: 'Lihat panel luar dan dalam, pemegang serta paparan skrin dari dekat.', filmBrowse: 'Tonton video',
      filmClose: 'Tutup video', filmPrev: 'Video sebelumnya', filmNext: 'Video seterusnya', filmContact: 'Tanya tentang kunci ini di WhatsApp',
      filmError: 'Video ini tidak dapat dimainkan.', filmOpen: 'Buka fail video',
      message: title => 'Hai, saya telah menonton video kunci pintar “' + title + '”. Boleh saya tahu harga dan butiran pemasangannya?'
    }
  };
  const captions = {
    '0384': {
      zh: ['数字键盘与内屏', '键盘与室内屏幕亮起时的样子。'],
      en: ['Keypad and indoor display', 'See the keypad and indoor screen light up.'],
      ms: ['Pad kekunci dan skrin dalaman', 'Lihat pad kekunci dan skrin dalaman ketika menyala.']
    },
    '0380': {
      zh: ['天眼1号', '从正面和斜侧看圆形镜头与室内面板。'],
      en: ['Tianyan No. 1', 'Front and angled views of the round lens and the indoor panel.'],
      ms: ['Tianyan No. 1', 'Lihat kanta bulat dan panel dalaman dari hadapan dan sisi.']
    },
    '0377': {
      zh: ['黑色横把手', '近看横把手、玻璃面板和内侧旋钮。'],
      en: ['Black lever handle', 'A close look at the lever, glass panel and interior thumbturn.'],
      ms: ['Pemegang tuil hitam', 'Lihat pemegang tuil, panel kaca dan tombol dalaman dari dekat.']
    },
    '0382': {
      zh: ['灰色前面板', '灰色锁身与黑色室内屏并排展示。'],
      en: ['Grey front panel', 'See the grey lock body next to the black indoor screen.'],
      ms: ['Panel hadapan kelabu', 'Lihat badan kunci kelabu di sebelah skrin dalaman hitam.']
    },
    '0378': {
      zh: ['细纹面板与方形把手', '近距离看面板纹理、边线和握持位置。'],
      en: ['Textured panel and square handle', 'See the panel texture, edges and handle grip up close.'],
      ms: ['Panel bertekstur dan pemegang segi empat', 'Lihat tekstur panel, bahagian tepi dan tempat genggaman dari dekat.']
    },
    '0379': {
      zh: ['亮黑正面', '从正面和上方看亮黑面板与把手。'],
      en: ['Glossy black front', 'See the glossy panel and handle from the front and above.'],
      ms: ['Panel hadapan hitam berkilat', 'Lihat panel berkilat dan pemegang dari hadapan dan atas.']
    },
    '0383': {
      zh: ['亮面锁体侧影', '斜侧视角看把手与锁身之间的距离。'],
      en: ['Glossy lock in profile', 'An angled view shows the gap between the handle and the lock body.'],
      ms: ['Badan kunci berkilat dari sisi', 'Lihat jarak antara pemegang dengan badan kunci dari sudut sisi.']
    },
    '0381': {
      zh: ['黑色长面板', '从多个角度看前后面板的完整外观。'],
      en: ['Tall black panel', 'View both panels in full from several angles.'],
      ms: ['Panel hitam panjang', 'Lihat keseluruhan panel hadapan dan belakang dari beberapa sudut.']
    }
  };
  for (const [lang, { message, ...copy }] of Object.entries(labels)) {
    for (const [id, translations] of Object.entries(captions)) {
      copy['filmTitle' + id] = translations[lang][0];
    }
    Object.assign(window.showroomWords[lang], copy);
  }

  const section = document.getElementById('lock-films');
  if (!section) return;
  const cards = Array.from(section.querySelectorAll('[data-film]'));
  const dialog = section.querySelector('dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const player = dialog.querySelector('video');
  const close = dialog.querySelector('.lf-close');
  const previous = dialog.querySelector('[data-film-prev]');
  const next = dialog.querySelector('[data-film-next]');
  const failure = dialog.querySelector('.lf-fail');
  let current = 0;
  let opener;

  function show(index) {
    const card = cards[index];
    const lang = window.showroom?.lang || document.documentElement.lang.split('-')[0];
    const [title, detail] = captions[card.dataset.film][lang];
    const copy = labels[lang];
    player.pause();
    player.poster = card.querySelector('img').src;
    player.src = card.href;
    current = index;
    dialog.querySelector('.lf-counter').textContent = copy.filmHeading + ' · ' + (index + 1) + ' / ' + cards.length;
    dialog.querySelector('h3').textContent = title;
    dialog.querySelector('.lf-detail').textContent = detail;
    failure.hidden = true;
    failure.querySelector('a').href = card.href;
    const contact = dialog.querySelector('.lf-contact');
    contact.hidden = !window.lockContact;
    if (window.lockContact) contact.href = window.lockContact.whatsapp(copy.message(title));
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    if (!dialog.open) {
      opener = card;
      dialog.showModal();
      document.documentElement.classList.add('lf-playing');
      close.focus({ preventScroll: true });
      window.showroom?.layers.enter('lock-film', () => dismiss(true), () => show(current));
    }
    // A browser can require a second tap to start media. Keep its native controls available.
    player.play().catch(() => {});
  }

  function dismiss(fromHistory = false) {
    if (!dialog.open) return;
    dialog.close();
    player.pause();
    player.removeAttribute('src');
    player.load();
    document.documentElement.classList.remove('lf-playing');
    opener?.focus({ preventScroll: true });
    if (!fromHistory) window.showroom?.layers.leave('lock-film');
  }

  cards.forEach((card, index) => {
    card.setAttribute('aria-haspopup', 'dialog');
    card.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      show(index);
    });
  });
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  close.addEventListener('click', () => dismiss());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
  });
  player.addEventListener('error', () => {
    if (dialog.open && player.hasAttribute('src')) failure.hidden = false;
  });
})();
