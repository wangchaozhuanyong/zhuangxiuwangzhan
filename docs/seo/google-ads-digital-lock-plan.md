# 电子锁 Google Ads 竞价推广方案（KL / Selangor）

> 制定：2026-11-23
> 市场：Kuala Lumpur、Selangor、Klang Valley
> 产品：ANZHE 电子锁 17 款，含安装 RM635.20–RM2,960
> 站点资产：主站 20 个区域页 + 子域 72 页
> 目标：WhatsApp 咨询与表单线索

---

## 零、先泼一盆冷水

现在直接开户投钱，效果会很差。原因不是方案问题，是**三个基础设施还缺**：

| # | 缺什么 | 后果 |
|---|---|---|
| 1 | **转化追踪没做** | 不知道哪个词带来咨询，钱全凭感觉烧 |
| 2 | **WhatsApp 点击没有事件** | 唯一的转化路径无法归因 |
| 3 | **落地页没有表单**（子域只有 WhatsApp） | 移动端用户懒得跳转 App，直接流失 |

**没这三样就投，等于闭眼开车。** 下面第一节就是补这三样，一天能做完。

---

## 一、投前必做（1 天）

### 1.1 转化追踪

| 转化动作 | 实现方式 | 价值 |
|---|---|---|
| WhatsApp 点击 | `gtag('event','conversion',{send_to:'AW-XXX/label'})` 挂在所有 `wa.me` 链接 | 主转化 |
| 电话点击 | `tel:` 链接同样埋 | 次转化 |
| 表单提交 | 主站 `submit-lead` 成功后触发 | 主转化 |
| 页面停留 >60s | GA4 事件（观察用，不算转化） | 辅助 |

做法：

1. GA4 建属性，拿 `G-XXXX`
2. Google Ads 关联 GA4
3. Ads 里建「WhatsApp 点击」「表单提交」两个转化动作，主转化设「WhatsApp 点击」
4. 子域 72 页的 WhatsApp 按钮加事件（这是代码改动，交 Codex，半小时）

**没有转化数据的前两周，出价策略只能用手动 CPC。**

### 1.2 落地页体检

移动端 390 宽，从点击广告到发出 WhatsApp 消息，必须在 **3 步以内**：

```
广告 → 落地页（首屏有价格 + 有 WhatsApp 按钮）→ 点开 WhatsApp 发送成功
```

现在的子域型号页：首屏有价格、有悬浮 WhatsApp 按钮 ✅
现在的主站服务页：首屏有 CTA，但表单在页面下方 ⚠️
现在的区域页：纯文字，无 WhatsApp ⚠️

**结论：搜索广告落地页优先用子域型号页与品类页，不用区域页。**

### 1.3 号码与响应

广告点击进来的用户，WhatsApp 消息必须有人 10 分钟内回。

营业时间 10:00–19:00，广告时段就锁在这个区间。19 点后的点击是浪费钱。

---

## 二、账户结构

不要把所有词塞一个广告组。按意图分三层：

```
账户
├─ 01 品类词（搜索）
│   ├─ 广告组：digital lock malaysia
│   ├─ 广告组：digital door lock kl
│   └─ 广告组：kunci digital
├─ 02 型号词（搜索）
│   ├─ 广告组：ANZHE 品牌型号
│   └─ 广告组：功能型号（face / palm vein / aluminium）
├─ 03 地域词（搜索）
│   ├─ 广告组：KL 各区
│   └─ 广告组：Selangor 各区
├─ 04 竞对词（搜索）★灰
│   └─ 广告组：Yale / Samsung / Kaadas / Philips
├─ 05 品牌自保（搜索）
│   └─ 广告组：ANZHE / FLASH CAST
└─ 06 再营销（展示 + 搜索）
```

每个广告组 5–15 个关键词，落地页一一对应。

---

## 三、关键词地图

### 3.1 品类词（搜索量最大，竞争最贵）

| 关键词 | 匹配 | 预估 CPC | 优先级 |
|---|---|---|---|
| digital lock malaysia | 广泛+否定 | RM3–6 | 高 |
| digital door lock malaysia | 词组 | RM3–5 | 高 |
| digital lock kuala lumpur | 词组 | RM2–4 | **最高** |
| digital lock kl | 词组 | RM2–4 | 高 |
| smart lock malaysia | 词组 | RM2–5 | 中 |
| kunci digital malaysia | 词组 | RM1–3 | 高 |
| kunci pintu digital | 词组 | RM1–3 | 高 |
| harga kunci digital | 词组 | RM1–2 | 中 |

### 3.2 型号与功能词（便宜，转化高）

| 关键词 | 匹配 | 预估 CPC |
|---|---|---|
| face recognition door lock malaysia | 词组 | RM1.5–3 |
| palm vein door lock | 词组 | RM1–2 |
| digital lock for aluminium door | 词组 | RM0.8–2 |
| narrow frame digital lock | 词组 | RM0.8–1.5 |
| door lock with camera malaysia | 词组 | RM1.5–3 |
| digital lock with video intercom | 词组 | RM1.5–3 |
| fingerprint door lock malaysia | 词组 | RM1.5–3 |

### 3.3 地域词（最便宜，转化最好）

`{区名} + digital lock` 组合，20 个区 × 3 语。

建议只投转化概率高的 10 个区：Mont Kiara、Bangsar、PJ、Cheras、Subang Jaya、Puchong、Damansara、Sri Petaling、Bukit Jalil、Kepong。

预估 CPC：RM0.8–2。

### 3.4 否定词表（第一周就要建，不然钱白烧）

```
diy, tutorial, how to install, repair, review, cheap second hand,
job, vacancy, salary, course, training, pdf, software, app,
hotel, office access control, rfid card, gate motor, autogate,
yale, samsung  ← 前两周先排除竞品词，等账户跑稳再单独开
```

---

## 四、出价与预算

### 4.1 起步预算

| 阶段 | 日预算 | 说明 |
|---|---|---|
| 第 1–2 周 | RM100 | 只跑品类 + 地域，收集数据 |
| 第 3–4 周 | RM150 | 加型号词与竞对词 |
| 第 5 周起 | RM200–300 | 看单条线索成本决定加不加 |

按 CPC RM2、转化率 5% 估算：RM100/天 ≈ 50 次点击 ≈ 2.5 条线索/天，单条线索成本约 RM40。

**这个数字要验证**，不能当成承诺。

### 4.2 出价策略

```
第 1–2 周   手动 CPC，上限设为预估 CPC 的 1.3 倍
第 3–4 周   有 15 条转化后转「尽可能争取更多转化」
第 5 周起   转 tCPA，目标设为实际单条线索成本的 1.2 倍
```

不要一上来就用智能出价。没有转化数据，智能出价会乱烧。

### 4.3 地域与时段

- 地域：Kuala Lumpur + Selangor，**「所在地」而不是「兴趣所在地」**
- 时段：每天 10:00–19:00（与营业时间一致）
- 设备：移动端出价 +20%（多数咨询来自手机）
- 排除：Waze / 合作网站展示位（默认会带上，关掉）

---

## 五、广告文案

### 5.1 通用结构

```
标题 1（含关键词）：Digital Lock Kuala Lumpur
标题 2（含价格）：From RM635.20 Installed
标题 3（含信任）：ANZHE · 17 Models · Same-Day Quote
描述 1：Palm vein, face and fingerprint locks. Installation included,
        door thickness checked first. WhatsApp for model advice.
描述 2：KL & Selangor. Free door compatibility check before drilling.
        17 models from RM635.20 including installation.
```

### 5.2 附加信息全填（CTR 提升最明显的一项）

| 类型 | 内容 |
|---|---|
| 附加链接 ×6 | 入户门 / 室内门 / 铝门 / 人脸 / 掌静脉 / 可视对讲 |
| 附加宣传信息 ×4 | 含安装价 / 装前核对门体 / 17 款可选 / KL 雪兰莪上门 |
| 结构化摘要 | 型号：17 · 类型：入户门、室内门、铝门 · 价格：RM635.20 起 |
| 图片扩展 | 用 `assets/p-v37j-p16.webp` 等产品图 |
| 电话扩展 | +60 11-2885 3888 |
| 地址扩展 | 关联 GBP（已开通，直接挂） |

### 5.3 马来语文案单独一组

不要用英文文案跑马来语关键词。语言不匹配会压低质量得分，CPC 变贵。

```
Tajuk 1: Kunci Digital Kuala Lumpur
Tajuk 2: Dari RM635.20 Termasuk Pasang
Tajuk 3: ANZHE · 17 Model · Harga Telus
Huraian: Cap jari, wajah dan vena tapak tangan. Harga sudah termasuk
         pemasangan. Ketebalan pintu diperiksa dahulu. WhatsApp kami.
```

---

## 六、落地页对应

| 广告组 | 落地页 | 为什么 |
|---|---|---|
| 品类词 | `/zh/services/digital-lock`（或 en） | 覆盖面广，有 16 个内链 |
| 型号/功能词 | 对应子域品类页 | 内容精准，有价格 |
| 地域词 | 对应子域型号页 + 主站区域页 A/B | 观察哪个转化更好 |
| 竞对词 | 子域首页或对比页 | 强调价格与安装 |
| 品牌自保 | 子域首页 | — |

**A/B 方法**：同一个广告组分两个广告，落地页不同，跑两周看哪个转化率高。

---

## 七、灰区手法（不封号，但比常规激进）

以下都是 Google 明确允许或未禁止的，只是多数人不做或做得糙。

### 7.1 竞对品牌词截流

投 `Yale digital lock`、`Samsung digital lock`、`Kaadas malaysia`、`Philips digital lock`。

规则：

- **广告标题和描述里不能出现对方商标**（会出现商标投诉，广告被拒）
- 可以出现在关键词里（马来西亚允许）
- 落地页可以写「见 vs 对比」，但不能虚构对方缺点

效果：竞对词 CPC 通常只有品类词的一半，转化意图极强。

### 7.2 价格钩子（真实的最低价）

广告标题用 `From RM635.20 Installed`，落地页首屏就是这一档。

RM635.20 是 G13 室内门锁的真实含安装价，不是虚构原价。**用最低价做钩子，落地页必须有对应型号，不能点进去找不到。**

### 7.3 再营销三层堆叠

```
层 1：看过型号页但没点 WhatsApp（7 天窗口）→ 展示广告追
层 2：点过 WhatsApp 但没发消息（3 天窗口）→ 搜索广告加价
层 3：发过消息但没成交（30 天窗口）→ 展示广告讲保修与安装
```

再营销 CPC 通常只有新客的 1/3。

### 7.4 品牌词自保 + 低价

投自己的品牌词 `ANZHE`、`FLASH CAST digital lock`，CPC RM0.3–0.8。

作用不是拉新，是防止竞对投你的品牌词时用户被截走。成本极低，必做。

### 7.5 竞对词的「比较页」落地

建一个对比页面：`ANZHE vs Yale vs Samsung digital lock price Malaysia`。

只在事实层面比较（价格、开锁方式、是否含安装、屏幕尺寸），不贬低对方。这类页面既能做 Ads 落地，也能做自然搜索。

### 7.6 展示网络的「相似受众」

从 WhatsApp 转化人群建相似受众，投展示网络，出价压到搜索的 60%。

展示网络转化差但曝光便宜，用来做再营销的上游蓄水。

### 7.7 广告排期激进

把预算集中在周五到周日、以及每晚 18:00–21:00（家庭决策时段）。周一到周四白天压到最低。

---

## 八、绝对不碰（会封号，且申诉不回来）

| 手法 | 后果 |
|---|---|
| 自己点广告 / 找人点 | 账号永久封停，关联账户一起封 |
| 落地页对 Google 与用户显示不同内容 | 账号封停 + 站点被标记 |
| 广告文案写竞对商标 | 广告拒登，累计多次账号受限 |
| 虚假地址 / 虚拟办公室做本地广告 | 商家验证失败，广告账户连带受限 |
| 假倒计时、假原价、假库存 | 误导性内容，账号受限 |
| 落地页 404 或内容与广告不符 | 质量得分归零，CPC 翻倍，最终拒登 |
| 用多个账号绕开被封的账户 | 关联识别，全部封停 |

**这几条不是"风险高"，是"碰了就结束"。** Google Ads 的封号是账号级、支付方式级、甚至域名级的，换个账号重开也会被关联。

真正「不正规又没事」的空间，全部集中在第七节那七条里——**没有一条需要欺骗系统**。

---

## 九、90 天节奏

```
第 1 周    转化追踪上线 → 开户 → 只投品类词与地域词（RM100/天）
第 2 周    加型号词 → 否定词表补到 100 个 → 关掉低效广告组
第 3 周    开竞对词与品牌自保 → 有 15 条转化后转智能出价
第 4 周    首次复盘：单条线索成本、词级转化、落地页 A/B 结果
第 5–8 周  加再营销三层 → 落地页按 A/B 结果收敛 → 预算加到 RM200
第 9–12 周 稳定期，只做三件事：砍无效词、加否定词、调出价
```

---

## 十、KPI

| 指标 | 第 30 天 | 第 60 天 | 第 90 天 |
|---|---|---|---|
| 点击 | 1,200 | 2,500 | 4,000 |
| CTR | ≥4% | ≥5% | ≥6% |
| 单次点击成本 | ≤RM2.5 | ≤RM2.2 | ≤RM2.0 |
| 转化数（WhatsApp + 表单） | 30 | 80 | 150 |
| 单条线索成本 | ≤RM70 | ≤RM55 | ≤RM40 |
| 线索转成交率 | 观察 | 5% | 8% |

单条线索成本超过 RM100 就要回头看，不是加预算。

---

## 十一、与 SEO 的配合

Ads 和自然排名不冲突，但要避免自相残杀：

| 关键词 | 自然排名 | Ads 动作 |
|---|---|---|
| 品牌词 | 第 1 | 低价自保，出价压到最低 |
| 型号词 | 已收录 | 不投，让自然流量吃 |
| 地域词 | 排 5–20 | **重点投**，这是 Ads 性价比最高的区间 |
| 品类大词 | 排 20+ | 投，但控制预算，观察 CPC |

地域词现在自然排名在 5–20 位，这个区间投 Ads 回报最好——自然排名已经有了基础信任，广告位是补位而不是从零教育。

---

## 十二、一周内能做完的

| # | 动作 | 谁 |
|---|---|---|
| 1 | GA4 + Ads 关联，两个转化动作建好 | 你 |
| 2 | 子域 72 页 WhatsApp 按钮加事件埋点 | Codex |
| 3 | 开户，建 6 个广告组结构 | 你 |
| 4 | 否定词表 100 个导入 | 你 |
| 5 | 广告文案三语各 3 组 | 我给（下一轮） |
| 6 | 竞对词清单 20 个 | 我给（下一轮） |
| 7 | 对比落地页 | 我写文案 → Codex 建页 |
