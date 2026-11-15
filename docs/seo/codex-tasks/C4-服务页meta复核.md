# Codex 任务 C4：现有 11 个服务页的 title / description 复核与替换

> 投放方式：整篇粘给 Codex。
> 前置：需要 `docs/seo/flashcast-keyword-matrix-3lang.xlsx`（关键词矩阵）与内容侧给的改写值表。若只有矩阵没有改写值，先做诊断不做替换。

---

## 1. 项目背景（自包含）

仓库 `flashcast-website`，三语（`en` / `zh` / `ms`），服务页路由 `/:lang/services/:slug`。

**关键事实（这个任务成败就靠这一点）**：服务数据有两层来源，CMS 优先。

`src/pages/ServiceDetail.tsx`：

```ts
const { data: cmsService } = usePublishedServiceBySlug(slug, language);
const services = cmsServices?.length ? cmsServices : fallbackServices;
```

- CMS 层：Supabase `services` 表 → 线上实际生效
- 静态层：`src/data/services.ts` → 只在 CMS 无数据时兜底

所以：**只改 `src/data/services.ts` 的 `seoTitle`，线上不会变。** 本任务的核心不是改文件，是搞清楚「线上到底读的哪一层」，然后两条路径都覆盖。

## 2. 本次目标

11 个服务的 `seoTitle` / `seoTitleZh` / `seoDescription` / `seoDescriptionZh` 按关键词矩阵的 P0 清单复核并更新，把「区域词」补进标题。

11 个 slug：
`renovation`、`design`、`builtin`、`kitchen`、`bathroom`、`office-renovation`、`shop-renovation`、`artistic-coating`、`old-house`、`warehouse`、`approval`

## 3. 动手前必须先回答

```text
Architecture Decision:
1. Target module:
2. Why this module:
3. Target layer:
4. Why this layer:
5. Files allowed to edit:
6. Files forbidden to edit:
7. API paths affected:
8. Database access location:
9. Cross-module dependency risk:
10. Business behavior impact:
```

## 4. 允许修改 / 禁止修改

**允许**：
- `src/data/services.ts` 的 `seoTitle` / `seoTitleZh` / `seoDescription` / `seoDescriptionZh` 四个字段
- 如有必要，同步调整 `title` / `titleZh`（**但必须先说明理由**，因为 H1 用的就是它）

**禁止**：
- 不要改 `description`、`items`、`faqs`、`processSteps` 等正文内容
- 不要用脚本直接 UPDATE `services` 表（`AGENTS.md` 禁止绕过后台发布链路）
- 不要为了塞关键词把标题写成堆砌（`Kitchen, Bathroom, Office, Renovation KL` 这种会被判 spam）
- 不要改 `slug`（会断链）

## 5. 硬性要求

1. **先诊断线上读的哪一层**。给出证据：查一条服务（如 `kitchen`）在 CMS 里是否存在对应 row。判断方式：
   - 读 `src/lib/` 下 services 相关的 repository 实现，确认查询表名与字段
   - 或从 `supabase/migrations/**` 里确认 `services` 表的列名
   - 结论写成一句：「线上 `/en/services/kitchen` 的 title 来自 CMS，静态文件改动不会生效」

2. **两条路径都要给方案**：
   - 路径 A（静态）：改 `src/data/services.ts` —— 需求变更走这里，可版本控制
   - 路径 B（CMS）：在 `/admin` 后台逐条修改 —— 线上实际生效路径
   报告里必须说明：改哪条路径能让线上真的变，另一条路径改它是为了什么（兜底 / 新环境初始化）。

3. **标题规范**（硬性，改完逐条校验）：
   - 英文 `seoTitle` ≤ 60 字符，格式：`{服务词} {区域词} | {差异点} | FLASH CAST`
   - 中文 `seoTitleZh` ≤ 30 字，格式：`{区域}{服务}｜{差异点}｜FLASH CAST`
   - `seoDescription` 100–155 字符，含一个具体承诺（不是「high quality service」这种空话）
   - 每个标题**最多 1 个主服务词 + 1 个区域词**，不要三个区域堆一起
   - 11 个页面的标题**不能互相重复同一个差异点**（现在很多都是 `Design, Build & Install`，要拆开）

4. **区域词的选择依据**：主服务对应主区域（`kuala-lumpur`），细分服务可对应具体区（`kitchen` → `Kuala Lumpur & Selangor`，`old-house` → `Kuala Lumpur & Selangor`）。不要每个都写 `Kuala Lumpur and Selangor`，那是模板化，会降低相关性判断。

5. **输出对照表**，每行包含：slug、语言、旧值、新值、字符数、改动理由。字符数必须真实计算，不要目测。

6. **改完必须验证线上表现**：改了静态文件后，要说明「线上是否真的变了」以及用什么方式验证。如果线上读 CMS，则明确写「本 PR 只更新兜底数据，线上生效需在后台执行以下 11 条修改」，并给出后台操作清单。

## 6. 验收标准

- [ ] 11 个 slug × 2 语言 = 22 组 title 全部给出旧值 → 新值
- [ ] 每个新 title 的字符数已计算，英文 ≤ 60、中文 ≤ 30
- [ ] 无两个页面使用完全相同的差异点描述
- [ ] 已明确说明线上生效路径（CMS 还是静态）
- [ ] 如线上走 CMS，已输出后台修改清单（11 条，逐字段）
- [ ] `npm run i18n:check` 与 `npm run ui:text-check` 通过

## 7. 必须运行的命令

```bash
npm run typecheck
npm run lint
npm run i18n:check
npm run ui:text-check
npm run arch:check
npm test
npm run build
```

## 8. 必须输出的报告

```text
Architecture Compliance Report:（同 AGENTS.md 十项）
```

外加：

**表 1：诊断结论**
```
服务 slug | 线上数据来源（CMS / 静态） | 证据
```

**表 2：改前改后对照**
```
slug | 语言 | 旧 seoTitle | 新 seoTitle | 字符数 | 理由
```

**表 3：后台操作清单**（若线上走 CMS）
```
步骤 | 后台路径 | 字段 | 填什么
```

## 9. 边界处理

| 情况 | 处理 |
|---|---|
| CMS 与静态数据不一致，且 CMS 内容质量更差 | 输出差异清单，说明建议以哪边为准，不要自行决定覆盖 |
| 某个服务的现有 title 已经很好 | 明确写「保持不变」并列理由，不要为了交差而硬改 |
| 改写后某页 title 超过 60 字符 | 砍差异点，保留「服务词 + 区域词」，差异点放 description |
