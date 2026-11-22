# 交叉页扩展：7 个新组合（中英定稿）

> 追加到 `src/components/services/serviceAreaPageText.json`，与现有 5 个组合并列。
> 结构对齐现有 5 页：10 个字段 + 4 段正文。
> 中文已扩写至与现有 5 页同等篇幅（900–1050 汉字）。
> 马来语暂缺，等翻译方按术语表补；ms 不完整时该页不进 sitemap，不影响 en/zh。

## 新增组合清单

| 组合 | 服务 | 区域 |
|---|---|---|
| `/locations/kuala-lumpur/condo-renovation` | Condo Renovation | Kuala Lumpur |
| `/locations/petaling-jaya/kitchen-renovation` | Kitchen Renovation | Petaling Jaya |
| `/locations/cheras/condo-renovation` | Condo Renovation | Cheras |
| `/locations/subang-jaya/landed-house-renovation` | Landed House Renovation | Subang Jaya |
| `/locations/kuala-lumpur/digital-lock` | Digital Lock | Kuala Lumpur |
| `/locations/selangor/office-renovation` | Office Renovation | Selangor |
| `/locations/petaling-jaya/landed-house-renovation` | Landed House Renovation | Petaling Jaya |

## 需要同步改的代码位置

1. `src/lib/serviceAreaRoutes.ts` —— 白名单加这 7 个组合
2. `scripts/seo-static-pages.mjs` —— `staticDefs` 加 14 条（7 组合 × en/zh）
3. `docs/interaction-route-compliance.json` —— 无需新增，条目已存在

---

## `/locations/kuala-lumpur/condo-renovation`

英文正文 1875 字符 / 中文 940 汉字（4 段）

### English

```json
{"en": {
  "heading": "Condo Renovation in Kuala Lumpur",
  "area": "Kuala Lumpur",
  "service": "Condo Renovation",
  "question": "What should I confirm before renovating a Kuala Lumpur condo?",
  "answer": "Confirm the management office requirements first: application documents, deposit, permitted working hours, service lift booking and common area protection. Then decide what stays and what changes, because the building rules decide more of the programme than the design does.",
  "title": "Condo Renovation Kuala Lumpur | FLASH CAST",
  "description": "Condo renovation in Kuala Lumpur for units from the 1990s to current buildings. Layout, storage, electrical and air-conditioning works planned around management rules and structural limits.",
  "keywords": "condo renovation kuala lumpur, apartment renovation kl, condo interior works",
  "entityName": "Condo Renovation Kuala Lumpur",
  "bodyHeading": "Plan the unit around what the building allows",
  "body": [
    "<p>Kuala Lumpur condos span three generations of buildings, and each behaves differently. Units from the 1990s usually have fixed drainage stacks, limited power capacity and bathrooms whose waterproofing has already been redone once. Buildings from the 2000s and later are more generous on services but stricter on management process. Either way, the structural walls, the facade and the wet-area positions are largely fixed, so the work is layout, storage, services and finishes rather than extension.</p>",
    "<p>Start the quotation with a list rather than a wish: which rooms change use, which fittings stay, whether the kitchen or bathroom moves, and how many additional power and data points are needed. Ask for demolition, wet works, carpentry, electrical, air-conditioning and painting to appear as separate lines. A single lump sum hides which items are provisional, and in a condo the provisional items are usually the ones management approval delays.</p>",
    "<p>The decision that costs the most to get wrong is the bathroom. Moving a bathroom means new drainage runs, which means either raising the floor or cutting into the slab, and both need approval and both affect the unit below. If the layout is staying, the cheaper and more reliable choice is to redo the waterproofing properly while the tiles are off, rather than patching it and hoping. The same logic applies to the kitchen: relocating the sink is straightforward, relocating the hob and the extractor usually is not.</p>",
    "<p>Agree the handover checklist before work starts. Test every outlet and switch, run each tap and check the visible joints after a few minutes, confirm the air-conditioning drains away rather than into the ceiling, and check that doors and drawers close as specified. Record defects in writing with a return date, and confirm what the management office needs before releasing the deposit.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "吉隆坡公寓装修",
  "area": "吉隆坡",
  "service": "公寓装修",
  "question": "吉隆坡公寓装修前要先确认什么？",
  "answer": "先确认管理处的要求：申请文件、押金、允许施工时段、货梯预约与公共区域保护。再决定哪些保留、哪些改动，因为大楼规定对工期的影响往往比设计更大。",
  "title": "吉隆坡公寓装修｜管理处审批｜FLASH CAST",
  "description": "吉隆坡公寓装修，覆盖 1990 年代到近年的单位。格局、收纳、电气与空调工程，按管理处规定与结构限制规划。",
  "keywords": "吉隆坡公寓装修, 公寓翻新, 公寓管理处审批",
  "entityName": "吉隆坡公寓装修",
  "bodyHeading": "先看大楼允许做什么，再谈怎么改",
  "body": [
    "<p>吉隆坡的公寓横跨三代建筑，各自的表现差别很大。1990 年代的单位通常在建时就固定了排水立管位置，电容量按当时的小家电负荷设定，插座数量偏少，浴室防水多半已经至少修补过一次；2000 年之后的大楼在机电配置上宽松些，但管理处流程更规范，对施工时段与公共区域保护的要求更细。近年新盘则常见小面积单位，厨房与浴室本来就紧凑，动一点就牵动整间。无论哪一代，结构墙、外观立面与湿区位置基本不能动，所以工程重点落在格局调整、收纳设计、机电改造与收口质量上，而不是扩大面积。判断一栋楼属于哪一代，往往比讨论设计风格更能决定预算和工期。</p>",
    "<p>报价请从清单开始，不要从愿望开始。先列出：哪些房间要改变用途、哪些固定件必须保留、厨房或浴室是否需要移位、需要增加多少个电源与网络点位、空调是否要增设或移位。然后要求报价把拆除、泥水（砌墙铺砖）、木作（柜体与门）、电气、空调、油漆各自单独列项，并标明哪些属于已确认、哪些属于打开后才能判断。一个笼统的总价会把暂定项目藏在里面，而在公寓里，暂定项目往往正是最容易被管理处审批拖住的那几项——例如涉及墙面开洞、排水改管或接驳公共管道的工序。把这些提前标出来，你才能在开工前判断哪些可以先做、哪些要等批复，而不是等到中途才发现进度卡在一个还没批下来的许可上。</p>",
    "<p>最容易出错、代价也最高的是浴室。移动浴室位置意味着重做排水，要么抬高地面（损失净高、门槛变高），要么在楼板上开洞（影响楼下、必须审批），两种做法都需要管理处同意，也都会牵连楼下的单位。如果格局不动，更省钱也更可靠的选择是趁瓷砖拆掉时把防水层彻底重做，而不是局部修补再赌一次——防水一旦失效，水渍通常先出现在楼下天花，等你发现时已经要赔。厨房同理：水槽移位通常可行，因为给排水可以在柜内解决；灶台与抽油烟机移位通常不行，因为排烟要走大楼预留的公共管道，位置一改就可能违反规定或被要求还原。这三件事在报价阶段就要定，不能留到施工中再讨论。</p>",
    "<p>开工前先把交付清单谈定，不要等到最后一天才讨论标准。验收时逐个插座与开关测试通电、每个龙头放水后等三到五分钟再摸可见接头、确认空调冷凝水是排到指定位置而不是渗进天花或墙面、检查所有门扇与抽屉是否按约定闭合且不刮蹭。浴室要按日常使用方式试一遍，包括淋浴时的排水速度与地漏有没有返味。发现的问题书面记录，写明由谁处理、什么时候返场，双方各留一份。最后与管理处确认押金退还需要哪些手续：完工照片、公共区域复原确认，还是管理处的验收签字。这一步常常被忽略，结果工程做完几个月，押金还压在大楼那边。</p>"
  ]
}}
```

---

### Bahasa Melayu

马来文正文 2059 字符（4 段）

```json
{
  "ms": {
    "heading": "Pengubahsuaian Kondominium di Kuala Lumpur",
    "area": "Kuala Lumpur",
    "service": "Pengubahsuaian Kondominium",
    "question": "Apakah yang perlu saya sahkan sebelum mengubah suai kondominium di Kuala Lumpur?",
    "answer": "Sahkan keperluan pejabat pengurusan dahulu: dokumen permohonan, deposit, waktu kerja yang dibenarkan, tempahan lif servis dan perlindungan kawasan bersama. Kemudian tentukan apa yang dikekalkan dan apa yang diubah, kerana peraturan bangunan menentukan program lebih daripada reka bentuk.",
    "title": "Pengubahsuaian Kondominium Kuala Lumpur | FLASH CAST",
    "description": "Pengubahsuaian kondominium di Kuala Lumpur untuk unit dari era 1990-an hingga bangunan semasa. Kerja susun atur, penyimpanan, elektrik dan penghawa dingin dirancang mengikut peraturan pengurusan dan had struktur.",
    "keywords": "pengubahsuaian kondominium kuala lumpur, pengubahsuaian apartmen kl, kerja dalaman kondo",
    "entityName": "Pengubahsuaian Kondominium Kuala Lumpur",
    "bodyHeading": "Rancang unit mengikut apa yang dibenarkan bangunan",
    "body": [
      "<p>Kondominium di Kuala Lumpur merangkumi tiga generasi bangunan, dan setiap satu berkelakuan berbeza. Unit dari era 1990-an biasanya mempunyai susunan paip buangan yang tetap, kapasiti elektrik terhad dan bilik mandi yang kalis airnya sudah dibaiki sekurang-kurangnya sekali. Bangunan dari tahun 2000-an dan selepasnya lebih longgar pada perkhidmatan tetapi lebih ketat pada proses pengurusan. Sama ada, dinding struktur, fasad dan kedudukan kawasan basah sebahagian besarnya tetap, jadi kerjanya ialah susun atur, penyimpanan, perkhidmatan dan kemasan dan bukan pembesaran.</p>",
      "<p>Mulakan sebut harga dengan senarai dan bukan hasrat: bilik mana yang bertukar fungsi, kelengkapan mana yang dikekalkan, sama ada dapur atau bilik mandi dipindahkan, dan berapa banyak titik kuasa serta data tambahan diperlukan. Minta kerja perobohan, kerja basah, pertukangan, elektrik, penghawa dingin dan pengecatan muncul sebagai baris berasingan. Satu jumlah pukal menyembunyikan item mana yang sementara, dan dalam kondo item sementara biasanya yang dilengahkan oleh kelulusan pengurusan.</p>",
      "<p>Keputusan yang paling mahal jika tersilap ialah bilik mandi. Memindahkan bilik mandi bermakna laluan saliran baharu, yang bermakna sama ada menaikkan lantai atau memotong papak, dan kedua-duanya perlu kelulusan dan kedua-duanya menjejaskan unit di bawah. Jika susun atur kekal, pilihan yang lebih murah dan lebih boleh diharap ialah membuat semula kalis air dengan betul semasa jubin dibuka, dan bukan menampal serta berharap. Logik yang sama berlaku pada dapur: memindahkan sinki mudah, memindahkan dapur memasak dan penyedut biasanya tidak.</p>",
      "<p>Persetujui senarai semak serahan sebelum kerja bermula. Uji setiap alur keluar dan suis, jalankan setiap paip dan periksa sambungan yang kelihatan selepas beberapa minit, sahkan penghawa dingin mengalir keluar dan bukan ke siling, dan periksa pintu serta laci menutup seperti yang ditetapkan. Rekod kecacatan secara bertulis dengan tarikh kembali, dan sahkan apa yang diperlukan pejabat pengurusan sebelum deposit dilepaskan.</p>"
    ]
  }
}
```
## `/locations/petaling-jaya/kitchen-renovation`

英文正文 1909 字符 / 中文 960 汉字（4 段）

### English

```json
{"en": {
  "heading": "Kitchen Renovation in Petaling Jaya",
  "area": "Petaling Jaya",
  "service": "Kitchen Renovation",
  "question": "What makes a Petaling Jaya kitchen different to plan?",
  "answer": "Most PJ kitchens sit in buildings from the 1980s and 1990s, where the drainage stack position and the electrical capacity are the real limits. Confirm those two before choosing cabinets, because both are expensive to move later.",
  "title": "Kitchen Renovation Petaling Jaya | FLASH CAST",
  "description": "Kitchen renovation in Petaling Jaya for older apartments and terraces. Drainage stack and electrical capacity checked first, then cabinets, worktop and appliance planning.",
  "keywords": "kitchen renovation petaling jaya, kitchen cabinet pj, kitchen renovation contractor pj",
  "entityName": "Kitchen Renovation Petaling Jaya",
  "bodyHeading": "Settle the stack and the supply before the layout",
  "body": [
    "<p>A kitchen in Petaling Jaya is usually working inside an older envelope. The drainage stack is fixed where the original builder put it, the incoming supply was sized for a far smaller appliance load, and the kitchen window or service yard sets how far the counter can run. Before any cabinet is drawn, confirm where the sink drain can actually go and how many dedicated circuits the unit can support. Induction hobs, built-in ovens and dryers each want their own circuit, and a 1990s consumer unit rarely has spare ways.</p>",
    "<p>Bring photos, a floor plan and the appliance list to the first discussion, and mark which existing items you intend to keep. In PJ, the items most often worth keeping are the floor tiles and the service yard door; the items least worth keeping are the original cabinet carcasses, which rarely survive a second dismantling. Ask for the quotation to separate demolition, plumbing, electrical, cabinetry, worktop and installation, so a later change to one line does not disturb the others.</p>",
    "<p>The layout decision to settle early is whether the kitchen stays single-run or becomes an L or U. A single run keeps costs down and suits narrow units, but storage suffers. An L shape gains corner workspace at the cost of one blind cabinet, which is why corner solutions matter more than they look. If the unit has a wet kitchen on the service yard, decide whether the heavy cooking stays there — that decision changes the extractor route, the waterproofing scope and the number of power points on both sides.</p>",
    "<p>At handover, open every drawer fully and check it clears the wall or the refrigerator, run water in the sink and look at the trap joints after a few minutes, test each appliance on its own circuit rather than all at once, and check that the extractor actually moves air. Record any touch-up items with a return date, and keep the appliance manuals with the quotation.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "八打灵再也厨房装修",
  "area": "八打灵再也",
  "service": "厨房装修",
  "question": "八打灵再也的厨房规划有什么不同？",
  "answer": "PJ 的厨房多位于 1980 至 1990 年代的建筑里，排水立管位置与电容量才是真正的限制。这两项要在选橱柜之前确认，因为事后移动的代价很高。",
  "title": "八打灵再也厨房装修｜定制橱柜｜FLASH CAST",
  "description": "八打灵再也老公寓与排屋的厨房装修。先核对排水立管与电容量，再规划橱柜、台面与电器。",
  "keywords": "八打灵再也厨房装修, 厨房橱柜定制, 厨房翻新",
  "entityName": "八打灵再也厨房装修",
  "bodyHeading": "先定排水与供电，再谈布局",
  "body": [
    "<p>八打灵再也的厨房通常是在较老的建筑外壳里作业，这决定了讨论的起点。排水立管固定在当年建商放的位置，想在原位以外的位置做水槽，就得接受抬高地面或沿墙走管的做法；进电容量按远小于现在的电器负荷设计，配电箱往往没有几个备用位；厨房窗户或工作阳台的位置，决定台面能连续延伸多长、转角能不能做。在画任何橱柜之前，先请人确认水槽排水实际能接到哪里、这户能支撑几个独立回路。电磁炉、嵌入式烤箱、洗碗机与烘干机各自需要独立回路，而这些在 1990 年代的配电箱里几乎不可能同时满足，必须取舍。如果单位仍是单相供电，空调数量本身就是硬上限，这一点在加装前就要算清楚，而不是等电器买回来才发现带不动。</p>",
    "<p>第一次讨论请带照片、平面图与电器清单，并标出打算保留的现有项目。在 PJ，最值得保留的通常是地砖与工作阳台的门，因为拆掉重做的成本高、回收价值低；最不值得保留的是原装柜体，拆第二次基本就散了，铰链孔位也对不上新五金。请要求报价把拆除、水管、电气、柜体、台面与安装分开列项，这样日后想换台面材质或升级五金时，改一项不会牵动其他几项。同时请注明哪些项目需要等电器型号确定才能报价，避免开工后才发现开孔尺寸不对。柜体下方如果有地台、管道井或高低差，量尺时要一并记录并反映在图纸上，否则台面深度与转角处理都会估错，做完只能迁就。</p>",
    "<p>要早定的布局问题是：厨房保持单排，还是改成 L 型或 U 型。单排成本低、适合窄单位，走道也宽，但收纳明显吃亏，锅具与小家电只能往上堆。L 型多出一个转角操作面，代价是一个盲柜，所以转角拉篮或转盘这类方案比看起来更重要，它决定了那个角落是能用还是废掉。如果单位在工作阳台有湿厨房，要先决定重油烟烹饪是否留在那里——这个决定会连带影响排烟路线怎么走、防水范围要做到多大，以及干湿两侧各自需要几个电点位。三件事互相牵制，先定一个再改，代价最高。还有一点常被忽略：如果原厨房只有一处排水口，想把水槽与洗衣机分开可能根本做不到，这时候要接受共用接管或者放弃其中一项，而不是硬做。</p>",
    "<p>交付时把每个抽屉完全拉开，确认不会撞到墙、冰箱或对面柜门；水槽放水后等几分钟再摸存水弯与角阀接头；每个电器分别在自己的回路上单独测试，不要一次全开，因为那样跳闸时分不清是哪一路；确认抽油烟机是真的在往外排风，而不是把油烟吹回室内。台面接缝、挡水条与开孔边缘都要看一遍。需要补做的项目书面记录并约定返场日期，同时把电器说明书、保修卡与报价单放在一起保存，日后维修或更换时都要用到。最后请确认橱柜的保修范围与五金品牌，铰链与滑轨是最常出问题、也最容易被含糊带过的部分。</p>"
  ]
}}
```

---

### Bahasa Melayu

马来文正文 2069 字符（4 段）

```json
{
  "ms": {
    "heading": "Pengubahsuaian Dapur di Petaling Jaya",
    "area": "Petaling Jaya",
    "service": "Pengubahsuaian Dapur",
    "question": "Apakah yang berbeza semasa merancang dapur di Petaling Jaya?",
    "answer": "Kebanyakan dapur di PJ berada dalam bangunan dari era 1980-an dan 1990-an, di mana kedudukan susunan paip buangan dan kapasiti elektrik ialah had sebenar. Sahkan kedua-duanya sebelum memilih kabinet, kerana kedua-duanya mahal untuk dialihkan kemudian.",
    "title": "Pengubahsuaian Dapur Petaling Jaya | FLASH CAST",
    "description": "Pengubahsuaian dapur di Petaling Jaya untuk apartmen dan teres lama. Susunan paip buangan dan kapasiti elektrik disemak dahulu, kemudian kabinet, permukaan kerja dan perancangan peralatan.",
    "keywords": "pengubahsuaian dapur petaling jaya, kabinet dapur pj, kontraktor pengubahsuaian dapur pj",
    "entityName": "Pengubahsuaian Dapur Petaling Jaya",
    "bodyHeading": "Selesaikan paip buangan dan bekalan sebelum susun atur",
    "body": [
      "<p>Dapur di Petaling Jaya biasanya beroperasi dalam sampul bangunan yang lebih lama. Susunan paip buangan kekal di tempat pembina asal meletakkannya, bekalan masuk disaiz untuk beban peralatan yang jauh lebih kecil, dan tingkap dapur atau ruang servis menentukan sejauh mana permukaan kerja boleh memanjang. Sebelum mana-mana kabinet dilukis, sahkan di mana saliran sinki benar-benar boleh pergi dan berapa banyak litar khusus yang dapat ditanggung unit itu. Dapur induksi, ketuhar terbina dan pengering masing-masing mahukan litar sendiri, dan papan pengguna era 1990-an jarang mempunyai ruang lebihan.</p>",
      "<p>Bawa gambar, pelan lantai dan senarai peralatan ke perbincangan pertama, dan tandakan item sedia ada yang anda mahu kekalkan. Di PJ, item yang paling kerap wajar dikekalkan ialah jubin lantai dan pintu ruang servis; item yang paling kurang wajar dikekalkan ialah badan kabinet asal, yang jarang bertahan apabila dibuka kali kedua. Minta sebut harga mengasingkan perobohan, paip, elektrik, pertukangan kabinet, permukaan kerja dan pemasangan, supaya perubahan kemudian pada satu baris tidak mengganggu yang lain.</p>",
      "<p>Keputusan susun atur yang perlu diselesaikan awal ialah sama ada dapur kekal satu baris atau menjadi bentuk L atau U. Satu baris mengekalkan kos rendah dan sesuai untuk unit sempit, tetapi penyimpanan terjejas. Bentuk L mendapat ruang kerja sudut dengan kos satu kabinet buta, dan itulah sebabnya penyelesaian sudut lebih penting daripada yang kelihatan. Jika unit mempunyai dapur basah di ruang servis, tentukan sama ada masakan berat kekal di situ — keputusan itu mengubah laluan penyedut, skop kalis air dan bilangan titik kuasa di kedua-dua belah.</p>",
      "<p>Semasa serahan, buka setiap laci sepenuhnya dan periksa ia tidak menggeser dinding atau peti sejuk, jalankan air di sinki dan lihat sambungan perangkap selepas beberapa minit, uji setiap peralatan pada litar sendiri dan bukan serentak, dan sahkan penyedut benar-benar menggerakkan udara. Rekod item tampalan dengan tarikh kembali, dan simpan manual peralatan bersama sebut harga.</p>"
    ]
  }
}
```
## `/locations/cheras/condo-renovation`

英文正文 1811 字符 / 中文 867 汉字（4 段）

### English

```json
{"en": {
  "heading": "Condo Renovation in Cheras",
  "area": "Cheras",
  "service": "Condo Renovation",
  "question": "How do older and newer Cheras condos differ for renovation?",
  "answer": "Older blocks around Taman Maluri and Taman Midah usually need services reviewed — supply capacity, pipes and waterproofing — before finishes. Newer blocks towards Sungai Besi are mostly about layout and storage within management rules. Confirm which one you have before requesting a quotation.",
  "title": "Condo Renovation Cheras | FLASH CAST",
  "description": "Condo renovation in Cheras for older blocks around Taman Maluri and newer units towards Sungai Besi. Services review for old blocks, layout and storage within management rules for new ones.",
  "keywords": "condo renovation cheras, apartment renovation cheras, condo renovation contractor cheras",
  "entityName": "Condo Renovation Cheras",
  "bodyHeading": "Identify the building generation first",
  "body": [
    "<p>Cheras has two condo populations that behave very differently. Blocks built in the 1990s and early 2000s around Taman Maluri, Taman Pertama and Taman Midah were designed with smaller loads, fewer power points and bathrooms whose waterproofing has usually been patched at least once. Blocks towards Sungai Besi and Cheras Selatan are newer, with better services, but with management offices that enforce the renovation rules more consistently. The first visit is spent working out which category the unit falls into, because the scope and the risk are not the same.</p>",
    "<p>For an older block, ask for the electrical capacity, the condition of the incoming supply and whether the unit still has its original piping before discussing finishes. For a newer block, ask the management office for the renovation application, the deposit, the permitted hours and the service lift booking process. Both sets of answers belong in the quotation as assumptions, so that if one turns out to be wrong, the change is visible rather than absorbed silently.</p>",
    "<p>The most common expensive surprise in Cheras condos is the bathroom. In older blocks, the waterproofing has often been spot-repaired, and the floor may already have been raised once, which reduces headroom and can affect the drainage fall. In newer blocks, the bathroom is usually fine but the layout is tight, so the temptation is to move a wall that turns out to be structural. Confirm both before demolition, not after.</p>",
    "<p>At handover, run the water in each bathroom and check the joints after a few minutes, test every outlet and switch, and confirm the air-conditioning drains properly. Record defects with a return date, and settle the management deposit refund steps before the last payment, because that is the item that most often delays closure.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "蕉赖公寓装修",
  "area": "蕉赖",
  "service": "公寓装修",
  "question": "蕉赖的老公寓与新公寓，装修上有什么不同？",
  "answer": "Taman Maluri、Taman Midah 一带的旧楼通常要先查供电容量、管道与防水，再谈收口；往 Sungai Besi 方向的新楼则多在管理规则内做格局与收纳。询价前先确认你手上是哪一种。",
  "title": "蕉赖公寓装修｜新旧楼差异｜FLASH CAST",
  "description": "蕉赖公寓装修，覆盖 Taman Maluri 旧楼与 Sungai Besi 方向新楼。旧楼先查机电，新楼在管理规则内做格局与收纳。",
  "keywords": "蕉赖公寓装修, 蕉赖公寓翻新, 公寓管理处审批",
  "entityName": "蕉赖公寓装修",
  "bodyHeading": "先判断这栋楼属于哪一代",
  "body": [
    "<p>蕉赖的公寓分成两类，表现相差很大。Taman Maluri、Taman Pertama、Taman Midah 一带 1990 至 2000 年代初的楼，当初按较小负荷设计，电点位少、回路也少，浴室防水大多至少局部修补过一次；这类单位常见的还有窗户偏小、抽风靠窗不靠管。往 Sungai Besi 与 Cheras Selatan 方向的新楼机电条件更好，但管理处对装修规定的执行更一致，申请、押金、时段、保护措施一项不少。第一次上门除了看单位本身，还要判断这属于哪一类，因为两者的施工范围、风险和报价结构完全不同，用同一套报价模板去套，通常会在中途出问题。判断的方法很实际：看配电箱还有没有空位、看浴室地面有没有被抬高的痕迹、看管理处给的装修须知厚不厚。</p>",
    "<p>旧楼要先问三件事：电容量多少、进线状况如何、水管是否还是原装。这三项决定你能加多少电器、要不要换总电、以及浴室改造时是不是连管子一起换。新楼则要先问管理处四件事：装修申请要交什么、押金多少、允许施工的时段、货梯怎么预约。这两组答案都要以假设的形式写进报价，标明如果实际情况不同会如何调整。这样一旦某一项判断错了，变更是看得见、谈得清的，而不是被默默吸收进总价里，等到结账时才冒出来。特别是换总电这一项，在旧楼里常常是「看情况」的，报价时如果不写明前提，最后很容易变成争议。</p>",
    "<p>蕉赖公寓最常出现的昂贵意外是浴室。旧楼里防水多半是局部修补过，地面可能已经被抬高过一次，既压缩净高也让排水坡度变得奇怪，这时候再铺一层砖只会更糟；正确做法是拆到底层、重做防水与找坡，而不是再盖一层。新楼浴室通常状态良好，但布局很紧，于是容易想动一堵其实是结构的墙，或者想把干湿分离改成纯干区，却没意识到排水已经定型。这两件事都必须在拆除之前确认，拆除之后再发现，代价会翻倍。另外要提醒一点：旧楼若浴室在单位中央、四周没有窗，通风本来就不足，翻新时值得顺便加装抽风，否则潮气会长期留在柜体背面。</p>",
    "<p>交付时每间浴室放水后等三到五分钟再摸接头与角阀、逐个插座与开关测试通电、确认空调冷凝水是排到指定位置而不是滴在墙面或阳台上。地漏要试排水速度，淋浴后看有没有积水。缺陷书面记录并约定返场日期。管理处的押金退还流程要在付最后一笔款之前谈清楚：需要哪些完工照片、公共区域要不要管理处验收、退款要多久。这一步拖住结案的情况相当常见，提前问比事后追要省事得多。最后建议在入住一个月后再自查一次，重点看浴室门外墙面与楼下天花有没有新的水痕，那是最早出现的信号。</p>"
  ]
}}
```

---

### Bahasa Melayu

马来文正文 1891 字符（4 段）

```json
{
  "ms": {
    "heading": "Pengubahsuaian Kondominium di Cheras",
    "area": "Cheras",
    "service": "Pengubahsuaian Kondominium",
    "question": "Apakah perbezaan antara kondo lama dan baharu di Cheras untuk pengubahsuaian?",
    "answer": "Blok lama sekitar Taman Maluri dan Taman Midah biasanya memerlukan semakan perkhidmatan — kapasiti bekalan, paip dan kalis air — sebelum kemasan. Blok baharu menghala Sungai Besi kebanyakannya tentang susun atur dan penyimpanan dalam peraturan pengurusan. Sahkan yang mana satu unit anda sebelum meminta sebut harga.",
    "title": "Pengubahsuaian Kondominium Cheras | FLASH CAST",
    "description": "Pengubahsuaian kondominium di Cheras untuk blok lama sekitar Taman Maluri dan unit baharu menghala Sungai Besi. Semakan perkhidmatan untuk blok lama, susun atur dan penyimpanan dalam peraturan pengurusan untuk yang baharu.",
    "keywords": "pengubahsuaian kondominium cheras, pengubahsuaian apartmen cheras, kontraktor pengubahsuaian kondo cheras",
    "entityName": "Pengubahsuaian Kondominium Cheras",
    "bodyHeading": "Kenal pasti generasi bangunan dahulu",
    "body": [
      "<p>Cheras mempunyai dua populasi kondo yang berkelakuan sangat berbeza. Blok yang dibina pada era 1990-an dan awal 2000-an sekitar Taman Maluri, Taman Pertama dan Taman Midah direka dengan beban lebih kecil, titik kuasa lebih sedikit dan bilik mandi yang kalis airnya biasanya telah ditampal sekurang-kurangnya sekali. Blok menghala Sungai Besi dan Cheras Selatan lebih baharu, dengan perkhidmatan lebih baik, tetapi dengan pejabat pengurusan yang melaksanakan peraturan pengubahsuaian lebih konsisten. Lawatan pertama dihabiskan untuk menentukan kategori unit itu, kerana skop dan risikonya tidak sama.</p>",
      "<p>Bagi blok lama, tanya kapasiti elektrik, keadaan bekalan masuk dan sama ada unit masih menggunakan paip asal sebelum membincangkan kemasan. Bagi blok baharu, minta pejabat pengurusan memberikan borang permohonan pengubahsuaian, deposit, waktu yang dibenarkan dan proses tempahan lif servis. Kedua-dua set jawapan itu wajar dimasukkan ke dalam sebut harga sebagai andaian, supaya jika satu ternyata salah, perubahannya kelihatan dan bukan diserap secara senyap.</p>",
      "<p>Kejutan mahal yang paling biasa di kondo Cheras ialah bilik mandi. Dalam blok lama, kalis airnya sering ditampal secara setempat, dan lantai mungkin sudah dinaikkan sekali, yang mengurangkan ketinggian siling dan boleh menjejaskan kejatuhan saliran. Dalam blok baharu, bilik mandinya biasanya baik tetapi susun aturnya sempit, jadi godaan adalah memindahkan dinding yang ternyata struktur. Sahkan kedua-duanya sebelum perobohan, bukan selepasnya.</p>",
      "<p>Semasa serahan, jalankan air di setiap bilik mandi dan periksa sambungan selepas beberapa minit, uji setiap alur keluar dan suis, dan sahkan penghawa dingin mengalir dengan betul. Rekod kecacatan dengan tarikh kembali, dan selesaikan langkah pemulangan deposit pengurusan sebelum bayaran terakhir, kerana itulah item yang paling kerap melengahkan penutupan.</p>"
    ]
  }
}
```
## `/locations/subang-jaya/landed-house-renovation`

英文正文 1765 字符 / 中文 848 汉字（4 段）

### English

```json
{"en": {
  "heading": "Landed House Renovation in Subang Jaya",
  "area": "Subang Jaya",
  "service": "Landed House Renovation",
  "question": "What should I check before extending a Subang Jaya terrace?",
  "answer": "Check the existing structure, the roof and the drainage before designing the extension, and confirm the MBSJ setback and coverage rules first. An extension that ignores either will be expensive to correct after it is built.",
  "title": "Landed House Renovation Subang Jaya | FLASH CAST",
  "description": "Landed house renovation in Subang Jaya: terrace and semi-detached extensions, rewiring, re-piping, roof work and full-house refurbishment with MBSJ submission guidance.",
  "keywords": "landed house renovation subang jaya, terrace extension subang jaya, house renovation usj",
  "entityName": "Landed House Renovation Subang Jaya",
  "bodyHeading": "Structure, roof and drainage come before the design",
  "body": [
    "<p>Most Subang Jaya terraces and semi-detached homes were built between the 1980s and the 2000s, which means the original wiring, plumbing and roof are at or past their expected life. Before designing any extension, the existing structure needs checking: footing condition, whether previous alterations were done with approval, and whether the roof can carry additional load. A rear extension tied into a roof that is already failing simply moves the problem inward.</p>",
    "<p>Bring the original plan if you have it, plus current photos of every elevation and the rear lane. Ask for MBSJ setback and coverage requirements to be confirmed before the sketch is finalised, because those two numbers determine how much floor area the extension can add. In practice, families often discover that the plot coverage limit is the binding constraint, not the budget. Getting that answer first saves redesigning twice.</p>",
    "<p>The order of work matters more here than in a condo. Roof and structural work first, then wiring and plumbing, then wet works and waterproofing, then carpentry, then paint. Reversing that order is how a house ends up with new paint over a wall that later has to be opened for a leaking pipe. Where the family stays during the work, decide which entrance, kitchen and bathroom remain usable, and confirm that the temporary arrangement can survive the wet-works stage.</p>",
    "<p>At handover, check each room against the written scope, test every outlet and tap, run water in the bathrooms and look at the joints after a few minutes, and inspect the extension junction with the original house for seepage. Settlement cracks in the first months are normal and are filled at the next touch-up. Keep the as-built drawings and the photographs of concealed work.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "梳邦再有地住宅装修",
  "area": "梳邦再也",
  "service": "有地住宅装修",
  "question": "梳邦再的排屋扩建前要检查什么？",
  "answer": "设计扩建之前，先检查现有结构、屋顶与排水，并先确认 MBSJ 的退线与覆盖率规定。忽略任何一项，建好之后再改都很贵。",
  "title": "梳邦再有地住宅装修｜排屋扩建｜FLASH CAST",
  "description": "梳邦再有地住宅装修：排屋与半独立式扩建、重新拉电、换管、屋顶工程与全屋翻新，含 MBSJ 送审指引。",
  "keywords": "梳邦再有地住宅装修, 排屋扩建, USJ 房屋翻新",
  "entityName": "梳邦再有地住宅装修",
  "bodyHeading": "结构、屋顶与排水要先于设计",
  "body": [
    "<p>梳邦再的排屋与半独立式大多建于 1980 至 2000 年间，也就是说原装线路、水管与屋顶都已经到或过了预期寿命。在设计任何扩建之前，现有结构必须先检查：基础有没有沉降或裂缝、之前的改动是不是带审批、屋顶结构能不能再承担新增荷载。把扩建接到一个已经在漏的屋顶上，只是把问题往屋里挪，并不会消失。很多业主是先谈扩建方案、再发现屋顶要换，结果预算被打乱；反过来做，先摸清房子现状，再定能加多少，反而更快也更省。检查这一轮通常不需要拆任何东西，靠目视、敲击与询问前屋主就能得到大部分答案，但它决定后面所有数字的可靠性。</p>",
    "<p>如果有原图请带上，另外准备各个立面与后巷的现状照片，最好连同相邻单位的一起，方便判断界线。在定稿之前先确认 MBSJ 的退线（setback）与覆盖率（plot ratio / coverage）要求，因为这两个数字直接决定扩建能加多少面积。实际操作中，很多家庭会发现真正的约束是覆盖率上限，而不是预算——也就是说钱够，但规定不允许再加。先把这个问题问清楚，可以省下一轮重画与重新报价。如果房子曾经扩建过，还要确认那部分是合法还是需要先合法化，否则新申请可能卡住。部分旧区的排屋界线与地契图有出入，这一点也应在动工前厘清，避免扩建压到邻地。</p>",
    "<p>这里的工序顺序比公寓更要紧，因为一栋房子里同时进行的工程更多。正确顺序是：屋顶与结构先做，再电线水管，再泥水与防水，然后木作，最后油漆与安装。顺序反过来，就会出现新漆刷完、墙又因为漏水管被打开的情况，而且第二次修补的颜色很难完全一致。如果家人在施工期间继续居住，要先定哪些出入口、厨房与浴室保持可用，并确认这个临时安排撑得过泥水阶段——泥水期的粉尘与临时断水，往往是最难熬的两三周。建议在开工前把贵重家具集中到一个不施工的房间并封好门缝，这比每天遮盖省事得多。</p>",
    "<p>交付时按书面范围逐房核对，不要凭印象；逐个插座与龙头测试，浴室放水后等几分钟看接头与排水坡度；扩建与原屋的交接处重点看有没有渗水痕迹，尤其是下雨之后。头几个月出现沉降或温度变化造成的细裂缝是正常的，下次补漆时一并处理即可。请保留竣工图与隐蔽工程照片，包括电线走向、水管位置与防水范围——在一栋改过两三次的房子里，这些是日后维修改动时唯一可靠的依据。如果扩建涉及屋顶接驳，建议在第一次大雨后再复查一次，那时候问题最容易暴露，也最容易在保修期内解决。</p>"
  ]
}}
```

---

### Bahasa Melayu

马来文正文 1852 字符（4 段）

```json
{
  "ms": {
    "heading": "Pengubahsuaian Rumah Bertanah di Subang Jaya",
    "area": "Subang Jaya",
    "service": "Pengubahsuaian Rumah Bertanah",
    "question": "Apakah yang perlu saya periksa sebelum membesarkan teres di Subang Jaya?",
    "answer": "Periksa struktur sedia ada, bumbung dan saliran sebelum mereka bentuk pembesaran, dan sahkan peraturan jarak sekatan serta liputan MBSJ terlebih dahulu. Pembesaran yang mengabaikan mana-mana satu daripadanya akan mahal untuk dibetulkan selepas dibina.",
    "title": "Pengubahsuaian Rumah Bertanah Subang Jaya | FLASH CAST",
    "description": "Pengubahsuaian rumah bertanah di Subang Jaya: pembesaran teres dan rumah separa berasingan, pendawaian semula, paip semula, kerja bumbung dan pengubahsuaian seluruh rumah dengan panduan penyerahan MBSJ.",
    "keywords": "pengubahsuaian rumah bertanah subang jaya, pembesaran teres subang jaya, pengubahsuaian rumah usj",
    "entityName": "Pengubahsuaian Rumah Bertanah Subang Jaya",
    "bodyHeading": "Struktur, bumbung dan saliran mendahului reka bentuk",
    "body": [
      "<p>Kebanyakan teres dan rumah separa berasingan di Subang Jaya dibina antara era 1980-an dan 2000-an, bermakna pendawaian, paip dan bumbung asal berada pada atau melepasi jangka hayat dijangka. Sebelum mereka bentuk apa-apa pembesaran, struktur sedia ada perlu diperiksa: keadaan asas, sama ada ubah suai terdahulu dilakukan dengan kelulusan, dan sama ada bumbung dapat menanggung beban tambahan. Pembesaran belakang yang diikat pada bumbung yang sudah gagal hanya memindahkan masalah ke dalam.</p>",
      "<p>Bawa pelan asal jika anda ada, berserta gambar semasa setiap fasad dan lorong belakang. Minta keperluan jarak sekatan dan liputan MBSJ disahkan sebelum lakaran dimuktamadkan, kerana dua angka itu menentukan berapa banyak keluasan lantai yang boleh ditambah. Dalam amalan, keluarga sering mendapati had liputan plot itulah kekangan sebenar, bukan belanjawan. Mendapat jawapan itu dahulu menjimatkan satu pusingan reka bentuk.</p>",
      "<p>Urutan kerja lebih penting di sini berbanding di kondo. Kerja bumbung dan struktur dahulu, kemudian pendawaian dan paip, kemudian kerja basah dan kalis air, kemudian pertukangan, kemudian cat. Membalikkan urutan itu ialah cara sebuah rumah berakhir dengan cat baharu di atas dinding yang kemudian perlu dibuka kerana paip bocor. Jika keluarga tinggal semasa kerja, tentukan pintu masuk, dapur dan bilik mandi mana yang kekal boleh digunakan, dan sahkan susunan sementara itu dapat bertahan melalui peringkat kerja basah.</p>",
      "<p>Semasa serahan, periksa setiap bilik terhadap skop bertulis, uji setiap alur keluar dan paip, jalankan air di bilik mandi dan lihat sambungan selepas beberapa minit, dan periksa persimpangan pembesaran dengan rumah asal untuk resapan. Retak enapan pada bulan-bulan pertama adalah normal dan ditampal pada tampalan berikutnya. Simpan lukisan sebagaimana-dibina dan gambar kerja tersembunyi.</p>"
    ]
  }
}
```
## `/locations/kuala-lumpur/digital-lock`

英文正文 1753 字符 / 中文 860 汉字（4 段）

### English

```json
{"en": {
  "heading": "Digital Lock Installation in Kuala Lumpur",
  "area": "Kuala Lumpur",
  "service": "Digital Lock",
  "question": "Will a digital lock fit a Kuala Lumpur condo door?",
  "answer": "Usually, but the door has to be checked first: thickness, whether the existing lock is a mortise or rim type, whether the door closes squarely, and whether the building allows the door hardware to be changed at all. Some condos treat the main door as common property, so confirm with management before drilling.",
  "title": "Digital Lock Installation Kuala Lumpur | FLASH CAST",
  "description": "Digital lock installation in Kuala Lumpur condos and landed homes. Door compatibility and building approval checked first, then supply, installation, user enrolment and handover testing.",
  "keywords": "digital lock installation kuala lumpur, smart lock kl, digital lock condo door",
  "entityName": "Digital Lock Installation Kuala Lumpur",
  "bodyHeading": "Check the door and the building rules first",
  "body": [
    "<p>Kuala Lumpur condo doors vary more than people expect. Newer buildings often use fire-rated timber doors with a standard mortise preparation, which most digital locks can work with. Older buildings may have thinner doors, a rim lock, or a door that has already been trimmed and no longer closes squarely. Landed homes and shoplots add metal gates and glass doors into the mix, and each needs a different fixing method. None of this can be judged from a photo alone.</p>",
    "<p>Two approvals matter before any drilling. The first is the building's: some condos classify the main door and its hardware as common property, and changing the lock without approval can lead to a reinstatement order. The second is physical: if the cut-out has to be enlarged, the door loses material that cannot be added back, so the model has to match the existing preparation rather than the other way round. Both are checked on site, and the approach is confirmed in writing before work starts.</p>",
    "<p>The features worth paying for depend on how the household actually works. A rental unit needs easy re-issuing of access for each new tenant and a clear audit trail; a family home with elderly parents needs a physical key that still works when the battery is flat, and a PIN that is easy to read in low light. A lock with every feature but the wrong backset will not close, and a lock that needs a hub for remote access adds a device that has to stay powered.</p>",
    "<p>At handover, every user is enrolled and tested, the mechanical override is demonstrated, and the power-failure behaviour of that specific model is shown rather than described. Keep the override key outside the unit. If the lock later misbehaves, check the door alignment before suspecting the electronics.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "吉隆坡电子锁安装",
  "area": "吉隆坡",
  "service": "电子锁",
  "question": "吉隆坡公寓的门能装电子锁吗？",
  "answer": "通常可以，但要先看门：厚度、现有锁是 mortise 还是附加锁、门扇是否关得正，以及大楼是否允许更改门锁五金。部分公寓把大门视为公共财产，动钻之前先问管理处。",
  "title": "吉隆坡公寓电子锁安装｜门体兼容核对｜FLASH CAST",
  "description": "吉隆坡公寓与有地住宅电子锁安装。先核对门体兼容与大楼审批，再供应、安装、录入使用者并做交付测试。",
  "keywords": "吉隆坡电子锁安装, 智能门锁, 公寓门锁更换",
  "entityName": "吉隆坡电子锁安装",
  "bodyHeading": "先看门，再看大楼规定",
  "body": [
    "<p>吉隆坡公寓的门差异比多数人想的大。较新的大楼多用防火木门，锁孔是标准 mortise 做法，主流电子锁基本都能装。较老的楼可能有更薄的门、附加式（rim）锁，或者门扇已经被修整过、关不严——关不严的门装任何电子锁都会出问题，因为斜舌对不上锁扣。有地住宅与店屋还会混进铁门、玻璃门与推拉门，各自需要完全不同的固定与走线方式。这些都无法只看照片判断，必须到现场量门厚、看锁体、试关门。量门厚这件事听起来简单，但防火门常有饰面层，标称厚度与实际可用厚度差几毫米，就可能决定某个型号装不进去。</p>",
    "<p>动钻之前有两道关要过。第一道是大楼的：部分公寓把大门与门锁五金归为公共财产，未获批准就换锁，可能被要求恢复原状，而恢复一扇已经开过孔的门比换锁贵得多。第二道是物理的：如果锁孔需要扩大，门就少了材料、补不回来，所以必须让型号去匹配现有锁孔，而不是让门去迁就型号。这两项都在现场核对，做法在开工前书面确认，包括如果开孔后发现门芯材质不适合，如何止损。还有一类情况要提前说：如果大门与铁门都要换，两者要能配合使用，铁门的锁位与木门的门锁高度最好一起定，否则装完会发现开门顺序很别扭。</p>",
    "<p>值不值得花钱的功能，取决于这户人实际怎么用。出租单位需要能方便地为每个新租客重发权限、并在租客搬走后一键失效，同时留下清楚的开门记录；有年长父母的家庭需要电池耗尽时仍然能用的实体钥匙，以及弱光下也看得清的密码键盘；有小孩的家庭可能更在意门内反锁与防猫眼开启。功能齐全但锁边距（backset）不对的锁装上去关不严；需要额外网关才能远程的锁，等于多一个必须一直通电的设备，断电就等于失去远程功能，这一点在停电频繁的地区要提前想清楚。电池类型也值得问：碱性电池通常比充电电池撑得久，但更换时若是特殊规格，家里最好常备一组。</p>",
    "<p>交付时每位使用者都完成录入并实测，包括老人与小孩的手指能不能识别；演示机械应急开锁，并说明钥匙放在哪里；现场展示该型号在断电时的真实表现——是保持原状态、自动开还是自动锁，而不是口头说明。应急钥匙请放在单位之外的可靠位置，不要放在屋内抽屉。日后如果出现感应不灵或自动弹开，先查门扇是否下沉偏移、锁扣板是否松动，再怀疑电子部分，因为这类问题的实际原因多数在门上。最后建议保留一次上门记录，注明型号、安装日期与当时设定，日后换电池或加使用者时可以对照。</p>"
  ]
}}
```

---

## `/locations/selangor/office-renovation`

英文正文 1844 字符 / 中文 833 汉字（4 段）

### English

```json
{"en": {
  "heading": "Office Renovation in Selangor",
  "area": "Selangor",
  "service": "Office Renovation",
  "question": "What differs when fitting out an office in Selangor rather than KL?",
  "answer": "Selangor covers several local authorities with different submission processes, and many offices sit in shoplots or industrial buildings rather than purpose-built towers. That changes the fire requirements, the loading access and sometimes the parking provision, all of which affect the programme.",
  "title": "Office Renovation Selangor | Fit-Out | FLASH CAST",
  "description": "Office renovation and fit-out across Selangor, including shoplot offices, industrial buildings and purpose-built towers. Authority submission, fire requirements and zoning planned up front.",
  "keywords": "office renovation selangor, office fit out selangor, shoplot office renovation",
  "entityName": "Office Renovation Selangor",
  "bodyHeading": "Confirm which authority and which building type",
  "body": [
    "<p>Selangor is not one jurisdiction. A shoplot office in Petaling Jaya answers to MBPJ, one in Subang Jaya to MBSJ, one in Shah Alam to MBSA, and Klang to MPK. The submission requirements differ, and so does how strictly they are applied. Before the layout is fixed, confirm which authority covers the address and whether the intended use needs a change-of-use approval, because converting a shoplot unit into an office is not always permitted as-of-right.</p>",
    "<p>Building type decides the technical constraints. Shoplot offices often have limited floor-to-floor height, a single staircase serving several units, and fire requirements that assume the original use. Industrial buildings may allow a larger floor plate but impose loading, ventilation and compartmentation rules. Purpose-built offices usually have the clearest rules and the strictest management. Each of these changes what the partition layout, ceiling height and escape route can look like, so the design cannot be settled before the building category is known.</p>",
    "<p>Then the operational question: will the team work through the fit-out? If yes, the sequence is by zone, and the zoning has to follow how people actually work rather than how the plan divides. Naming the meeting rooms first and the workstations last is usually the wrong order. Loading access also matters more in Selangor than in a city tower, because shoplot frontages are shared and industrial estates often restrict heavy vehicle hours.</p>",
    "<p>At handover, check each zone against the agreed plan: power and data points where specified, air-conditioning not blowing directly onto seats, partitions reaching the ceiling as drawn, and doors closing without rubbing. Record outstanding items with a return date, and keep the as-built marked-up plan, because the next person to drill into a wall will need it.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "雪兰莪办公室装修",
  "area": "雪兰莪",
  "service": "办公室装修",
  "question": "在雪兰莪做办公室装修，与吉隆坡有什么不同？",
  "answer": "雪兰莪涉及多个地方政府，送审流程各不相同；而且不少办公室位于店屋或工业建筑里，而不是专门写字楼。这会影响消防要求、上料条件，有时还影响停车位配置，都会牵动工期。",
  "title": "雪兰莪办公室装修｜办公室精装｜FLASH CAST",
  "description": "雪兰莪办公室装修与精装，覆盖店屋办公室、工业建筑与专门写字楼。送审、消防要求与分区在前期一并规划。",
  "keywords": "雪兰莪办公室装修, 办公室精装, 店屋办公室装修",
  "entityName": "雪兰莪办公室装修",
  "bodyHeading": "先确认归哪个地方政府、属哪类建筑",
  "body": [
    "<p>雪兰莪不是一个管辖范围，这一点常常被忽略。八打灵再也的店屋办公室归 MBPJ，梳邦再也归 MBSJ，莎阿南归 MBSA，巴生归 MPK；送审表格、所需图纸与执行严格程度都不一样。在定布局之前，先确认这个地址归哪个地方政府，以及拟定用途是否需要用途变更（change of use）批准——店屋单位改成办公室并不总是当然允许的，有些区域只批零售或餐饮，改成办公室要额外申请，甚至可能不被接受。这一步问清楚，可以避免图纸做完才发现方向不对。查询时最好带上地契号与现有用途，柜台的答复会更具体，也能问清审批大约要多久。</p>",
    "<p>建筑类型决定技术约束。店屋办公室往往层高有限、几户共用一道楼梯，消防要求是按原用途设定的，一旦改变用途或增加隔间，疏散距离与出口数量就可能不达标；工业建筑能给出更大的楼面，但对荷载、通风与防火分区有额外规定，做办公用途需要说明人员密度与疏散方案；专门写字楼规则最清楚，管理也最严，反而最容易预估。这些都直接改变隔墙能不能做到顶、天花能做多低、疏散路线怎么走，所以在知道建筑类别之前，设计其实定不下来。如果建筑已有既存的违规隔间，也要一并处理，否则新图送审时会被要求先还原。</p>",
    "<p>接下来是运营问题：团队会不会在装修期间继续上班。如果会，施工就要按区域排序，而分区必须按人实际怎么工作来划，不能按图纸怎么分。先定会议室、最后定工位，通常是错的顺序，因为会议室可以临时借用别处，工位不行。上料条件在雪兰莪比市中心写字楼更要紧：店屋门面是共用的，白天卸货会挡住邻铺，工业区又常限制重型车辆通行时段。把这些排进计划，比事后临时协调省事得多。如果大楼有货梯或载重限制，材料要提前分装，否则整批板材到了才发现在楼下上不去。</p>",
    "<p>交付时按区域对照约定图纸核对，不要只看整体效果：电源与网络点位是否在指定位置、插座数量够不够、空调出风是否直吹座位、隔墙是否按图做到天花、门扇关闭是否顺畅不刮地。还要实际用一天再复看——很多问题只有在人坐进去、设备开起来之后才出现，例如网线端接不良、空调冷凝水倒流、灯光在屏幕上反光。未完成项目书面记录并约定返场日期，并保留标注过的竣工图，因为下一个要在墙上开洞装架子的人，会需要知道墙里有什么。如果办公室需要接网络专线，建议在装修收尾前就联系供应商到场测试，避免搬进去才发现线路不通。</p>"
  ]
}}
```

---

### Bahasa Melayu

马来文正文 1973 字符（4 段）

```json
{
  "ms": {
    "heading": "Pengubahsuaian Pejabat di Selangor",
    "area": "Selangor",
    "service": "Pengubahsuaian Pejabat",
    "question": "Apakah yang berbeza semasa mengubah suai pejabat di Selangor berbanding KL?",
    "answer": "Selangor merangkumi beberapa pihak berkuasa tempatan dengan proses penyerahan berbeza, dan banyak pejabat berada dalam kedai atau bangunan industri dan bukan menara khusus. Itu mengubah keperluan bomba, akses pemunggahan dan kadangkala peruntukan parkir, semuanya menjejaskan program.",
    "title": "Pengubahsuaian Pejabat Selangor | Kerja Ubah Suai | FLASH CAST",
    "description": "Pengubahsuaian dan kerja ubah suai pejabat di seluruh Selangor, termasuk pejabat kedai, bangunan industri dan menara khusus. Penyerahan pihak berkuasa, keperluan bomba dan pengezonan dirancang lebih awal.",
    "keywords": "pengubahsuaian pejabat selangor, kerja ubah suai pejabat selangor, pengubahsuaian pejabat kedai",
    "entityName": "Pengubahsuaian Pejabat Selangor",
    "bodyHeading": "Sahkan pihak berkuasa dan jenis bangunan",
    "body": [
      "<p>Selangor bukan satu bidang kuasa. Pejabat kedai di Petaling Jaya di bawah MBPJ, di Subang Jaya di bawah MBSJ, di Shah Alam di bawah MBSA, dan Klang di bawah pihak berkuasa tempatannya. Keperluan penyerahan berbeza, begitu juga ketegasan pelaksanaannya. Sebelum susun atur ditetapkan, sahkan pihak berkuasa mana yang meliputi alamat itu dan sama ada penggunaan yang dimaksudkan memerlukan kelulusan tukar guna, kerana menukar unit kedai menjadi pejabat tidak selalunya dibenarkan secara automatik.</p>",
      "<p>Jenis bangunan menentukan kekangan teknikal. Pejabat kedai selalunya mempunyai ketinggian siling ke siling terhad, satu tangga yang melayani beberapa unit, dan keperluan bomba yang menganggap penggunaan asal. Bangunan industri mungkin membenarkan plat lantai lebih besar tetapi mengenakan peraturan beban, pengudaraan dan pengasingan. Pejabat khusus biasanya mempunyai peraturan paling jelas dan pengurusan paling ketat. Setiap satu mengubah rupa susun atur sekatan, ketinggian siling dan laluan keluar, jadi reka bentuk tidak boleh dimuktamadkan sebelum kategori bangunan diketahui.</p>",
      "<p>Kemudian soalan operasi: adakah pasukan akan bekerja sepanjang kerja ubah suai? Jika ya, urutannya mengikut zon, dan pengezonan mesti mengikut cara orang benar-benar bekerja dan bukan cara pelan membahagikannya. Menamakan bilik mesyuarat dahulu dan stesen kerja terakhir biasanya urutan yang salah. Akses pemunggahan juga lebih penting di Selangor berbanding menara bandar, kerana fasad kedai dikongsi dan estet industri sering mengehadkan waktu kenderaan berat.</p>",
      "<p>Semasa serahan, periksa setiap zon terhadap pelan yang dipersetujui: titik kuasa dan data di tempat yang ditetapkan, penghawa dingin tidak bertiup terus ke tempat duduk, sekatan sampai ke siling seperti dilukis, dan pintu menutup tanpa bergesel. Rekod item tertunggak dengan tarikh kembali, dan simpan pelan bertanda sebagaimana-dibina, kerana orang seterusnya yang menggerudi dinding akan memerlukannya.</p>"
    ]
  }
}
```
## `/locations/petaling-jaya/landed-house-renovation`

英文正文 1902 字符 / 中文 813 汉字（4 段）

### English

```json
{"en": {
  "heading": "Landed House Renovation in Petaling Jaya",
  "area": "Petaling Jaya",
  "service": "Landed House Renovation",
  "question": "What matters most when renovating an older Petaling Jaya terrace?",
  "answer": "Confirm what has already been altered and whether it was approved. PJ's older sections have had decades of piecemeal extensions, and undocumented work is the most common reason a new submission is rejected or a quotation changes mid-project.",
  "title": "Landed House Renovation Petaling Jaya | FLASH CAST",
  "description": "Landed house renovation in Petaling Jaya for terraces and semi-detached homes from the 1960s to 1980s. Existing alterations, structure and services reviewed before design.",
  "keywords": "landed house renovation petaling jaya, terrace house renovation pj, house renovation ss",
  "entityName": "Landed House Renovation Petaling Jaya",
  "bodyHeading": "Establish the existing condition before designing",
  "body": [
    "<p>Petaling Jaya's older residential sections — the SS areas, Section 17, Section 13 — contain terraces and semi-detached homes built between the 1960s and the 1980s. Many have been extended at least once, often without drawings, and sometimes across two or three owners. That history is the single biggest variable in a renovation. Before any design work, establish what is original, what was added, and whether the additions were approved, because an unapproved structure has to be either regularised or removed before new work can be submitted.</p>",
    "<p>Bring whatever documents exist: the original title plan, previous renovation drawings, and any correspondence with MBPJ. Then walk the house with a focus on the structure rather than the finishes: footing cracks, sagging roof lines, walls that were removed without a beam, and floors that slope in a way the original builder would not have built. These are the items that decide whether the project is a refurbishment or a rebuild of parts.</p>",
    "<p>The services are the second variable. Homes of this age usually still have their original wiring, and it was sized for a fraction of today's load. Single-phase supply, two or three air-conditioning units and no earth leakage protection on some circuits is a common starting point. The plumbing is often a mix of original and repaired sections, which makes leak tracing harder than replacing outright. Budget for the services honestly rather than discovering them after the finishes go on.</p>",
    "<p>At handover, walk every room against the written scope, test outlets, taps and drainage, check the junctions between old and new structure for seepage, and confirm the roof drains away from the house rather than toward it. Record defects with a return date and keep the photographs of concealed work, because in a house that has been altered three times, those photographs are the only reliable record.</p>"
  ]
}}
```

### 中文

```json
{"zh": {
  "heading": "八打灵再有地住宅装修",
  "area": "八打灵再也",
  "service": "有地住宅装修",
  "question": "八打灵再也的老排屋翻新，最要紧的是什么？",
  "answer": "先确认这栋房子以前改过什么、有没有审批。PJ 的老区经历了几十年的零散扩建，没有记录的改动，是新送审被拒或报价中途变动的常见原因。",
  "title": "八打灵再有地住宅装修｜排屋翻新｜FLASH CAST",
  "description": "八打灵再也 1960 至 1980 年代排屋与半独立式的翻新。设计之前先查既有改动、结构与水电状况。",
  "keywords": "八打灵再有地住宅装修, 排屋翻新, 老屋改造 PJ",
  "entityName": "八打灵再有地住宅装修",
  "bodyHeading": "设计之前先弄清现状",
  "body": [
    "<p>八打灵再也的老住宅区——SS 系列、Section 17、Section 13——多为 1960 至 1980 年代建的排屋与半独立式。这些房子很多至少扩建过一次，常常没有图纸，有时还跨了两三个业主，中间每一次改动都可能是不同承包商按不同标准做的。这段历史是翻新中最大的变量，也是最容易被低估的。设计之前先弄清三件事：哪些是原装、哪些是后加、加的部分有没有审批。因为没有审批的结构，在新工程送审之前必须合法化或拆除，这一步没有捷径，也不能靠「做都做了」蒙过去。判断时看接缝最有效：新旧墙体的灰泥颜色、砖的规格与地坪高度往往不一致，一眼就能看出接在哪里。</p>",
    "<p>有什么文件都带上：原始地契图、以前的装修图、与 MBPJ 的往来文件、以及交屋时的验屋报告。然后走一遍房子，重点看结构而不是收口：基础有没有裂缝或沉降、屋脊线是否下陷、有没有拆过却没加梁的墙、地面有没有以原建商不会做出的方式倾斜。这些决定这个项目属于「翻新」还是「部分重建」——前者按装修报价，后者要按结构工程报价，预算量级不同。走这一遍大概半小时，但它决定后面所有讨论的前提。如果发现明显的结构疑点，值得请结构工程师出一份简短意见，这笔钱通常比事后修补便宜得多。</p>",
    "<p>水电是第二个变量。这个年代的房子通常还是原装线路，而且是按今天负荷的一小部分设计的：单相供电、两三条回路、部分回路没有漏电保护，是很常见的起点。这意味着加空调、加烤箱、加即热式热水器都不能简单地「接上去」。水管往往是原装与修补混杂，找漏点比整段更换更难，也更不确定。请把水电预算做足，宁可多留，也不要等收口做完才发现要开墙——那时候瓷砖、油漆与柜体都要重做一遍。一个实用的判断标准是：如果这栋房子从没换过总电，而你要加两台以上空调，基本就该考虑升级，而不是逐台硬接。</p>",
    "<p>交付时按书面范围逐房走、测试所有插座龙头与排水、检查新旧结构交接处有没有渗水、确认屋顶的水是往外排而不是朝房子方向排。门窗开合、地面平整、墙面裂缝都要看。缺陷书面记录并约定返场日期，并保留隐蔽工程照片：电线怎么走、水管在哪里、防水做到多高。在一栋改过三次的房子里，那些照片是唯一可靠的记录，也是下一次装修时最省钱的资料。最后建议把本次施工的范围、日期与承包商联系方式一并归档，日后转手或出租时，这些都是能拿得出手的证明。</p>"
  ]
}}
```

### Bahasa Melayu

马来文正文 1981 字符（4 段）

```json
{
  "ms": {
    "heading": "Pengubahsuaian Rumah Bertanah di Petaling Jaya",
    "area": "Petaling Jaya",
    "service": "Pengubahsuaian Rumah Bertanah",
    "question": "Apakah yang paling penting semasa mengubah suai teres lama di Petaling Jaya?",
    "answer": "Sahkan apa yang sudah diubah dan sama ada ia diluluskan. Bahagian lama PJ telah melalui beberapa dekad pembesaran berperingkat, dan kerja tanpa dokumen ialah sebab paling biasa sesuatu penyerahan baharu ditolak atau sebut harga berubah di tengah projek.",
    "title": "Pengubahsuaian Rumah Bertanah Petaling Jaya | FLASH CAST",
    "description": "Pengubahsuaian rumah bertanah di Petaling Jaya untuk teres dan rumah separa berasingan dari era 1960-an hingga 1980-an. Ubah suai sedia ada, struktur dan perkhidmatan disemak sebelum reka bentuk.",
    "keywords": "pengubahsuaian rumah bertanah petaling jaya, pengubahsuaian rumah teres pj, pengubahsuaian rumah ss",
    "entityName": "Pengubahsuaian Rumah Bertanah Petaling Jaya",
    "bodyHeading": "Tetapkan keadaan sedia ada sebelum mereka bentuk",
    "body": [
      "<p>Bahagian kediaman lama Petaling Jaya — kawasan SS, Seksyen 17, Seksyen 13 — mengandungi teres dan rumah separa berasingan yang dibina antara era 1960-an dan 1980-an. Banyak yang telah dibesarkan sekurang-kurangnya sekali, sering tanpa lukisan, dan kadang-kadang merentas dua atau tiga pemilik. Sejarah itu ialah pemboleh ubah terbesar dalam pengubahsuaian. Sebelum apa-apa kerja reka bentuk, tetapkan apa yang asli, apa yang ditambah, dan sama ada tambahan itu diluluskan, kerana struktur tanpa kelulusan mesti sama ada disahkan atau dibuang sebelum kerja baharu boleh diserahkan.</p>",
      "<p>Bawa apa-apa dokumen yang ada: pelan hakmilik asal, lukisan pengubahsuaian terdahulu, dan sebarang surat menyurat dengan MBPJ. Kemudian periksa rumah dengan tumpuan pada struktur dan bukan kemasan: retak asas, garis bumbung melendut, dinding yang dibuang tanpa rasuk, dan lantai yang condong dengan cara pembina asal tidak akan membinanya. Inilah item yang menentukan sama ada projek itu pemulihan atau pembinaan semula sebahagian.</p>",
      "<p>Perkhidmatan ialah pemboleh ubah kedua. Rumah seusia ini biasanya masih mempunyai pendawaian asal, dan ia disaiz untuk sebahagian kecil beban hari ini. Bekalan fasa tunggal, dua atau tiga unit penghawa dingin dan tiada perlindungan arus bocor pada sesetengah litar ialah titik mula yang biasa. Paip pula sering campuran bahagian asal dan bahagian yang telah dibaiki, yang menjadikan pengesanan kebocoran lebih sukar daripada menggantinya sepenuhnya. Belanjawankan perkhidmatan dengan jujur dan bukan menemukannya selepas kemasan dipasang.</p>",
      "<p>Semasa serahan, periksa setiap bilik terhadap skop bertulis, uji alur keluar, paip dan saliran, periksa persimpangan antara struktur lama dan baharu untuk resapan, dan sahkan bumbung mengalir keluar dari rumah dan bukan ke arahnya. Rekod kecacatan dengan tarikh kembali dan simpan gambar kerja tersembunyi, kerana dalam rumah yang telah diubah tiga kali, gambar itu satu-satunya rekod yang boleh diharap.</p>"
    ]
  }
}
```
