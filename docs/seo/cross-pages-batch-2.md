# 交叉页扩展：7 个新组合（中英）

> 追加到 `src/components/services/serviceAreaPageText.json`，与现有 5 个组合并列。
> 结构对齐现有 5 页：10 个字段 + 4 段正文。
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

## 需要同步改的三个代码位置

1. `src/lib/serviceAreaRoutes.ts` —— 白名单加这 7 个组合
2. `scripts/seo-static-pages.mjs` —— `staticDefs` 加 14 条（7 组合 × en/zh）
3. `docs/interaction-route-compliance.json` —— 无需新增，`/:lang/locations/:area/:service` 条目已存在

---

## `/locations/kuala-lumpur/condo-renovation`

英文正文 1875 字符 / 中文 446 汉字（4 段）

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
  "answer": "先确认管理处的要求：申请文件、押金、允许施工时段、货梯预约与公共区域保护。再决定哪些保留、哪些改动，因为大楼规定对工期的影响比设计更大。",
  "title": "吉隆坡公寓装修｜管理处审批｜FLASH CAST",
  "description": "吉隆坡公寓装修，覆盖 1990 年代到近年的单位。格局、收纳、电气与空调工程，按管理处规定与结构限制规划。",
  "keywords": "吉隆坡公寓装修, 公寓翻新, 公寓管理处审批",
  "entityName": "吉隆坡公寓装修",
  "bodyHeading": "先看大楼允许做什么，再谈怎么改",
  "body": [
    "<p>吉隆坡的公寓横跨三个年代的建筑，各自表现不同。1990 年代的单位通常排水立管固定、电容量有限，浴室防水多半已经重做过一次；2000 年之后的大楼在机电上宽松些，但管理流程更严。无论哪一代，结构墙、外观与湿区位置基本不能动，所以工程重点在格局、收纳、机电与收口，而不是扩建。</p>",
    "<p>报价请从清单开始，而不是从愿望开始：哪些房间要改用途、哪些固定件保留、厨房或浴室要不要移位、需要增加多少电源与网络点位。并要求把拆除、泥水、木作、电气、空调与油漆分开列项。一个笼统总价会藏住哪些是暂定项目，而在公寓里，暂定项目往往正是被管理处审批拖住的那几项。</p>",
    "<p>最容易出错、代价最高的是浴室。移动浴室意味着重做排水，要么抬高地面、要么在楼板上开洞，两者都需要审批，也都会影响楼下。如果格局不动，更省钱也更可靠的做法是趁瓷砖拆掉时把防水彻底重做，而不是局部修补再赌一次。厨房同理：水槽移位通常可行，灶台与抽油烟机移位通常不行。</p>",
    "<p>开工前先把交付清单谈定。逐个插座与开关测试、每个龙头放水后等几分钟看可见接头、确认空调冷凝水是排走而不是渗进天花、检查门扇与抽屉是否按约定闭合。缺陷书面记录并约定返场日期，同时确认管理处在退还押金前需要哪些手续。</p>"
  ]
}}
```

---

## `/locations/petaling-jaya/kitchen-renovation`

英文正文 1909 字符 / 中文 479 汉字（4 段）

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
    "<p>八打灵再也的厨房通常是在较老的建筑外壳里作业。排水立管固定在当年建商放的位置，进电容量是按远小于现在的电器负荷设计的，厨房窗户或工作阳台决定台面能延伸多长。在画任何橱柜之前，先确认水槽排水实际能接到哪里、这户能支撑几个独立回路。电磁炉、嵌入式烤箱与烘干机各自需要独立回路，而 1990 年代的配电箱很少有备用位。</p>",
    "<p>第一次讨论请带照片、平面图与电器清单，并标出打算保留的现有项目。在 PJ，最值得保留的通常是地砖与工作阳台的门；最不值得保留的是原装柜体，拆第二次基本就散了。请要求报价把拆除、水电、电气、柜体、台面与安装分开列项，这样日后改动其中一项不会牵动其他。</p>",
    "<p>要早定的布局问题是：厨房保持单排，还是改成 L 型或 U 型。单排成本低、适合窄单位，但收纳吃亏。L 型多出一个转角操作面，代价是一个盲柜，所以转角方案比看起来更重要。如果单位在工作阳台有湿厨房，要先决定重油烟烹饪是否留在那里——这个决定会改变排烟路线、防水范围，以及两侧各自的电点位数量。</p>",
    "<p>交付时把每个抽屉完全拉开，确认不会撞到墙或冰箱；水槽放水后等几分钟看存水弯接头；每个电器分别在自己的回路上单独测试，而不是一次全开；确认抽油烟机是真的在排风。需要补做的项目书面记录并约定返场日期，同时把电器说明书与报价单放在一起保存。</p>"
  ]
}}
```

---

## `/locations/cheras/condo-renovation`

英文正文 1811 字符 / 中文 387 汉字（4 段）

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
    "<p>蕉赖有两种表现完全不同的公寓。Taman Maluri、Taman Pertama、Taman Midah 一带 1990 至 2000 年代初的楼，当初按较小负荷设计，电点位少，浴室防水大多至少修补过一次。往 Sungai Besi 与 Cheras Selatan 方向的新楼机电条件更好，但管理处对装修规定的执行更一致。第一次上门就是判断这户属于哪一类，因为范围和风险完全不同。</p>",
    "<p>旧楼要先问：电容量多少、进线状况如何、水管是否还是原装。新楼要先问管理处：装修申请要交什么、押金多少、允许时段、货梯怎么预约。这两组答案都要以「假设」的形式写进报价，这样一旦某一项判断错了，变更是看得见的，而不是被默默吸收进总价。</p>",
    "<p>蕉赖公寓最常出现的昂贵意外是浴室。旧楼里防水多是局部修补过，地面可能已经被抬高过一次，既压缩净高也影响排水坡度；新楼浴室通常没问题，但布局很紧，于是容易想动一堵其实是结构的墙。这两件事都必须在拆除之前确认，不是之后。</p>",
    "<p>交付时每间浴室放水后等几分钟看接头、逐个插座与开关测试、确认空调冷凝水排得出去。缺陷书面记录并约定返场日期，管理处的押金退还流程要在付最后一笔款之前谈定，因为那是最常拖住结案的一项。</p>"
  ]
}}
```

---

## `/locations/subang-jaya/landed-house-renovation`

英文正文 1765 字符 / 中文 400 汉字（4 段）

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
    "<p>梳邦再的排屋与半独立式大多建于 1980 至 2000 年间，也就是说原装线路、水管与屋顶都已经到或过了预期寿命。设计任何扩建之前，先检查现有结构：基础状况、之前的改动是否带审批、屋顶能不能承担新增荷载。把扩建接到一个已经在漏的屋顶上，只是把问题往里挪。</p>",
    "<p>如果有原图请带上，另外准备各个立面与后巷的现状照片。在定稿之前先确认 MBSJ 的退线与覆盖率要求，因为这两个数字决定扩建能加多少面积。实际操作中，很多家庭会发现真正的约束是地块覆盖率，而不是预算。先把这个问题问清楚，可以省下一次重画。</p>",
    "<p>这里的工序顺序比公寓更要紧：先屋顶与结构，再电线水管，再泥水与防水，然后木作，最后油漆。顺序反过来，就会出现「新漆刷完，墙又因为漏水管被打开」的情况。如果家人在施工期间继续居住，要先定哪些出入口、厨房与浴室保持可用，并确认这个临时安排撑得过泥水阶段。</p>",
    "<p>交付时按书面范围逐房核对、逐个插座与龙头测试、浴室放水后等几分钟看接头、扩建与原屋的交接处检查渗水。头几个月出现沉降裂缝是正常的，下次补漆时一并处理。请保留竣工图与隐蔽工程照片。</p>"
  ]
}}
```

---

## `/locations/kuala-lumpur/digital-lock`

英文正文 1753 字符 / 中文 430 汉字（4 段）

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
  "title": "吉隆坡电子锁安装｜智能门锁｜FLASH CAST",
  "description": "吉隆坡公寓与有地住宅电子锁安装。先核对门体兼容与大楼审批，再供应、安装、录入使用者并做交付测试。",
  "keywords": "吉隆坡电子锁安装, 智能门锁, 公寓门锁更换",
  "entityName": "吉隆坡电子锁安装",
  "bodyHeading": "先看门，再看大楼规定",
  "body": [
    "<p>吉隆坡公寓的门差异比多数人想的大。较新的大楼多用防火木门，锁孔是标准 mortise 做法，多数电子锁都能装。较老的楼可能有更薄的门、附加锁，或者门已经被修整过、关不严。有地住宅与店屋还会混进铁门和玻璃门，各自需要不同的固定方式。这些都无法只看照片判断。</p>",
    "<p>动钻之前有两道关要过。第一道是大楼的：部分公寓把大门与门锁五金归为公共财产，未获批准就换锁，可能被要求复原。第二道是物理的：如果锁孔需要扩大，门就少了材料、补不回来，所以必须让型号去匹配现有锁孔，而不是反过来。两项都在现场核对，做法在开工前书面确认。</p>",
    "<p>值不值得花钱的功能，取决于这户人实际怎么用。出租单位需要能方便地为每个新租客重发权限、并留下清楚的开门记录；有年长父母的家庭需要电池耗尽时仍然能用的实体钥匙，以及弱光下也看得清的密码。功能齐全但锁边距不对的锁装上去关不严；需要额外网关才能远程的锁，等于多一个必须一直通电的设备。</p>",
    "<p>交付时每位使用者都完成录入并实测、演示机械应急开锁、现场展示该型号在断电时的真实表现而不是口头说明。应急钥匙请放在单位之外。日后如果出现异常，先查门扇是否偏移，再怀疑电子部分。</p>"
  ]
}}
```

---

## `/locations/selangor/office-renovation`

英文正文 1844 字符 / 中文 440 汉字（4 段）

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
    "<p>雪兰莪不是一个管辖范围。八打灵再也的店屋办公室归 MBPJ，梳邦再也归 MBSJ，莎阿南归 MBSA，巴生归 MPK；送审要求不同，执行严格程度也不同。在定布局之前，先确认这个地址归哪个地方政府，以及拟定用途是否需要用途变更批准——店屋单位改成办公室并不总是当然允许的。</p>",
    "<p>建筑类型决定技术约束。店屋办公室往往层高有限、几户共用一道楼梯，消防要求是按原用途设定的；工业建筑能给出更大的楼面，但对荷载、通风与防火分区有额外规定；专门写字楼规则最清楚，管理也最严。这些都会改变隔墙布局、天花高度与疏散路线，所以在知道建筑类别之前，设计定不下来。</p>",
    "<p>接下来是运营问题：团队会不会在装修期间继续上班。如果会，就要按区域排序，而分区必须按人实际怎么工作来划，而不是按图纸怎么分。先定会议室、最后定工位，通常是错的顺序。雪兰莪的上料条件也比市中心写字楼更要紧，因为店屋门面是共用的，工业区又常限制重型车辆通行时段。</p>",
    "<p>交付时按区域对照约定图纸核对：电源与网络点位是否在指定位置、空调是否直吹座位、隔墙是否按图做到天花、门扇关闭是否顺畅不刮。未完成项目书面记录并约定返场日期，并保留标注过的竣工图，因为下一个要在墙上开洞的人会需要它。</p>"
  ]
}}
```

---

## `/locations/petaling-jaya/landed-house-renovation`

英文正文 1902 字符 / 中文 425 汉字（4 段）

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
    "<p>八打灵再也的老住宅区——SS 系列、Section 17、Section 13——多为 1960 至 1980 年代建的排屋与半独立式。很多房子至少扩建过一次，常常没有图纸，有时还跨了两三个业主。这段历史是翻新中最大的变量。设计之前先弄清哪些是原装、哪些是后加、加的部分有没有审批，因为没有审批的结构，在新工程送审之前必须合法化或拆除。</p>",
    "<p>有什么文件都带上：原始地契图、以前的装修图、以及与 MBPJ 的往来文件。然后走一遍房子，重点看结构而不是收口：基础有没有裂缝、屋脊有没有下陷、有没有拆过却没加梁的墙、地面有没有以原建商不会做出的方式倾斜。这些决定这个项目是「翻新」还是「部分重建」。</p>",
    "<p>水电是第二个变量。这个年代的房子通常还是原装线路，而且是按今天负荷的一小部分设计的。单相供电、两三台空调、部分回路没有漏电保护，是很常见的起点。水管往往是原装与修补混杂，找漏点比整段更换更难。请把水电预算做足，而不是等收口做完才发现。</p>",
    "<p>交付时按书面范围逐房走、测试插座龙头与排水、检查新旧结构交接处有没有渗水、确认屋顶的水是往外排而不是往房子方向排。缺陷书面记录并约定返场日期，并保留隐蔽工程照片——在一栋改过三次的房子里，那些照片是唯一可靠的记录。</p>"
  ]
}}
```

