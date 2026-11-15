# Codex 任务 C3：seo manifest 准入校验（让新页真正进 sitemap）

> 投放方式：整篇粘给 Codex。
> 前置：**必须在 C1 或 C2 至少完成一个之后再做**，否则没有可校验的对象。

---

## 1. 项目背景（自包含）

仓库 `flashcast-website` 的 sitemap 不是自动扫全部路由，而是走「资格清单」机制：

- `scripts/generate-seo-manifest.mjs` 生成 SEO manifest
- `scripts/generate-sitemap.mjs` 只把 manifest 里满足条件的页面写进 sitemap
- 条件在 `buildQualifiedSitemap` 里是硬性的：

```js
if (!rows.length || rows.some(([, meta]) => !meta.source_complete || meta.qualification !== "eligible")) {
  throw new Error("seo_manifest_unqualified");
}
```

- 马来语（`ms`）额外要求 `hasCompleteMalayContent(row)` 通过才输出 `ms` 路由
- 数据来源是 Supabase 快照（`snapshot.rows`），包含 `projects`、`blog_posts`、`materials`、`service_areas`、`landing_pages`、`services`、`site_pages`、`cms_pages`

**结论：页面存在 ≠ 页面进 sitemap。** 加了新页但没进 manifest，Google 只能靠内链慢慢发现，收录会慢几周到几个月。

## 2. 本次目标

确认以下新增页面**真的**出现在生成的 sitemap 里：

1. C1 新增的 5 个交叉页 × 3 语言
2. C2 新增的 7 个业务线服务页 × 可用语言

对于没进的，输出**精确原因**（缺哪个字段、哪条判定没过），交回内容侧补，而不是放宽判定。

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

**既定答案**：本任务属 `seo` 模块，目标是 `scripts/` 的校验与报告逻辑，**不涉及页面渲染**。

## 4. 允许修改 / 禁止修改

**允许**：
- `scripts/generate-seo-manifest.mjs`（仅在确有必要补新页面类型的来源绑定时）
- `scripts/verify-seo-html.mjs`（如校验维度需要扩展）
- 新增一个只读的审计脚本，如 `scripts/audit-seo-manifest-coverage.mjs`

**禁止**：
- 禁止放宽 `source_complete` 或 `qualification` 的判定条件来「让页面通过」
- 禁止跳过 `hasCompleteMalayContent` 直接输出 ms 路由
- 禁止手动编辑 sitemap 产物文件
- 禁止为了进 sitemap 而批量填假内容（如把 ms 字段用英文回填）

> 这条限制的理由：`hasCompleteMalayContent` 的存在就是为了防止机翻/空壳页污染 ms 索引。绕过它等于把整个 ms 语种的信任度押上去。

## 5. 硬性要求

1. **先出诊断，再谈修改**。第一步不是改代码，是跑产出诊断报告：

```
目标 URL | 是否在 manifest | source_complete | qualification | available_locales | 缺失字段 | 判定失败原因
```

2. **区分「静态来源」与「CMS 来源」**。manifest 里 `bind()` 的 `ownedStatic` 参数决定来源绑定方式，静态 fallback 与 CMS row 的绑定路径不同。诊断时要标明每条目标 URL 走的是哪条路径。

3. **ms 缺失必须逐字段列出**。不要只说「ms 不合格」，要说「缺 `title_ms`、`summary_ms`、`faqs_ms`」。

4. **交叉页的来源绑定**（C1 做完才需要）：交叉页是 `services` × `service_areas` 的组合，manifest 里没有现成的 kind。你需要在诊断报告里提出方案：
   - 方案 A：作为 `service_area` 的衍生路由，从 `service_areas` 行派生
   - 方案 B：新建 kind（需要同时改 manifest 与 sitemap 的校验）
   两个方案各写优劣，**不要自己拍板**，等业主选。

5. **校验产物**：生成后用 `node scripts/verify-seo-html.mjs` 检查 sitemap 与页面 HTML 的一致性。

## 6. 验收标准

- [ ] 能证明目标 URL 是否出现在 `dist` 的 sitemap 产物中（给出 grep 或 diff 证据）
- [ ] 每个未收录的 URL 都有明确原因
- [ ] 每个已收录的 URL 有 `source_complete: true` + `qualification: "eligible"` 的实际证据
- [ ] ms 路由的收录情况与 `hasCompleteMalayContent` 判定一致
- [ ] `node scripts/generate-seo-manifest.mjs` 与 `node scripts/generate-sitemap.mjs` 均无 `seo_manifest_unqualified` 报错

## 7. 必须运行的命令

```bash
node scripts/generate-seo-manifest.mjs
node scripts/generate-sitemap.mjs
node scripts/verify-seo-html.mjs
npm run arch:check
npm test
npm run build
```

## 8. 必须输出的报告

```text
Architecture Compliance Report:（同 AGENTS.md 十项）
```

外加三张表：

**表 1：覆盖诊断**
```
URL | manifest 内 | source_complete | qualification | locales | 缺字段 | 失败原因
```

**表 2：待补内容清单**（交给内容侧）
```
URL | 语言 | 缺的字段 | 谁能补（人写 / CMS 后台 / 静态文件）
```

**表 3：交叉页来源绑定方案对比**（仅当 C1 已完成）
```
方案 | 改动文件 | 影响范围 | 风险 | 建议
```

## 9. 边界处理

| 情况 | 处理 |
|---|---|
| 目标页面在 CMS 里根本没有对应 row | 输出「需在后台创建的记录清单」，不要造数据 |
| `generate-sitemap.mjs` 因某条无关记录不合格而整体抛错 | 报告是哪条记录拖累全局，这是优先级最高的修复项 |
| 发现 ms 内容大量缺失 | 输出 ms 缺口统计（多少页、缺哪些字段），这是决策依据，不要试图机翻填充 |
