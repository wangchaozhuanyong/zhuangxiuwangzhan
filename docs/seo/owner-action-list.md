# 需要业主执行的事项（完整清单）

> 更新：2026-11-23
> 已上线：子域 72 页 + GA4/Ads 埋点 + 主站 20 区域页
> 本文只列**必须由你本人操作**的事，技术侧已全部完成

---

## 优先级总览

| 级别 | 事项 | 为什么排这个位置 | 耗时 | 当前状态 |
|---|---|---|---|---|
| **P0** | 发布 6 篇博客 | 内容已写完，不发等于白做 | 20 分钟 | ✅ 已完成（静态兜底上线并配图） |
| **P0** | Google Ads 建转化 + 开户 | 埋点已就位，不建转化等于瞎投 | 2 小时 | 待业主操作 |
| **P1** | GBP 上传 17 款商品 | 17 个免费商品位，比写内容快 | 40 分钟 | ✅ 已全部发布上线（17款齐备） |
| **P1** | 索评 13 条 | 本地包权重最高单点 | 每周 20 分钟 | 持续进行（见下文话术） |
| **P2** | Bing Places / Apple / Waze | 一次性，慢变量 | 1 小时 | 待业主操作 |
| **P2** | 补现场照片 | 只能实拍 | 顺手 | ✅ 已完成（4张锁+5张施工现场已全部上传GBP） |
| **P3** | 马来语译者 | 卡外部，不着急 | — | 待外部资源 |

---

## P0-1 · 发布 6 篇博客

### 位置

后台 CMS → 博客 → 找到 6 篇草稿

### 每篇操作步骤

1. 打开草稿
2. **填封面图**（下表，直接粘 URL）
3. 检查正文是否有图，没有就跳过（可选）
4. 勾选 `ownerApproved` 和 `explicitExecution`
5. 点发布
6. 发布后打开前台网址确认正文真的显示

### 封面图对照

| 文章 slug | 封面图 URL |
|---|---|
| `digital-lock-price-kl-selangor` | `https://flashcast.com.my/images/services/digital-lock.webp` |
| `condo-door-digital-lock-check` | `https://locks.flashcast.com.my/assets/p-v37j-p16.webp` |
| `fingerprint-face-palm-vein-which` | `https://locks.flashcast.com.my/assets/p-k26j-pro.webp` |
| `aluminium-door-narrow-frame-lock` | `https://locks.flashcast.com.my/assets/p-d10b.webp` |
| `tenant-changeover-digital-lock` | `https://locks.flashcast.com.my/assets/p-g13.webp` |
| `digital-lock-power-failure` | `https://locks.flashcast.com.my/assets/p-g86f-pro.webp` |

### 发布后验证

打开这 12 个网址，都应该不是 404：

```
flashcast.com.my/zh/blog/{slug}
flashcast.com.my/en/blog/{slug}
```

发完告诉我，我复验并推 IndexNow。

---

## P0-2 · Google Ads 开户与投放

### 第一步：建立转化追踪（最重要）

**不要跳过任何一步，这决定后面能不能优化出价。**

```
1. Google Ads → 工具与设置 → 转化
2. 点「新建转化操作」
3. 选「导入」→「Google Analytics 4」
4. 选择属性：FLASH CAST（或对应 GA4 属性）
5. 勾选事件：whatsapp_click、phone_click
6. 主转化设为 whatsapp_click
7. 价值：设为 RM50（用于智能出价学习，不是真实客单价）
8. 计数方式：每次（一次点击算一次）
```

如果 GA4 里还看不到 `whatsapp_click`，说明数据还没到（需要 24 小时），可以先用「网站」类型的转化，等 GA4 有数据再切。

### 第二步：开户前准备

| 需要什么 | 说明 |
|---|---|
| Gmail 账号 | 现有即可 |
| 付款方式 | 信用卡或银行转账 |
| 商家验证 | 可能要求提交 SSM 营业执照 |
| 网站验证 | 用 flashcast.com.my 作为主要网址 |

### 第三步：建广告系列

按 `docs/seo/google-ads-digital-lock-full-plan.md` 第二节建 10 个广告组。第一周只开 3 个：

```
01-EN-Category      英文品类（RM25/天）
04-EN-Area          英文地域（RM15/天）
08-ZH-Category      中文品类（RM8/天）
```

总日预算 RM48–50，跑一周看数据再扩。

### 第四步：导入关键词

每个广告组从方案文件第三、四、五节复制对应关键词。

**匹配方式全部用「词组匹配」**（用引号包起来），不要用广泛匹配，第一周会烧太多无关词。

### 第五步：导入否定词

100 个否定词在方案文件第八节。全部粘进「广告系列 → 否定关键字」，用词组匹配。

**这一步不做，第一周的钱会烧在 `diy`、`how to install`、`locksmith near me` 上。**

### 第六步：广告文案

方案文件第六节给了三语标题和描述。响应式搜索广告填：

- 标题 10–15 个
- 描述 3–4 段
- 中文组记得加「华语顾问全程对接」

### 第七步：附加信息

方案文件第七节。附加链接 6 个、宣传信息 4 个、结构化摘要、图片扩展、电话扩展、地址扩展（关联 GBP）。

### 第八步：地域与时段

```
地域：Kuala Lumpur + Selangor
      ⚠️ 选「目标所在地」，不要选「兴趣所在地」
时段：每天 10:00–19:00
设备：移动端出价 +20%
关闭：展示网络扩展、搜索伙伴、Waze
```

### 第九步：落地页

| 广告组 | 落地页 |
|---|---|
| 英文品类 | `flashcast.com.my/en/services/digital-lock` |
| 英文地域 | `locks.flashcast.com.my/en/` |
| 中文品类 | `flashcast.com.my/zh/services/digital-lock` |

### 第十步：启用

先用 RM48/天跑一周，不要一次设太高。数据出来后再调。

### 第一周每天要看的三个数

```
1. 搜索词报告 → 有没有无关词，有就加否定词
2. CTR → 低于 2% 的广告组换文案
3. 单次点击成本 → 超过预估上限 1.5 倍的关键词降价或暂停
```

---

## P1-1 · GBP 上传 17 款商品

### 方案 A：开扩展权限（快）

```
chrome://extensions/  →  找到对应扩展  →  详情
→  打开「允许访问文件网址」
```

然后让它继续上传。

### 方案 B：手动上传（确定能用）

```
1. Google 商家资料 → 商品 → 添加商品
2. 逐个填：名称、类目、价格、图片、链接
3. 17 款，每款约 2 分钟
```

商品资料在 `tmp/gbp-electronic-lock-20261121/ANZHE-17款-Google商品录入资料.zip`。

价格从 `docs/seo/anzhe-lock-page-copy.json` 取，不要重打。

---

## P1-2 · 索评 13 条

### 目标：2 条 → 15 条

### 节奏：每周 2–3 条，8 周铺完

不要一天进 5 条，曲线太陡会被判异常。

### 什么时候发

```
安装完成 → 现场演示断电应急 → 客户确认可用 → 24 小时内发 WhatsApp
```

### 话术（直接复制）

**中文**

> 你好 [名字]，今天的电子锁已经装好，[型号] 的指纹和密码都测试过了。如果使用上没问题，方便的话在 Google 上给我们留个评价吗？直接搜 "FLASH CAST Kuala Lumpur" 就能找到。有任何问题随时 WhatsApp 我。

**English**

> Hi [name], the [model] is installed and both fingerprint and PIN are tested. If everything works well, would you mind leaving us a Google review? Just search "FLASH CAST Kuala Lumpur". Message me anytime if anything comes up.

**Bahasa Malaysia**

> Hai [name], kunci [model] sudah dipasang dan cap jari serta PIN telah diuji. Jika semuanya berfungsi dengan baik, bolehkah anda tinggalkan ulasan Google untuk kami? Cari sahaja "FLASH CAST Kuala Lumpur". Hubungi saya jika ada sebarang masalah.

### 顺便回复已有的 2 条评价

Google 会看商家是否回复。回复不用长，一句就行：

> 谢谢您的评价，使用上有任何问题随时联系我们。

---

## P2-1 · 三个本地目录

| 平台 | 入口 | 要准备 |
|---|---|---|
| Bing Places | bingplaces.com | 从 GBP 导入，然后核对电话格式与类目 |
| Apple Business Connect | businessconnect.apple.com | 自助注册，填服务区 |
| Waze | waze.com/business | 地标登记 |

三个平台的信息必须与 GBP 完全一致：

```
名称：FLASH CAST SDN. BHD.
地址：94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur
电话：+60 11-2885 3888
网址：https://flashcast.com.my
```

---

## P2-2 · 现场照片

下次施工时顺手拍 4 张：

```
1. 整扇门装完的正面（能看到门与锁）
2. 师傅在装锁的特写
3. 室内屏亮着显示访客画面
4. 门边锁舌位置的近照
```

拍完发给 Codex 上传，或自己传到 GBP 相册。

---

## P3 · 马来语译者（不着急）

23 个 ms 页面现在都是 `noindex`，包括 17 个型号页和 6 个品类页。

要不要解禁取决于你有没有母语译者。**机翻上线反而有害**，会拖累整站质量评分。

如果找到译者，需要校的是：

```
首页 1 页
17 个型号页的 title / description / answer / FAQ
6 个品类页的 title / description / answer
```

校完告诉 Codex，它会把 noindex 去掉并加回 sitemap。

---

## 数据反馈（做完上面之后）

### 24–48 小时后

GA4 会有第一批 locks 子域数据。导出或截图给我，重点看：

```
1. 哪些型号页停留时间最长（说明有人认真看）
2. 哪些页面跳出率最高（说明落地页有问题）
3. whatsapp_click 事件有没有数据
```

### 一周后

```
GSC → 效果 → 筛选 digital lock 相关词
GA4 → 流量获取 → 看哪些渠道真的带来咨询
Ads → 搜索词报告 → 哪些词烧钱没转化
```

---

## 一句话总结

**只有两件事真正影响进度：发布博客、建 Ads 转化。**

其余都是慢慢积累的，做与不做都不影响已经上线的东西。
