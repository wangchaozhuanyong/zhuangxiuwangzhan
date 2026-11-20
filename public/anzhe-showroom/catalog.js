// Installed prices in MYR include RM100 for installation per lock.
(() => {
  const tr = (zh, en, ms) => ({ zh, en, ms });

  const standard = tr(
    '指纹、密码、动态密码、门卡、机械钥匙、手机应用',
    'Fingerprint, PIN, dynamic code, card, mechanical key and app',
    'Cap jari, PIN, kod dinamik, kad, kunci mekanikal dan aplikasi'
  );
  const optionalApp = tr(
    '指纹、密码、动态密码、门卡、机械钥匙。手机应用或遥控器依配置选配。',
    'Fingerprint, PIN, dynamic code, card and mechanical key. App or remote control depends on the configuration.',
    'Cap jari, PIN, kod dinamik, kad dan kunci mekanikal. Aplikasi atau alat kawalan jauh bergantung pada konfigurasi.'
  );
  const face = tr(
    '人脸、指纹、密码、动态密码、门卡、机械钥匙、手机应用',
    'Face recognition, fingerprint, PIN, dynamic code, card, mechanical key and app',
    'Pengecaman wajah, cap jari, PIN, kod dinamik, kad, kunci mekanikal dan aplikasi'
  );
  const palmFace = tr(
    '掌静脉、人脸、指纹、密码、动态密码、门卡、机械钥匙、手机应用',
    'Palm vein, face recognition, fingerprint, PIN, dynamic code, card, mechanical key and app',
    'Vena tapak tangan, pengecaman wajah, cap jari, PIN, kod dinamik, kad, kunci mekanikal dan aplikasi'
  );
  const biometricsOptionalApp = tr(
    '掌静脉、3D 人脸、指纹、密码、动态密码、门卡、机械钥匙。手机应用或遥控器依配置选配。',
    'Palm vein, 3D face recognition, fingerprint, PIN, dynamic code, card and mechanical key. App or remote control depends on the configuration.',
    'Vena tapak tangan, pengecaman wajah 3D, cap jari, PIN, kod dinamik, kad dan kunci mekanikal. Aplikasi atau alat kawalan jauh bergantung pada konfigurasi.'
  );
  const fob = tr(
    '指纹、密码、动态密码、感应钥匙扣、机械钥匙、手机应用',
    'Fingerprint, PIN, dynamic code, key fob, mechanical key and app',
    'Cap jari, PIN, kod dinamik, tag kunci, kunci mekanikal dan aplikasi'
  );

  const battery = (size, port) => tr(
    '4 节 ' + size + ' 碱性电池（另备），' + port + ' 应急供电',
    '4 ' + size + ' alkaline batteries (sold separately), with ' + port + ' emergency power',
    '4 bateri alkali ' + size + ' (dijual berasingan), dengan bekalan kuasa kecemasan ' + port
  );
  const rechargeable = port => tr(
    '可充电锂电池，' + port + ' 应急供电',
    'Rechargeable lithium battery with ' + port + ' emergency power',
    'Bateri litium boleh dicas semula dengan bekalan kuasa kecemasan ' + port
  );

  const catalogCutouts = new Set(['a88-face-id', 'd10b', 'f8', 'g86f-pro']);

  function model(id, name, group, price, copy, access, power, screen = null) {
    const prefix = catalogCutouts.has(id) ? 'assets/catalog-' : 'assets/p-';
    return {
      id, name, group, price, image: prefix + id + '.webp',
      thumbnail: 'assets/thumb-' + id + '.webp', cardImage: 'assets/card-' + id + '.webp',
      copy, access, power, screen
    };
  }

  globalThis.lockCatalog = [
    model('f8', 'F8', 'entrance', 610, tr(
      '铝合金入户把手锁。指纹开锁后下压把手，也可给访客使用动态密码。',
      'An aluminium lever lock for the front door. Unlock with a fingerprint and press the handle, or give a visitor a dynamic code.',
      'Kunci berpemegang aluminium untuk pintu utama. Imbas cap jari dan tekan pemegang, atau berikan kod dinamik kepada tetamu.'
    ), optionalApp, battery('AA', 'USB')),
    model('g5', 'G5', 'room', 535, tr(
      '哑光黑室内把手配钢化玻璃面板。关门后可按内侧的电子反锁键，适合客房和出租房间。',
      'A matte-black lever and tempered-glass panel for guest rooms and rentals. Press the inside privacy button once the door is closed.',
      'Pemegang hitam kusam dengan panel kaca terbaja untuk bilik tetamu atau sewa. Tekan butang privasi di bahagian dalam selepas menutup pintu.'
    ), standard, battery('AAA', 'USB-C')),
    model('g13', 'G13', 'room', 397, tr(
      '哑光黑室内锁，面板厚 22 毫米。房客可用密码进门，入住后可从房内按键反锁。',
      'A matte-black room lock with a 22 mm panel depth. Guests can enter by PIN and use the privacy button from inside.',
      'Kunci bilik hitam kusam dengan panel setebal 22 mm. Tetamu boleh masuk menggunakan PIN dan menekan butang privasi dari dalam.'
    ), standard, battery('AAA', 'USB-C')),
    model('g86f-pro', 'G86F-Pro', 'entrance', 445, tr(
      '带钢化玻璃面板的半自动入户锁。电池耗尽时，可通过 USB-C 接口临时供电开门。',
      'A semi-automatic front-door lock with a tempered-glass panel. If the batteries run flat, use the USB-C port for temporary power.',
      'Kunci pintu utama separa automatik dengan panel kaca terbaja. Jika bateri habis, gunakan port USB-C untuk bekalan kuasa sementara.'
    ), standard, battery('AA', 'USB-C')),
    model('gp08', 'GP08', 'entrance', 625, tr(
      '铝合金与钢化玻璃把手锁，带防猫眼开启设计。键盘、指纹与备用钥匙均可用于入户。',
      'An aluminium and tempered-glass lever lock with a safeguard against unlocking through the peephole. Use the keypad, fingerprint reader or backup key to enter.',
      'Kunci berpemegang aluminium dan kaca terbaja dengan perlindungan daripada pembukaan melalui lubang intai. Masuk menggunakan pad kekunci, cap jari atau kunci sandaran.'
    ), optionalApp, battery('AA', 'USB-C')),
    model('g53-pro', 'G53 PRO', 'entrance', 520, tr(
      '钢化玻璃面板搭配感应钥匙扣。除指纹与密码外，也可用随身钥匙扣感应开门。',
      'A tempered-glass lever lock that also takes a key fob. Tap your fob when you prefer it to a fingerprint or PIN.',
      'Kunci berpemegang dengan panel kaca terbaja yang turut menerima tag kunci. Sentuhkan tag sebagai pilihan selain cap jari atau PIN.'
    ), fob, battery('AA', 'USB-C')),
    model('d10b', 'D10B', 'slim', 610, tr(
      '宽 38.6 毫米的窄面板为铝门留出把手位置。选购前请量门框可用宽度，并核对现有锁孔。',
      'A slim 38.6 mm panel for aluminium doors. Measure the available frame width and check the existing lock cut-out before choosing it.',
      'Panel langsing selebar 38.6 mm untuk pintu aluminium. Ukur lebar bingkai yang tersedia dan semak bukaan kunci sedia ada sebelum memilihnya.'
    ), standard, battery('AAA', 'USB-C')),
    model('r10j-22', 'R10J-22', 'entrance', 985, tr(
      '保留下压把手的开门习惯，同时支持掌静脉和 3D 人脸识别。门内有 4 英寸屏幕可查看来访者。',
      'Keep the familiar lever handle and add palm-vein or 3D face recognition. A 4-inch indoor display shows who is at the door.',
      'Kekalkan pemegang jenis tuil dengan pilihan imbasan vena tapak tangan atau wajah 3D. Skrin dalaman 4 inci memaparkan pelawat di pintu.'
    ), palmFace, rechargeable('USB-C'), 4),
    model('a88-face-id', 'A88-Face ID', 'entrance', 805, tr(
      '带 3.5 英寸屏幕和人脸识别的半自动入户锁。识别后下压把手开门，电量低时会有提醒。',
      'A semi-automatic face-recognition lock with a 3.5-inch display. Press the lever after recognition. A low-battery alert reminds you to recharge.',
      'Kunci separa automatik dengan pengecaman wajah dan skrin 3.5 inci. Tekan pemegang selepas wajah dikenal pasti. Peringatan bateri lemah memberitahu bila perlu mengecas.'
    ), face, rechargeable('USB-C'), 3.5),
    model('q8j', 'Q8J', 'entrance', 1030, tr(
      '全自动推拉锁支持 3D 人脸与掌静脉识别。门铃响起时，可通过 4 英寸室内屏查看访客，也可远程对讲。',
      'A fully automatic push-pull lock with 3D face and palm-vein recognition. See visitors on the 4-inch indoor display or talk to them remotely.',
      'Kunci tolak-tarik automatik dengan pengecaman wajah 3D dan vena tapak tangan. Lihat pelawat pada skrin dalaman 4 inci atau bercakap melalui interkom dari jauh.'
    ), palmFace, rechargeable('USB'), 4),
    model('t06j', 'T06J', 'entrance', 865, tr(
      '哑光黑全自动推拉锁，配 3.5 英寸室内屏。出门在外，也可通过可视门铃与来访者对讲。',
      'A matte-black automatic push-pull lock with a 3.5-inch indoor display. The video doorbell lets you speak to visitors while you are away.',
      'Kunci tolak-tarik automatik hitam kusam dengan skrin dalaman 3.5 inci. Bercakap dengan pelawat melalui loceng pintu video ketika anda di luar.'
    ), palmFace, rechargeable('USB'), 3.5),
    model('k19j', 'K19J', 'entrance', 1060, tr(
      '带 4.5 英寸室内屏的哑光黑推拉锁。访客按门铃时可查看画面，广角摄像头也支持门前逗留抓拍。',
      'A matte-black push-pull lock with a 4.5-inch indoor screen. See visitors when they ring, or check images captured when someone lingers by the door.',
      'Kunci tolak-tarik hitam kusam dengan skrin dalaman 4.5 inci. Lihat pelawat ketika loceng berbunyi atau semak gambar yang dirakam apabila seseorang berada lama di depan pintu.'
    ), palmFace, rechargeable('USB'), 4.5),
    model('k26j-pro', 'K26J Pro', 'entrance', 895, tr(
      '门外可用掌静脉或人脸开锁，门内用 4.5 英寸屏幕看访客。全自动推拉设计省去下压把手的动作。',
      'Unlock from outside with your palm or face and see visitors on the 4.5-inch indoor display. The automatic push-pull action means there is no lever to turn.',
      'Buka dari luar dengan imbasan tapak tangan atau wajah dan lihat pelawat pada skrin dalaman 4.5 inci. Reka bentuk tolak-tarik automatik memudahkan anda membuka pintu tanpa menekan pemegang.'
    ), palmFace, rechargeable('USB'), 4.5),
    model('k16j-k19', 'K16J-K19', 'entrance', 1135, tr(
      '铝合金全自动推拉锁配 3D 人脸识别、掌静脉识别和 4.5 英寸室内屏。门内可看访客，外出也能远程对讲。',
      'An aluminium automatic push-pull lock with 3D face recognition, palm-vein access and a 4.5-inch display. See guests indoors or speak to them remotely.',
      'Kunci tolak-tarik automatik aluminium dengan pengecaman wajah 3D, imbasan vena tapak tangan dan skrin 4.5 inci. Lihat tetamu dari dalam atau bercakap dengan mereka dari jauh.'
    ), biometricsOptionalApp, rechargeable('USB'), 4.5),
    model('q58j-k19', 'Q58J-K19', 'entrance', 1135, tr(
      '铝合金推拉锁配 4 英寸室内屏和广角摄像头。门铃、视频对讲和门前逗留抓拍集中在同一把锁上。',
      'An aluminium push-pull lock with a 4-inch indoor screen and wide-angle camera. Its doorbell, video intercom and snapshots of people lingering are built into the lock.',
      'Kunci tolak-tarik aluminium dengan skrin dalaman 4 inci dan kamera sudut lebar. Loceng pintu, interkom video dan rakaman gambar apabila seseorang berada lama di pintu terbina dalam kunci ini.'
    ), palmFace, rechargeable('USB'), 4),
    model('v37j-p16', 'V37J-P16', 'entrance', 1180, tr(
      '精雕铝合金锁身配钢化玻璃和隐藏式指纹头。带 C 级锁芯、4.5 英寸屏幕，亦可用掌静脉开锁。',
      'A CNC-machined aluminium body with tempered glass and a concealed fingerprint reader. Includes a Grade C lock cylinder, a 4.5-inch screen and palm-vein access.',
      'Badan aluminium dimesin CNC dengan kaca terbaja dan pengimbas cap jari tersembunyi. Dilengkapi silinder kunci gred C, skrin 4.5 inci serta imbasan vena tapak tangan.'
    ), palmFace, rechargeable('USB'), 4.5),
    model('p59j-pro', 'P59J PRO', 'entrance', 1480, tr(
      '铝合金与钢化玻璃面板配广角可视门铃。可从 4.5 英寸屏幕看访客，在外也能视频对讲并远程开锁。',
      'Aluminium and tempered glass frame a wide-angle video doorbell. See guests on the 4.5-inch screen, or talk to them and unlock the door remotely.',
      'Panel aluminium dan kaca terbaja dilengkapi loceng pintu video sudut lebar. Lihat tetamu pada skrin 4.5 inci atau bercakap dengan mereka dan buka kunci dari jauh.'
    ), palmFace, rechargeable('USB'), 4.5)
  ];
})();
