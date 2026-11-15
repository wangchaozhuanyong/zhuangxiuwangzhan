# 给 Codex 的开发任务包（8 个，可独立投放）

> 生成日期：2026-11-14
> 用法：每次只把**一个** `.md` 文件整篇粘给 Codex。每篇都是自包含的，Codex 不需要本会话上下文。

## 任务清单与投放顺序

| 文件 | 任务 | 前置 | 可否并行 | 预计改动量 |
|---|---|---|---|---|
| [C1-交叉页路由.md](C1-交叉页路由.md)（**v2**） | 新增 `/:lang/locations/:area/:service` 交叉页路由 | 无（需配套 meta 文件） | 可与 C2 并行 | 大（1 新页面 + 2 路由文件 + manifest + 登记） |
| [C1-manifest-meta-values.md](C1-manifest-meta-values.md) | C1 必需的 15 条三语 manifest 定义，直接粘进 `staticDefs` | 与 C1 同时投放 | 必须随 C1 | 无（纯文案） |
| [C2-七个业务线服务页.md](C2-七个业务线服务页.md) | 新增电子锁/刷漆/地砖/吊顶/隔墙/水电/工厂装修 7 个服务 | 无 | 可与 C1 并行 | 中（1 数据文件 + 后台录入清单） |
| [C3-sitemap准入校验.md](C3-sitemap准入校验.md) | 证明新页真的进 sitemap | **C1 或 C2 完成** | 需在 C1/C2 之后 | 小（诊断为主） |
| [C4-服务页meta复核.md](C4-服务页meta复核.md) | 11 个现有服务页 title/description 替换 | 内容侧给改写值 | 可并行 | 小（但需查清 CMS/静态哪层生效） |
| [C5-博客内链模块.md](C5-博客内链模块.md) | 博客底部「相关落地页」模块 | C1 或 C2 完成 + 锚文本表 | 可并行 | 中 |
| [C6-性能与CWV复核.md](C6-性能与CWV复核.md) | 新页性能与 Core Web Vitals 复核 | C1 + C2 完成 | 需最后做 | 小（复核为主） |
| [C7-线索来源埋点.md](C7-线索来源埋点.md) | 表单带上落地页来源，后台可见 | C1 / C2 页面存在 | 可并行 | 中（含迁移） |
| [C8-路由登记与文档同步.md](C8-路由登记与文档同步.md) | 登记交互合规 + 架构文档 | **C1 / C2 完成** | 收尾必做 | 小 |

## 推荐投放节奏

```
第 1 次投放  →  C1            （最复杂，先跑通路由）
第 2 次投放  →  C2            （独立，可与 C1 结果一起验收）
第 3 次投放  →  C3            （验证 sitemap 收录，暴露内容缺口）
第 4 次投放  →  C4 + C5       （可以一次给两个，互不冲突）
第 5 次投放  →  C7            （埋点）
第 6 次投放  →  C6            （性能复核，最后做）
第 7 次投放  →  C8            （登记收尾）
```

不要一次把 8 个全给——Codex 会在一堆约束里失焦，而且 C3/C6/C8 依赖前面完成。

## 每个任务包的统一结构

每篇都包含这 9 节，格式一致：

1. 项目背景（自包含，含真实文件路径）
2. 本次目标
3. 动手前必须先回答的 Architecture Decision（10 项）
4. 允许修改 / 禁止修改（文件级）
5. 硬性实现要求
6. 验收标准（勾选式）
7. 必须运行的命令
8. 必须输出的报告（含表格模板）
9. 边界与失败处理

## 我在任务包里写死的关键约束

这几条是容易出事的地方，已经写进对应任务，投放时不要删：

| 约束 | 出现在 | 原因 |
|---|---|---|
| 禁止用扁平 slug `/kitchen-renovation-kuala-lumpur` | C1 | 会绕过 `LegacyLanguageRedirect` 和 hreflang |
| 新路由必须放在 `/:lang/locations/:slug` 之前或更精确匹配 | C1 | 否则两段路径被 `LocationPage` 吃掉 |
| 非法组合必须 404，不许 fallback | C1 | 防重复内容 |
| 禁止新增一级模块 | C1 / C2 | `AGENTS.md` 固定 16 个模块 |
| 静态文件改了线上不一定变（CMS 优先） | C2 / C4 | `ServiceDetail.tsx` 里 `cmsServices?.length ? cmsServices : fallback` |
| 禁止放宽 `source_complete` / `eligible` / `hasCompleteMalayContent` | C3 | 否则机翻页污染 ms 索引 |
| 禁止编造报价数字、保修年限 | C2 | 需业主提供真实值 |
| 禁止裸 `<img>`，必须 `SmartImage` | C6 | `AGENTS.md` 性能规则 |
| 不改 `submit-lead` 返回契约 `{ ok, id }` | C7 | 兼容性 |
| 禁止脚本直写 `leads` / `services` / 内容表 | C2 / C3 / C4 / C5 / C7 | `AGENTS.md` 禁止绕过后台发布链路 |
| 部署走 `.github/workflows/cloudflare-pages-deploy.yml` | 全部 | 生产入口唯一 |

## 修订记录

### 2026-11-14 · C1 升到 v2（基于 Codex 只读核对反馈）

Codex 提出三条，全部复核成立，另有一条它没提到但更硬的约束：

| # | Codex 的说法 | 复核结果 | 证据 |
|---|---|---|---|
| 1 | 200/404 由 React 渲染 + 中间件 manifest 两层共同决定 | **成立，且更严格** | `functions/_middleware.ts:2526` `status: meta ? response.status : 404`；`:2592` `fallbackMeta ? 200 : 404` |
| 2 | `old-house` 用独立组件，浏览器 meta 来自组件文案 | **成立** | `src/pages/OldHouseRenovation.tsx:62` 用 `oldHouseRenovationPageText[language].metaTitle`，不读 `services.ts` 的 `seoTitle` |
| 3 | 单页找不到已发布记录时会尝试静态兜底 | **成立** | `src/lib/contentApi.ts:192` `getFallbackServices`，ms 走 `localizeMalayContent(servicesData)` |
| 4 | 本地 manifest 去重后 38 个博客 slug，静态只有 12 | **成立** | `functions/seo-manifest.json` 1154 条，locations 60 条（30 区域 × en/zh） |
| 5 | *（Codex 未提）* manifest 与 sitemap 是绑定的 | **比第 1 条更硬** | `buildQualifiedSitemap` 对任一条 `source_complete: false` 或 `qualification !== "eligible"` 直接抛 `seo_manifest_unqualified`，**不能用「标不合格」来让页面 200 但不进 sitemap**，那会炸掉全站 sitemap |

因此 v2 的改动：

1. 允许修改清单加入 `scripts/seo-static-pages.mjs`（manifest 接入点）
2. 新增第 2 节完整说明中间件语义与三条硬结论
3. 新增第 5 节方案 A/B/C 对比，**明确禁止改中间件做路径特判**
4. 新增第 12 节合并策略：C1 的 PR 不合并，等正文补齐再一起上线
5. 配套产出 `C1-manifest-meta-values.md`（15 条三语 meta）

## Codex 交付回来之后，你要验收什么

不要只看它说"完成了"，逐条对：

1. **`Architecture Compliance Report` 的 10 项是否都填了**，特别是第 4 项「Forbidden files touched」必须是 `no`
2. **命令是否真跑过**：看它贴的 `arch:check` / `typecheck` / `build` 输出，不是"应该通过"
3. **URL 是否真的能访问**：让它给状态码，不接受"已实现"
4. **截图是否是真实浏览器**：不是 dev server 日志
5. **有没有夹带**：`git diff --stat` 看改了哪些文件，超出「允许修改」范围的一律退回

## 与内容侧（我）的交接点

| Codex 任务 | 需要我先给 | 它交付后我需要做什么 |
|---|---|---|
| C1 | 5 个 area × service 组合清单（已写在 C1 里） | 写 5 页三语正文 |
| C2 | 7 个服务的业务细节（工序、材料、能承诺什么） | 写 7 页三语文案 |
| C3 | 无 | 按它输出的「缺字段清单」补三语内容 |
| C4 | 11 个 slug 的新 title/description 值 | 无（或按它诊断结论调整策略） |
| C5 | 全站博客 slug 清单 + 锚文本映射表 | 补未覆盖的博客映射 |
| C6 | 无 | 无 |
| C7 | 无 | 90 天后按来源出转化报告 |
| C8 | 无 | 无 |
