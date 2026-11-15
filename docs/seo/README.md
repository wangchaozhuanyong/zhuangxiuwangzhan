# FLASH CAST SEO 交付物索引

> 日期：2026-11-14 ｜ 站点：flashcast.com.my ｜ 语言：en / zh / ms

## 交付物

| 文件 | 内容 | 用途 |
|---|---|---|
| [flashcast-keyword-matrix-3lang.xlsx](flashcast-keyword-matrix-3lang.xlsx) | 207 条三语关键词（EN 81 / BM 63 / ZH 63），含意图、竞争度、承接页、P0–P2 优先级 | 直接给文案和开发排期用，可筛选排序 |
| [build_keyword_matrix.py](build_keyword_matrix.py) | 上面那份 Excel 的生成脚本 | 改词、加词后重跑即可，不用手工改表 |
| [landing-page-skeletons-5.md](landing-page-skeletons-5.md) | 5 个服务×区域交叉页的完整骨架 + 三语 title/description/H1 + 三语 FAQ + 内链 + Schema 检查清单 | 交给开发建页、交给文案填字 |
| [gbp-optimization-and-review-playbook.md](gbp-optimization-and-review-playbook.md) | GBP 100% 完整度清单 + NAP 一致性表 + 三语索评话术 + 三语差评回复 + 14 天冲刺排期 | 你本人执行，不需要开发参与 |

## 对原方案的四点修正（基于代码库实际核对）

原方案里对现状的判断有三处需要校准，不校准会导致重复劳动：

**① 服务页不是"少量单薄"，而是已经有 11 个，且标题已带区域**
`src/data/services.ts` 里已有：renovation、design、builtin、kitchen、bathroom、office-renovation、shop-renovation、artistic-coating、old-house、warehouse、approval。每个都有 `seoTitle` / `seoDescription` / `titleZh` / FAQ / 流程步骤。
→ 所以第一阶段的 5 个落地页，不是新建服务页，是新建**服务×区域交叉页**（`/locations/{area}/{service}`），这是当前结构里真正的空白层。

**② 区域页已经存在，8 个区域 + 15 个案例型页**
`src/data/locations.ts` 已有 kuala-lumpur、selangor、petaling-jaya、cheras、subang-jaya、mont-kiara、bangsar、puchong，另有若干"某区域某项目"的案例页。
→ 缺的是 Klang、Shah Alam、Ampang、Damansara、Kajang、Cyberjaya 这些区域，不是重新做已有 8 个。

**③ Schema 已经在做了，不需要从零加**
`src/components/JsonLd` 提供 `JsonLdService`、`JsonLdFAQ`、`JsonLdBreadcrumb`；`LocationPage.tsx` 已输出 `LocalBusiness`。
→ 技术清理的重点不是"加 Schema"，而是：新页复用现成组件、补 `areaServed` 精确度、以及修 `sitemap` 准入。

**④ sitemap 有资格门槛，这是最容易被忽略的坑**
`scripts/generate-seo-manifest.mjs` 只把 `source_complete` + `eligible` 的页面写进 sitemap，马来语还额外要求 `hasCompleteMalayContent`。
→ 意思是：机翻的 ms 页面**不会进 sitemap**，做了等于没做。这条决定了 ms 这一仗能不能打，投入顺序应该是「先把英文和中文做满，再人写 ms」，而不是三语同时铺。

## 建议执行顺序（按投入产出比排）

```
第 1 步｜GBP（0 开发成本，1–2 天）
  └─ 用 gbp-optimization-and-review-playbook.md 第 1 节，今天做完

第 2 步｜7 个缺页业务线（低成本高意图）
  └─ digital-lock / painting / tiling / ceiling / partition / electrical-plumbing / factory-renovation
  └─ 理由：搜这些词的人今天就要下单，不需要教育，且马来语和中文竞争几乎为零

第 3 步｜5 个服务×区域交叉页（中等成本）
  └─ 用 landing-page-skeletons-5.md，需要先改路由结构

第 4 步｜现有 11 个服务页的 title/description 复核
  └─ 按 keyword-matrix 的 P0 清单，把区域词补进 seoTitle

第 5 步｜博客内链改造 + 成本类深度文
  └─ renovation cost malaysia / 装修费用 马来西亚 / kos pengubahsuaian 这三条是三语里转化最高的词

第 6 步｜ms 内容人写 + 校对
  └─ 必须在 sitemap 门槛上确认 hasCompleteMalayContent 通过
```

## 待你确认

1. 报价区间的真实数字（文档里全是 `RM {XX}` 占位，需要实际值）
2. 可公开的 before/after 项目（项目名、区域、工期、造价、照片授权）
3. 路由结构调整是否现在做（涉及 `publicRoutes.tsx`、`publicPageModules.ts`、seo-manifest 三处）
4. 营业时间、GBP 评价短链、过去 6 个月客户名单
5. 是否有 CIDB 注册号（马来西亚装修行业最强信任信号）
6. ms 文案由谁写、谁校对

## 验证记录

- `npm run arch:check` → **passed**（本次只新增 `docs/seo/` 文档，未改动任何代码）
- Excel 已回读校验：4 个 sheet（说明 / EN / BM-Malay / ZH-CN），中文与马来语字符正常，`{L}` 占位已按语言替换为 `/en/` `/zh/` `/ms/`
