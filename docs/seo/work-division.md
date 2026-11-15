# 执行分工：你 / 我（LCS）/ Codex 开发

> 日期：2026-11-14
> 目的：把 90 天 SEO 方案拆成三类任务，明确谁做、依赖谁、验收标准是什么，避免三个执行方互相踩。

---

## 0. 分工的第一原则

**边界不是按"难易"分，是按"能力性质"分。**

| 能力性质 | 只能谁做 | 原因 |
|---|---|---|
| 现实世界的动作（拍照、发消息、登录后台、跑政府审批） | 你 | AI 没有你的账号、没有你的腿、没有你的客户关系 |
| 代码、路由、构建、部署、数据库迁移 | Codex | 需要跑通 `npm run verify:*` 全链路并在真实浏览器验收 |
| 策略、关键词、文案、审计、报告、A/B 假设 | 我 | 不需要执行权限，需要判断和写作 |

有一条容易搞错：**我技术上能写代码，Codex 技术上能写文案。** 但一个仓库两个 AI 同时改，冲突成本远高于省下的时间。所以这个项目里：

- 代码改动一律走 Codex，走 PR，走 CI 部署；
- 我不碰 `src/**`、`supabase/**`、`scripts/**` 的代码文件；
- 我只产出「可以贴进代码的文本资产」——文案、title、description、FAQ、锚文本、schema 字段值；
- 你负责现实的输入和验收。

另一条硬约束（来自你们 [AGENTS.md](AGENTS.md)）：**禁止 Codex 或脚本直接写内容数据库表绕过后台发布链路**。所以 CMS 内容必须走 `/admin` 后台或受保护的 `content-publish` Edge Function，不能"写个脚本灌进去"。

---

## 1. 总表（按阶段）

| # | 任务 | 执行者 | 依赖 | 交付物 |
|---|---|---|---|---|
| **阶段 0：本周启动** | | | | |
| 0.1 | 关键词矩阵（207 条三语） | **我** ✅已完成 | — | [xlsx](flashcast-keyword-matrix-3lang.xlsx) |
| 0.2 | 5 个交叉页骨架 | **我** ✅已完成 | — | [md](landing-page-skeletons-5.md) |
| 0.3 | GBP 清单 + 三语索评话术 | **我** ✅已完成 | — | [md](gbp-optimization-and-review-playbook.md) |
| 0.4 | GBP 后台全部落地（类目/属性/服务/Q&A/照片） | **你** | 0.3 | GBP 100% 完整度截图 |
| 0.5 | NAP 全平台核对 | **你** | 0.3 第 1.2 节 | 一致性核对表 |
| 0.6 | 真实报价区间（厨房/浴室/办公室/公寓/有地） | **你** | — | 数字表 |
| 0.7 | 客户名单（6 个月，含项目类型/地点/完工日） | **你** | — | 名单表 |
| 0.8 | 可公开的 before/after 项目授权 | **你** | — | 项目清单 + 照片 |
| 0.9 | 交叉页路由与页面组件 | **Codex** | 0.2、0.6 | PR + 验收报告 |
| **阶段 1：第 2–4 周** | | | | |
| 1.1 | 5 个交叉页三语正文（完整） | **我** | 0.6、0.8 | 5 份 md，可直接贴 |
| 1.2 | 交叉页录入 CMS / 写进静态 fallback | **Codex + 你** | 1.1 | 页面在线上可访问 |
| 1.3 | 7 个缺页业务线页面结构 | **Codex** | — | PR |
| 1.4 | 7 个缺页业务线三语文案 | **我** | 1.3 | 7 份 md |
| 1.5 | 现有 11 个服务页 title/description 复核 | **我**（给值）→ **Codex**（改文件） | 0.1 | 改动清单 + PR |
| 1.6 | seo manifest 准入校验 | **Codex** | 1.2、1.3 | `source_complete` + `eligible` 证明 |
| 1.7 | 索评执行（每天 2–3 个） | **你** | 0.7 | 每天记录 |
| **阶段 2：第 5–8 周** | | | | |
| 2.1 | 38 篇博客内链改造（锚文本方案） | **我** | 1.2 | 每篇的锚文本表 |
| 2.2 | 内链代码实现（底部相关落地页模块） | **Codex** | 2.1 | PR |
| 2.3 | 成本类深度文 5–8 篇（三语） | **我** | 0.6 | md |
| 2.4 | 本地目录/协会/供应商 NAP 提交 | **你** | 0.5 | 提交记录 |
| 2.5 | 扩到 12–15 个交叉页 | **Codex + 我** | 阶段 1 验证 | PR + 文案 |
| **阶段 3：第 9–13 周** | | | | |
| 3.1 | 项目案例库重做（10–15 个带故事） | **我**（写）**你**（素材）**Codex**（结构） | 0.8 | 案例页 |
| 3.2 | 自然外链（媒体/博主/供应商） | **你** | — | 提及记录 |
| 3.3 | Search Console 月度迭代报告 | **我** | 你导出数据 | 月报 |
| 3.4 | A/B 转化测试 | **Codex**（实现）**我**（假设） | 流量够 | 测试记录 |

---

## 2. 交给 Codex 的 8 个任务包

每个任务包都是**一个独立 PR 的粒度**，直接复制给 Codex 用。每个包都写明了改哪里、不许改哪里、怎么验收——因为你们的 [AGENTS.md](AGENTS.md) 要求先出 Architecture Decision 再动手。

### 任务包 C1：服务×区域交叉页路由（最复杂，先做）

```
【背景】
flashcast.com.my 现有 /:lang/services/{slug}（11 个服务）和 /:lang/locations/{area}（8 个区域），
但没有"某区域的某项服务"这一层。需要新增交叉页路由。

【目标】
新增路由 /:lang/locations/:area/:service，例：
  /en/locations/kuala-lumpur/kitchen-renovation
  /zh/locations/kuala-lumpur/kitchen-renovation
  /ms/locations/kuala-lumpur/kitchen-renovation

【归属判断（必须先确认，不要新造模块）】
- 页面归属 services 模块（服务内容）+ locations 模块（区域内容）的交叉展示
- 禁止新增一级模块；如需读数据，走 service / serviceArea 各自已有的 repository
- 允许改：src/routes/publicRoutes.tsx、src/lib/publicPageModules.ts、
         新建 src/pages/ServiceAreaPage.tsx、src/components/services/*（如需）
- 禁止改：src/data/services.ts 的结构、supabase 迁移（如非必要）
- 禁止：用扁平 slug（/kitchen-renovation-kuala-lumpur），会破坏 LegacyLanguageRedirect 与 hreflang

【硬性要求】
1. 复用现成组件：JsonLdService、JsonLdFAQ、JsonLdBreadcrumb、PageMeta、SmartImage
2. LocalBusiness schema 的 areaServed 必须写具体区域名，不是 "Malaysia"
3. 三语齐全才允许进 sitemap（对齐 scripts/generate-seo-manifest.mjs 的 hasCompleteMalayContent）
4. 新路由必须登记到 docs/interaction-route-compliance.json，
   字段参考现有条目：path/surface/source/loading/refresh/navigation/editing/acceptance/samplePath/component
5. 未知 area 或未知 service 组合 → 404，不要 fallback 到首页

【必须运行】
npm run arch:check
npm run verify:interaction-standards
npm run typecheck
npm run lint
npm test

【必须输出】
Architecture Decision（10 项）+ Architecture Compliance Report（10 项）
+ 真实浏览器桌面/移动验收截图（导航不遮挡、无横向溢出）
```

### 任务包 C2：7 个缺页业务线页面结构

```
【背景】
用户业务包含但站点无独立页：电子锁、刷漆、地砖、吊顶、隔墙、水电、工厂装修。

【目标】
按现有 ServiceItem 结构新增 7 个服务：
  digital-lock / painting / tiling / ceiling / partition / electrical-plumbing / factory-renovation
路由沿用现有 /:lang/services/:slug，不新增路由。

【关键差异】
- digital-lock 是产品型：必须支持型号、门厚兼容、安装费、保修字段
- factory-renovation 是 B2B：必须支持承载、消防、通风、停业成本字段
- 其余 5 个按现有服务结构即可

【允许改】
src/data/services.ts（新增条目，不改既有条目）
如需新字段：src/data/types.ts
【禁止】
不要新增一级模块；不要把 7 个服务塞进 renovation 一个页
【验收】
7 个 URL 均可访问、三语 fallback 正常、JsonLdService 输出正确
npm run arch:check && npm run typecheck && npm run lint
```

### 任务包 C3：seo manifest 准入校验

```
【目标】
确认新增页面真正进 sitemap。当前 scripts/generate-seo-manifest.mjs 只收
source_complete === true 且 qualification === "eligible" 的页面，
ms 还需 hasCompleteMalayContent 通过。

【要做】
1. 新增页面的 manifest 条目来源要正确（静态 fallback 还是 CMS row）
2. 跑 node scripts/generate-seo-manifest.mjs，检查目标 URL 是否出现在产物
3. 若因 ms 不完整被排除，输出"哪些字段缺"的清单，交回内容侧补
4. 生成 sitemap 后用 node scripts/verify-seo-html.mjs 校验

【禁止】
为了让页面进 sitemap 而放宽 eligible 判定或跳过 hasCompleteMalayContent
【验收】
给出目标 URL 在 dist sitemap 中出现的证据（grep 结果）
```

### 任务包 C4：现有服务页 title/description 批量复核

```
【目标】
按 docs/seo/flashcast-keyword-matrix-3lang.xlsx 的 P0 清单，把区域词补进 11 个服务页的
seoTitle / seoTitleZh / seoDescription / seoDescriptionZh。

【约束】
- 英文 title ≤ 60 字符，中文 ≤ 30 字
- 不得堆砌关键词（一个 title 最多 1 个主词 + 1 个区域词）
- 改完必须跑 npm run i18n:check 和 npm run ui:text-check
【验收】
输出 11 个页面改前/改后对照表
```

### 任务包 C5：博客底部「相关落地页」内链模块

```
【目标】
38 篇博客统一在正文下方加"相关服务"模块，每篇链到 1–2 个交叉页或服务页。

【允许改】
src/components/blog/*（新建组件）、src/pages/BlogDetail.tsx
【要求】
- 映射关系用数据配置，不要写死在组件里（便于运营后续调整）
- 锚文本从配置读取，不要重复用"click here"
- 不做成广告位样式，要像正文延伸
【验收】
抽 3 篇博客验证渲染正确，锚文本各不相同
```

### 任务包 C6：公开页性能与 CWV 复核

```
【背景】
AGENTS.md 规定动态图片列表 > 6 张必须预注入/短缓存，禁止裸 <img>。

【目标】
新增的 5 个交叉页 + 7 个业务线页上线后：
- 全部图片走 SmartImage / DeferredSmartImage
- 首屏关键图设置 loading / fetchPriority / sizes / width / height
- 检查 functions/_middleware.ts、public/_headers、public/_redirects 是否覆盖新路径
【验收】
npm run verify:public-performance（需针对 preview 或线上 URL 运行）
或说明未运行的原因
```

### 任务包 C7：联系人/报价表单漏斗埋点

```
【目标】
落地页新增 5 + 7 个，需要能区分线索来源，否则 90 天后无法判断哪页有效。

【要求】
- 复用现有 submit-lead Edge Function，不新增 API
- 增加 source 字段传落地页 slug（如 kitchen-renovation-kuala-lumpur）
- 后台线索列表能看到来源
【禁止】
不要为了埋点新建独立 API 或直接写库
【验收】
提交一条测试线索，后台能看到来源字段
```

### 任务包 C8：路由登记与文档同步

```
【目标】
新增路由后同步维护：
- docs/interaction-route-compliance.json（每个新路由一条）
- docs/ARCHITECTURE.md（若涉及路由结构说明）
【必须运行】
npm run verify:interaction-standards
npm run arch:check
【验收】
两项检查均通过，且 compliance 条目里 acceptance 字段有真实值
```

---

## 3. 交给我的 9 项任务

这些不需要代码权限，也不需要你的账号，我直接产出成品。

| # | 任务 | 产出格式 | 需要你先给什么 |
|---|---|---|---|
| L1 | 5 个交叉页完整三语正文（不是骨架，是能直接上线的一整页文字） | md，按段落对应页面结构 | 真实报价区间、案例素材 |
| L2 | 7 个业务线页三语文案（电子锁/刷漆/地砖/吊顶/隔墙/水电/工厂装修） | md | 你能做的具体工序、材料品牌 |
| L3 | 11 个现有服务页的 title + description 三语改写值 | 表格（旧值 → 新值 → 理由） | 无 |
| L4 | 38 篇博客的锚文本映射表 | 表格（博客 slug → 目标页 → 锚文本三语） | 无 |
| L5 | 成本类深度文 5–8 篇（三语） | md | 真实报价区间、材料品牌 |
| L6 | GBP 的 Q&A 24 条（8 问 × 三语）扩展版 | md | CIDB 号、营业时间 |
| L7 | 本地目录/协会提交清单（马来西亚具体名录） | 表格（平台名 → 提交路径 → NAP 要求） | 你的 SSM、CIDB 状态 |
| L8 | 月度 Search Console 迭代报告 | md | 每月你导出 GSC 数据给我 |
| L9 | A/B 测试假设与文案变体 | md | 现有转化率基线 |

**我的边界（说清楚，避免你以为我能做更多）**：
- 我不登你的 Google Business Profile，不发你的 WhatsApp，不替你回客户；
- 我不编造价格、项目名、客户评价、CIDB 号——这些必须你给，否则页面就是在撒谎，Google 的 E-E-A-T 判定会吃亏；
- 我不直接改 `src/**` 里的代码文件，避免和 Codex 的 PR 冲突。我给的文案你可以让 Codex 贴，或自己在后台 CMS 贴。

---

## 4. 只有你能做的 6 件事

| # | 事项 | 为什么 AI 做不了 | 耗时 |
|---|---|---|---|
| O1 | GBP 后台全部操作 | 需要你的 Google 账号 + 可能要视频验证商家地址 | 2 小时 + 每周 30 分钟 |
| O2 | 逐个私聊索评 | 需要你的 WhatsApp 和客户关系，AI 代发会被识别为骚扰 | 每天 15 分钟 × 14 天 |
| O3 | 真实工地照片拍摄 | 需要人到现场 | 每周 2 次 |
| O4 | 报价数字与工艺标准确认 | 涉及你的成本结构和利润，AI 编的数字会毁掉转化 | 1 小时 |
| O5 | 本地协会/供应商/媒体关系 | 人对人，需要你的身份和名片 | 持续 |
| O6 | DBKL / MBSA / MBPJ 审批经验 | 你有实操经验，这是内容里最值钱的部分 | 访谈 2 小时 |

> O6 值得单独说：你能讲清"PJ 某公寓管理处到底允许什么、不允许什么"，这是竞品抄不走的内容。这部分我写不出来，只能采访你。

---

## 5. 依赖顺序图

```
你给报价数字 ──┐
你给案例素材 ──┼──→ 我写 5 页正文 ──→ Codex 建页 ──→ 我写 7 页文案 ──→ Codex 建页
你给工序细节 ──┘                                        │
                                                        ↓
我出 title 改写值 ──→ Codex 改文件 ──→ Codex 校验 manifest ──→ 上线
                                                        │
我出锚文本表 ──→ Codex 做内链模块 ──→ 收录提升 ──→ 我出月报
                                                        │
你执行 GBP + 索评 ──────────────────────────────────────→ 地图包曝光
```

**关键路径**：`你给报价数字` 卡着 `我写正文`，`我写正文` 卡着 `Codex 建页`。
所以最先要动的不是代码，是你那 6 个数字。

---

## 6. 本周三天启动清单

**今天（你能独立完成的）**
- [ ] GBP 主类目 + 8 副类目 + 属性 + 营业时间（照 [GBP 文档](gbp-optimization-and-review-playbook.md) 第 1.1–1.4 节）
- [ ] 发第一条索评消息（照话术 A）

**明天**
- [ ] GBP Services 16 条 + Q&A 8 条
- [ ] 整理过去 6 个月客户名单
- [ ] 给我 5 个报价区间的数字

**后天**
- [ ] 上传门面照 + 团队照
- [ ] 把报价数字和案例素材发我 → 我开始写 5 页正文
- [ ] 把任务包 C1 丢给 Codex 开工（它不依赖文案，可以先建空页）

---

## 7. 一句话总结

**你出真实输入，我出文字与判断，Codex 出可上线的代码。**
任何一环想省，最后都会变成「页面上了但没排名」或者「有排名但客户不信」。
