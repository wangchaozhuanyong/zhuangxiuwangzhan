# 电子锁保守档 · 上线与 90 天执行清单

> 档位：保守（A 轨 + IndexNow + 真实索评 + 合规目录）
> 主站暴露：0
> 代码部分交 Codex；本清单里标「你」的只有你能做。

---

## 阶段 0 · 上线前（L1 合并前）

| # | 动作 | 谁 | 判定标准 |
|---|---|---|---|
| 1 | 51 个型号页可访问 | Codex | 每个 URL 200，非法 slug 404 |
| 2 | sitemap 54 条，无死链 | Codex | `<loc>` 数 = 54 |
| 3 | IndexNow 验证文件可访问 | Codex | `https://locks.flashcast.com.my/89a0d82405fcdd4e83a37a2c1608813e.txt` 返回文件名本身 |
| 4 | 部署走 `cloudflare-pages-deploy.yml` | 你 | 线上生效后才算上线 |
| 5 | 线上复验 5 个随机型号页 | 你 | curl 200 + 标题含型号与价格 |

**没上线之前的任何排名数据都不要看**，本地跑通不等于 Google 能看到。

---

## 阶段 1 · 第 1 周：Google Business Profile（权重最高的单点）

这一项的效果超过所有技术动作的总和，而且零风险。

### 1.1 类目与服务项

```
主类目：Door lock installation service（若无可选，用 Locksmith）
附加：Security system installer、Home automation company
服务项（逐条新增）：
  - Digital lock installation
  - Smart lock installation
  - Electronic door lock supply
  - Lock replacement
```

### 1.2 产品目录（17 款）

每款填：名称、价格区间、描述、一张图。

```
名称：ANZHE V37J-P16 Digital Lock
价格：RM2,360
描述：Palm vein and 3D face access, 4.5-inch indoor screen, Grade C cylinder,
      remote video intercom. Price includes installation in Kuala Lumpur and Selangor.
```

17 款的价格与名称在 `docs/seo/anzhe-lock-page-copy.json` 里，直接取，不要重打。

### 1.3 服务区

现有只有 KL。扩到：

```
Kuala Lumpur · Petaling Jaya · Subang Jaya · Cheras · Ampang
Puchong · Shah Alam · Klang · Kajang · Seri Kembangan
Mont Kiara · Bangsar · Damansara · Sungai Buloh · Cyberjaya
```

### 1.4 照片（5 张）

| # | 内容 | 要求 |
|---|---|---|
| 1 | 门面 | 白天拍，门牌可辨 |
| 2 | 安装现场 ×3 | 不同角度、不同门型（木门 / 铝门 / 有铁闸的门） |
| 3 | 团队照 | 至少一人穿工服 |

手机拍即可，不要用渲染图。

### 1.5 Q&A 自问自答（15 条）

问题与答案在 `scripts/seo-greyhat/review-farm.md` 第三节，用自己账号回答。
这是 GBP 里长期有效的埋词位置，且不违反任何规则。

---

## 阶段 2 · 第 2 周：合规目录 + IndexNow

### 2.1 目录提交（NAP 必须完全一致）

```
名称：FLASH CAST SDN. BHD.
地址：94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur
电话：+60 11-2885 3888
网址：https://flashcast.com.my
```

本周只做可自助的三家（1 小时）：

| # | 平台 | 方式 |
|---|---|---|
| 1 | Bing Places | 从 GBP 导入，然后核对电话格式与类目 |
| 2 | Apple Business Connect | 自助注册，填服务区 |
| 3 | Waze | 地标登记 |

第二梯队（需要审核，逐步提交）：Yellow Pages MY、Foursquare、Hotfrog、Cylex、Brownbook、Mudah、PropertyGuru、Qanash、Houzz。
清单在 `scripts/seo-greyhat/pbn-checklist.md` 第四节，只取目录部分，站群与 PBN 部分不用。

### 2.2 IndexNow 首次推送

```bash
node scripts/seo-greyhat/indexnow-push.mjs \
  --host locks.flashcast.com.my \
  --key 89a0d82405fcdd4e83a37a2c1608813e \
  --sitemap https://locks.flashcast.com.my/sitemap.xml
```

预期：Bing / Yandex / Seznam 24–72 小时内开始收录。

同一条命令每月跑一次，或每次上新页面后跑一次。

---

## 阶段 3 · 第 3–12 周：索评与监控

### 3.1 索评（目标 2 → 15 条）

节奏：每周 2–3 条，不要一天进 5 条。

时机：安装完成 → 现场演示断电应急 → 客户确认可用 → **24 小时内**发 WhatsApp。

话术三语在 `scripts/seo-greyhat/review-farm.md` 第一节，只用「真实评价」部分。

### 3.2 每周一固定检查（15 分钟）

| 看什么 | 在哪看 | 异常阈值 |
|---|---|---|
| 索引数 | Search Console → 网页 → 已编入索引 | 连续两周不涨 |
| 展示与点击 | GSC → 效果 → 筛选 digital lock / kunci | 展示涨但点击不涨（标题问题） |
| 型号页收录 | GSC 逐个查 5 个 `/lock/{slug}/` | 有 URL 显示「已发现但未编入索引」超 3 周 |
| 本地包排名 | Google 搜 `digital lock near me`（KL 定位） | 掉出前三 |
| 评价数 | GBP | 一周 0 新增说明索评没执行 |
| 咨询来源 | 顾问记录客户第一句话从哪来 | 无法回答说明没记录 |

### 3.3 90 天 KPI

| 指标 | 起点 | 第 30 天 | 第 60 天 | 第 90 天 |
|---|---|---|---|---|
| 子域可索引 URL | 3 | 54 | 54 | 84（含 L5 地域页） |
| GSC 展示（电子锁词） | 待测 | 500 | 2,000 | 8,000 |
| 型号长尾词进前 20 | 0 | 2 | 6 | 10 |
| 地域词进前 20 | 0 | 0 | 2 | 5 |
| GBP 评价 | 2 | 6 | 10 | 15 |
| 咨询量（WhatsApp） | 待测 | +20% | +50% | +100% |

数字不是承诺，是判断「有没有在动」的标尺。第 30 天展示量没有明显上涨，说明索引没打开，回头查收录而不是加内容。

---

## 阶段 4 · L2 与 L5 投完之后

| 任务 | 依赖 | 什么时候投 |
|---|---|---|
| L2 首页 H1 + llms.txt | 无 | L1 上线后 1 周 |
| L5 地域页 9 个 | L1 上线 + 地域文案已交付 | L2 之后 |
| 博客长尾 6 篇 | L5 之后 | 第 6 周起 |

L2 的 `llms.txt` 要注意：`functions/anzheShowroom.ts` 的 `staticFiles` 正则目前放行了 `[a-fA-F0-9]{32}\.txt`，**没有放行 `llms.txt`**，L2 时要把 `llms\.txt` 一起加进去，否则 404。

---

## 停止信号

出现任一条，先停下来查原因，不要继续加动作：

1. GSC 出现 Manual action（保守档基本不会，出现说明有别的动作在跑）
2. 型号页连续 3 周显示「已发现但未编入索引」
3. GBP 收到政策警告
4. 评价发布后 24 小时内被过滤
5. 展示量涨但咨询量不动 —— 说明落地页问题，不是排名问题

---

## 这一档不做什么

```
❌ PBN / 过期域名站群
❌ doorway 矩阵
❌ cloaking 分流
❌ 评价农场
❌ GBP 名称堆砌
❌ 批量目录群发（只做审核类，不做自动群发）
```

`scripts/seo-greyhat/` 里对应的脚本放着，不使用。
