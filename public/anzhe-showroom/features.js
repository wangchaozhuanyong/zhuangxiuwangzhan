// ANZHE customer-facing feature claims. Installed prices and the full access list live in catalog.js.
(() => {
  'use strict';

  const tr = (zh, en, ms) => ({ zh, en, ms });
  const semiEntry = tr('半自动入户把手锁', 'Semi-automatic entrance lever', 'Kunci tuil separa automatik untuk pintu utama');
  const semiRoom = tr('半自动室内把手锁', 'Semi-automatic interior lever', 'Kunci tuil separa automatik untuk pintu bilik');
  const slim = tr('半自动窄框铝门锁', 'Semi-automatic slim-frame lock', 'Kunci separa automatik untuk bingkai aluminium sempit');
  const automatic = tr('全自动推拉锁', 'Fully automatic push-pull lock', 'Kunci tolak-tarik automatik sepenuhnya');
  const smartVideo = tr('AI 型可视门锁', 'AI model with video doorbell', 'Kunci model AI dengan loceng pintu video');

  const standardAccess = tr('指纹 · 密码 · 门卡', 'Fingerprint · PIN · card', 'Cap jari · PIN · kad');
  const fobAccess = tr('指纹 · 密码 · 感应钥匙扣', 'Fingerprint · PIN · key fob', 'Cap jari · PIN · tag kunci');
  const faceAccess = tr('人脸识别 · 指纹 · 密码', 'Face recognition · fingerprint · PIN', 'Pengecaman wajah · cap jari · PIN');
  const palmAccess = tr('掌静脉 · 人脸识别 · 指纹', 'Palm vein · face recognition · fingerprint', 'Vena tapak tangan · pengecaman wajah · cap jari');
  const palm3dAccess = tr('掌静脉 · 3D 人脸识别 · 指纹', 'Palm vein · 3D face recognition · fingerprint', 'Vena tapak tangan · pengecaman wajah 3D · cap jari');
  const concealedAccess = tr('掌静脉 · 人脸识别 · 隐藏式指纹', 'Palm vein · face recognition · concealed fingerprint reader', 'Vena tapak tangan · pengecaman wajah · pengimbas cap jari tersembunyi');

  const lowPower = port => tr(
    '低电量提醒 · ' + port + ' 应急供电 · 机械钥匙',
    'Low-battery alert · ' + port + ' emergency power · mechanical key',
    'Peringatan bateri lemah · kuasa kecemasan ' + port + ' · kunci mekanikal'
  );
  const usbBackup = lowPower('USB');
  const usbCBackup = lowPower('USB-C');

  const screen = size => tr(size + ' 英寸 IPS 室内屏', size + '-inch indoor IPS display', 'Skrin IPS dalaman ' + size + ' inci');
  const intercom = size => tr(
    size + ' 英寸 IPS 室内屏 · 远程视频对讲',
    size + '-inch indoor IPS display · remote video intercom',
    'Skrin IPS dalaman ' + size + ' inci · interkom video jarak jauh'
  );
  const alarmCapture = tr('防撬报警 · 门前逗留抓拍', 'Tamper alarm · snapshots when someone lingers', 'Penggera gangguan · rakaman gambar jika seseorang berada lama di pintu');
  const privacy = tr('室内按键反锁', 'Inside privacy button', 'Butang kunci privasi di bahagian dalam');
  const peephole = tr('防猫眼开启', 'Protection against unlocking through the peephole', 'Perlindungan daripada pembukaan melalui lubang intai');

  const alu = tr('航空铝', 'Aluminium body', 'Badan aluminium');
  const glass = tr('钢化玻璃面板', 'Tempered-glass panel', 'Panel kaca terbaja');
  const aluGlass = tr('航空铝 · 钢化玻璃面板', 'Aluminium body · tempered-glass panel', 'Badan aluminium · panel kaca terbaja');
  const dynamicPin = tr('动态密码', 'Dynamic code', 'Kod dinamik');
  const glassFace = tr('钢化玻璃', 'Tempered glass', 'Kaca terbaja');
  const slimWidth = tr('38.6 mm 窄面板', '38.6 mm slim panel', 'Panel sempit 38.6 mm');
  const scan3d = tr('3D 人脸识别', '3D face recognition', 'Pengecaman wajah 3D');
  const palm = tr('掌静脉识别', 'Palm-vein recognition', 'Pengecaman vena tapak tangan');
  const talk = tr('远程视频对讲', 'Remote video intercom', 'Interkom video jarak jauh');
  const hiddenPrint = tr('隐藏式指纹', 'Concealed fingerprint reader', 'Pengimbas cap jari tersembunyi');
  const cnc = tr('CNC 精雕锁身', 'CNC-machined body', 'Badan dimesin CNC');
  const wideCamera = tr('广角可视门铃', 'Wide-angle video doorbell', 'Loceng pintu video sudut lebar');
  const temporaryPhone = tr('可用兼容手机应急供电', 'Emergency power from a compatible phone', 'Kuasa kecemasan daripada telefon yang serasi');
  const recording = tr('100 万像素摄像头 · 24 小时抓拍 · 可通过门铃远程开锁', '1 MP camera · round-the-clock snapshots · remote unlocking via the doorbell', 'Kamera 1 MP · tangkapan gambar sepanjang hari · buka kunci dari jauh melalui loceng pintu');

  const tuyaWifi = tr('Wi-Fi · 涂鸦 App', 'Wi-Fi · Tuya app', 'Wi-Fi · aplikasi Tuya');
  const bluetooth = tr('蓝牙 · 手机应用版本需确认', 'Bluetooth · confirm the app version', 'Bluetooth · semak versi aplikasi');
  const optionalTuya = tr('Wi-Fi · 涂鸦 App 或遥控器选配', 'Wi-Fi · optional Tuya app or remote control', 'Wi-Fi · aplikasi Tuya atau alat kawalan jauh sebagai pilihan');
  const optionalApp = tr('Wi-Fi · 手机应用或遥控器选配，应用版本需确认', 'Wi-Fi · optional app or remote control, confirm the app version', 'Wi-Fi · aplikasi atau alat kawalan jauh sebagai pilihan, semak versi aplikasi');

  const dimensions = measurement => tr('尺寸 ' + measurement + ' mm', 'Dimensions ' + measurement + ' mm', 'Dimensi ' + measurement + ' mm');
  const matte = tr('哑光黑', 'Matte black', 'Hitam kusam');
  const join = (...parts) => tr(...['zh','en','ms'].map(lang => parts.map(part => part[lang]).join(' · ')));

  // Null means that the quotation does not establish that capability.
  function entry(type, highlights, unlock, emergency, details = {}) {
    return { type, highlights, unlock, visitor: null, security: null, emergency, material: null, extra: null, connection: null, ...details };
  }

  window.lockFeatures = {
    'f8': entry(semiEntry, [dynamicPin, tr('Wi-Fi 联网', 'Wi-Fi connection', 'Sambungan Wi-Fi')], standardAccess, usbBackup, {
      material: alu, connection: optionalApp, extra: dimensions('258 × 65.2 × 26')
    }),
    'g5': entry(semiRoom, [privacy, glassFace], standardAccess, usbCBackup, {
      security: privacy, material: aluGlass, connection: bluetooth, extra: join(matte, dimensions('258 × 65.2 × 26.3'))
    }),
    'g13': entry(semiRoom, [dynamicPin, privacy], standardAccess, usbCBackup, {
      security: privacy, connection: bluetooth, extra: join(matte, dimensions('275.6 × 65 × 22'))
    }),
    'g86f-pro': entry(semiEntry, [glassFace, temporaryPhone], standardAccess, usbCBackup, {
      material: glass, connection: bluetooth, extra: join(temporaryPhone, dimensions('383 × 76 × 25'))
    }),
    'gp08': entry(semiEntry, [peephole, glassFace], standardAccess, usbCBackup, {
      security: peephole, material: aluGlass, connection: optionalApp, extra: dimensions('352 × 70 × 26.9')
    }),
    'g53-pro': entry(semiEntry, [tr('感应钥匙扣', 'Key fob entry', 'Akses tag kunci'), temporaryPhone], fobAccess, usbCBackup, {
      material: aluGlass, connection: bluetooth, extra: join(temporaryPhone, dimensions('360 × 76 × 24.6'))
    }),
    'd10b': entry(slim, [slimWidth, tr('窄框铝门适用', 'For slim aluminium frames', 'Untuk bingkai aluminium sempit')], standardAccess, usbCBackup, {
      material: aluGlass, connection: bluetooth, extra: join(matte, dimensions('322.6 × 38.6 × 25.6'))
    }),
    'r10j-22': entry(semiEntry, [scan3d, screen('4.0')], palm3dAccess, usbCBackup, {
      visitor: tr('4.0 英寸 IPS 室内屏 · 可视门铃', '4.0-inch indoor IPS display · video doorbell', 'Skrin IPS dalaman 4.0 inci · loceng pintu video'),
      security: alarmCapture, material: alu, connection: tuyaWifi,
      extra: join(tr('100 万像素广角摄像头 · 可通过门铃远程开锁', '1 MP wide-angle camera · remote unlocking via the doorbell', 'Kamera sudut lebar 1 MP · buka kunci dari jauh melalui loceng pintu'), dimensions('414 × 80 × 28'))
    }),
    'a88-face-id': entry(semiEntry, [tr('人脸识别', 'Face recognition', 'Pengecaman wajah'), tr('3.5 英寸高清屏', '3.5-inch HD display', 'Skrin HD 3.5 inci')], faceAccess, usbCBackup, {
      connection: tuyaWifi, extra: dimensions('383 × 76 × 25')
    }),
    'q8j': entry(automatic, [scan3d, screen('4.0')], palm3dAccess, usbBackup, {
      visitor: intercom('4.0'), security: alarmCapture, material: alu, connection: tuyaWifi, extra: join(recording, dimensions('419 × 77.5 × 23'))
    }),
    't06j': entry(automatic, [palm, screen('3.5')], palmAccess, usbBackup, {
      visitor: intercom('3.5'), security: alarmCapture, connection: tuyaWifi, extra: join(matte, recording, dimensions('405 × 70 × 29'))
    }),
    'k19j': entry(automatic, [screen('4.5'), talk], palmAccess, usbBackup, {
      visitor: intercom('4.5'), security: alarmCapture, connection: tuyaWifi, extra: join(matte, recording, dimensions('426 × 67 × 52'))
    }),
    'k26j-pro': entry(automatic, [palm, screen('4.5')], palmAccess, usbBackup, {
      visitor: intercom('4.5'), security: alarmCapture, connection: tuyaWifi, extra: join(matte, recording, dimensions('426 × 67 × 52'))
    }),
    'k16j-k19': entry(automatic, [scan3d, screen('4.5')], palm3dAccess, usbBackup, {
      visitor: intercom('4.5'), security: alarmCapture, material: alu, connection: optionalTuya, extra: join(recording, dimensions('405 × 68 × 62.5'))
    }),
    'q58j-k19': entry(automatic, [screen('4.0'), talk], palmAccess, usbBackup, {
      visitor: intercom('4.0'), security: alarmCapture, material: alu, connection: tuyaWifi, extra: join(recording, dimensions('405 × 68 × 62.5'))
    }),
    'v37j-p16': entry(tr('全自动推拉入户锁', 'Fully automatic push-pull entrance lock', 'Kunci pintu utama tolak-tarik automatik sepenuhnya'), [cnc, hiddenPrint], concealedAccess, usbBackup, {
      visitor: intercom('4.5'), security: alarmCapture,
      material: tr('CNC 精雕航空铝 · 钢化玻璃面板', 'CNC-machined aluminium body · tempered-glass panel', 'Badan aluminium dimesin CNC · panel kaca terbaja'),
      connection: tuyaWifi, extra: join(tr('C 级锁芯', 'Grade C lock cylinder', 'Silinder kunci gred C'), recording)
    }),
    'p59j-pro': entry(smartVideo, [wideCamera, screen('4.5')], palmAccess, usbBackup, {
      visitor: intercom('4.5'), security: alarmCapture, material: aluGlass, connection: tuyaWifi, extra: recording
    })
  };

  // One key per attribute for both the detail sheet and like-for-like comparison.
  // An omitted key means the quotation is silent. Optional configurations have text of their own.
  window.lockSpecLabels = {
    type:tr('门锁类型','Lock type','Jenis kunci'), access:tr('开锁方式','Access methods','Kaedah buka kunci'),
    cardType:tr('门卡制式','Card format','Jenis kad'), app:tr('手机 App 开锁','App unlocking','Buka kunci melalui aplikasi'),
    remote:tr('遥控器','Remote control','Alat kawalan jauh'), appPlatform:tr('适用 App','Compatible app','Aplikasi yang serasi'),
    face3d:tr('3D 人脸识别','3D face recognition','Pengecaman wajah 3D'), hiddenPrint:tr('隐藏式指纹头','Concealed fingerprint reader','Pengimbas cap jari tersembunyi'),
    connection:tr('连接方式','Connectivity','Sambungan'), screen:tr('显示屏','Display','Skrin'),
    camera:tr('摄像头','Camera','Kamera'), lens:tr('镜头视角','Lens angle of view','Sudut pandangan lensa'), video:tr('远程对讲','Remote intercom','Interkom jarak jauh'),
    bellUnlock:tr('门铃开锁','Doorbell access','Akses melalui loceng'), oneTouch:tr('远程一键开锁','Remote one-touch access','Buka dari jauh dengan satu sentuhan'),
    lingering:tr('逗留抓拍','Lingering detection','Pengesanan pelawat yang berlama-lama'), monitoring:tr('24 小时抓拍','Round-the-clock snapshots','Tangkapan gambar sepanjang hari'),
    alarm:tr('防撬报警','Tamper alert','Penggera gangguan'), privacy:tr('室内反锁','Inside privacy lock','Kunci privasi dari dalam'),
    peephole:tr('防猫眼开启','Peephole protection','Perlindungan lubang intai'), voice:tr('语音提示','Voice guidance','Panduan suara'),
    lowBattery:tr('电量提醒','Battery warning','Amaran bateri'), power:tr('日常供电','Power supply','Bekalan kuasa'),
    capacity:tr('锂电池容量','Lithium battery capacity','Kapasiti bateri litium'),
    emergency:tr('应急供电','Emergency power','Kuasa kecemasan'), phoneBackup:tr('手机应急供电','Backup power from a phone','Kuasa sandaran daripada telefon'),
    material:tr('锁身材质','Body material','Bahan badan'), finish:tr('面板材质','Panel material','Bahan panel'), machining:tr('锁体工艺','Body finish','Kemasan badan kunci'),
    color:tr('颜色','Colour','Warna'), cylinder:tr('锁芯','Lock cylinder','Silinder kunci'),
    dimensions:tr('尺寸','Dimensions','Dimensi'), weight:tr('单把重量','Unit weight','Berat seunit'),
    temperature:tr('工作温度','Operating temperature','Suhu operasi'), humidity:tr('工作湿度','Operating humidity','Kelembapan operasi'),
    application:tr('适用场景','Suggested use','Kegunaan'),
  };
  const source = {
    'f8':       {size:'258 × 65.2 × 26',weight:2,aa:'AA',port:'USB',material:alu,limit:60,optional:true,checkPlatform:true},
    'g5':       {size:'258 × 65.2 × 26.3',weight:2.1,aa:'AAA',material:alu,glass:true,black:true,bt:true,checkPlatform:true,rfid:true,privacy:true},
    'g13':      {size:'275.6 × 65 × 22',aa:'AAA',black:true,bt:true,checkPlatform:true,rfid:true,privacy:true},
    'g86f-pro': {size:'383 × 76 × 25',aa:'AA',glass:true,limit:60,phone:true,bt:true,checkPlatform:true},
    'gp08':     {size:'352 × 70 × 26.9',aa:'AA',material:alu,glass:true,optional:true,checkPlatform:true,peephole:true},
    'g53-pro':  {size:'360 × 76 × 24.6',weight:3,aa:'AA',material:alu,glass:true,bt:true,checkPlatform:true,fob:true,phone:true},
    'd10b':     {size:'322.6 × 38.6 × 25.6',weight:1.5,aa:'AAA',material:alu,glass:true,black:true,bt:true,checkPlatform:true},
    'r10j-22':  {size:'414 × 80 × 28',weight:3.4,material:alu,face:'3d',palm:true,rfid:true,camera:'wide',bell:true,oneTouch:true},
    'a88-face-id': {size:'383 × 76 × 25',face:'face',limit:60,batteryNote:true},
    'q8j':      {size:'419 × 77.5 × 23',weight:3.5,material:alu,face:'3d',palm:true,rfid:true,camera:'wide',video:true,oneTouch:true},
    't06j':     {size:'405 × 70 × 29',weight:2,black:true,face:'face',palm:true,rfid:true,camera:'wide',video:true,oneTouch:true},
    'k19j':     {size:'426 × 67 × 52',weight:3,black:true,face:'face',palm:true,rfid:true,camera:'wide',video:true,oneTouch:true},
    'k26j-pro': {size:'426 × 67 × 52',weight:3,black:true,face:'face',palm:true,rfid:true,camera:'wide',video:true,oneTouch:true},
    'k16j-k19': {size:'405 × 68 × 62.5',weight:3.5,material:alu,face:'3d',palm:true,rfid:true,camera:'wide',video:true,oneTouch:true,optional:true},
    'q58j-k19': {size:'405 × 68 × 62.5',weight:3.5,material:alu,face:'face',palm:true,rfid:true,camera:'wide',video:true,noClimate:true},
    'v37j-p16': {weight:4,material:alu,glass:true,cnc:true,face:'face',palm:true,rfid:true,camera:'1mp',video:true},
    'p59j-pro': {material:alu,glass:true,face:'face',palm:true,rfid:true,camera:'wide',video:true,oneTouch:true},
  };
  const physical = {
    fingerprint:tr('指纹','fingerprint','cap jari'), pin:tr('密码','PIN','PIN'), card:tr('门卡','access card','kad akses'),
    key:tr('机械钥匙','mechanical key','kunci mekanikal'), dynamic:dynamicPin, fob:tr('感应钥匙扣','key fob','tag kunci'),
    palm, face:tr('人脸识别','face recognition','pengecaman wajah'), app:tr('手机 App','mobile app','aplikasi mudah alih'),
  };
  window.lockAccessLabels = physical;
  const supported = tr('支持','Supported','Disokong');
  const optional = tr('选配','Optional','Pilihan');
  const remoteOption = tr('选配，App 或遥控器二选一','Optional, choose the app or remote control','Pilihan, pilih aplikasi atau alat kawalan jauh');
  const platformToCheck = tr('待确认（Tuya 或 TT）','To confirm (Tuya or TT)','Perlu disahkan (Tuya atau TT)');
  const cardFormatToCheck = tr('制式待确认','Format to confirm','Format perlu disahkan');
  const unspecifiedMechanism = tr('AI 型可视门锁，锁体结构未列明','AI video lock, mechanism not specified','Kunci video AI, mekanisme tidak dinyatakan');
  const fixed = value => tr(value,value,value);
  const listOf = fields => tr(...['zh','en','ms'].map(l=>fields.map(f=>f[l]).join(l==='zh'?'、':', ')));
  const lithiumPower = tr('可充电锂电池','Rechargeable lithium battery','Bateri litium boleh dicas semula');
  for(const p of window.lockCatalog) {
    const s=source[p.id], f=window.lockFeatures[p.id];
    const methods=[...(s.palm?['palm']:[]),...(s.face?['face']:[]),'fingerprint','pin',s.fob?'fob':'card','key','dynamic','app'];
    f.accessMethods=methods;
    const accessName=key=>{
      if(key==='fingerprint' && s.cnc) return hiddenPrint;
      if(key==='face' && s.face==='3d') return scan3d;
      if(key==='card' && s.rfid) return tr('RFID 门卡','RFID card','kad RFID');
      if(key==='app' && s.optional)return tr('手机 App（选配）','optional mobile app','aplikasi mudah alih pilihan');
      return physical[key];
    };
    const access=listOf(methods.map(accessName));
    const port=s.port || (s.video?'USB':'USB-C');
    const facts={
      type:f.type===smartVideo?unspecifiedMechanism:s.cnc?automatic:f.type,
      access, app:s.optional?optional:supported, appPlatform:s.checkPlatform?platformToCheck:fixed('Tuya'),
      connection:s.bt?tr('蓝牙','Bluetooth','Bluetooth'):fixed('Wi-Fi'),
      voice:tr('操作语音提示','Spoken operating prompts','Panduan suara semasa penggunaan'),
      lowBattery:tr('低电量提醒','Low-battery alert','Peringatan bateri lemah'),
      power:s.aa?tr('4 节 '+s.aa+' 碱性电池，需另备','4 '+s.aa+' alkaline batteries (not included)','4 bateri alkali '+s.aa+' (tidak disertakan)'):
        lithiumPower,
      emergency:tr(port+' 应急供电',port+' emergency power','Bekalan kuasa kecemasan '+port),
    };
    if(s.optional) facts.remote=remoteOption;
    if(s.face==='3d') facts.face3d=supported;
    if(s.cnc) facts.hiddenPrint=supported;
    if(!s.noClimate) {
      facts.temperature=fixed('−20 – '+(s.limit||70)+' °C');
      facts.humidity=fixed(s.limit===60?'10–90% RH':'20–93% RH');
    }
    if(!s.fob) facts.cardType=s.rfid?fixed('RFID'):cardFormatToCheck;
    if(s.batteryNote) facts.capacity=tr('4200（单位待确认）','4200 (unit to confirm)','4200 (unit perlu disahkan)');
    const ipsPanel = Boolean(p.screen && p.id!=='a88-face-id');
    if(p.screen) facts.screen=!ipsPanel?tr('3.5 英寸高清显示屏','3.5-inch HD display','Skrin HD 3.5 inci'):screen(p.screen.toFixed(1));
    if(s.camera) facts.camera=tr('100 万像素','1 MP','1 MP');
    if(s.camera==='wide') facts.lens=tr('广角','Wide-angle','Sudut lebar');
    if(s.video) {
      facts.video=talk;
      facts.monitoring=tr('24 小时监控抓拍','Round-the-clock snapshots','Tangkapan gambar sepanjang hari');
    }
    if(s.camera) {
      facts.bellUnlock=tr('通过门铃远程开锁','Remote unlocking via the doorbell','Buka dari jauh melalui loceng pintu');
      facts.lingering=tr('门前逗留抓拍','Snapshots when someone lingers','Tangkapan gambar apabila seseorang berada lama di hadapan pintu');
      facts.alarm=tr('防撬报警','Tamper alarm','Penggera gangguan');
    }
    if(s.oneTouch) facts.oneTouch=tr('远程一键开锁','One-touch remote unlocking','Buka dari jauh dengan satu sentuhan');
    if(s.privacy) {
      facts.privacy=privacy;
      facts.application=tr('出租房、民宿、酒店','Rental rooms, homestays and hotels','Bilik sewa, inap desa dan hotel');
    }
    if(s.peephole) facts.peephole=peephole;
    if(s.phone) facts.phoneBackup=temporaryPhone;
    if(s.material) facts.material=s.material;
    if(s.glass) facts.finish=glass;
    if(s.cnc) facts.machining=cnc;
    if(s.cnc) facts.cylinder=tr('C 级锁芯','Grade C lock cylinder','Silinder kunci gred C');
    if(s.black) facts.color=matte;
    if(s.size) facts.dimensions=fixed(s.size+' mm');
    if(s.weight) facts.weight=fixed(s.weight+' kg');
    // Interior privacy and peephole protection have their own rows. They are not alarms.
    if(s.privacy || s.peephole) f.security=null;
    // These are ambiguities in the supplier sheets, independent of feature availability.
    const needsConfirmation = new Set();
    if(!s.fob && !s.rfid) needsConfirmation.add('cardType');
    if(s.checkPlatform) needsConfirmation.add('appPlatform');
    if(s.batteryNote) needsConfirmation.add('capacity');
    f.comparison = {
      needsConfirmation,
      cardAccess: !s.fob,
      lithiumBattery: !s.aa,
      unspecifiedMechanism: f.type===smartVideo,
      displayTechnology: ipsPanel ? 'IPS' : null
    };
    f.specs=facts;
  }
})();
