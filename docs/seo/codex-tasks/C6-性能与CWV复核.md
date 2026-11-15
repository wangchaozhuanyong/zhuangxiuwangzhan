# Codex 任务 C6：新增页面的性能与 Core Web Vitals 复核

> 投放方式：整篇粘给 Codex。
> 前置：C1 / C2 的页面已经能访问。

---

## 1. 项目背景（自包含）

仓库 `flashcast-website`，Cloudflare Pages 部署，Vite + React。

`AGENTS.md` 里有硬性性能规则，本任务是执行这些规则：

- 动态图片列表超过 6 张，必须考虑 HTML 预注入、Edge 短缓存、React Query 复用或其他预加载方案；**禁止让图片 URL 完全依赖滚动后才触发的客户端数据库请求**
- 动态图片必须优先使用 `SmartImage` 或 `DeferredSmartImage`，**不要在页面里随手写裸 `<img>`**
- 首批可见或快速滚动可见的关键图片应设置合理的 `loading`、`fetchPriority`、`sizes`、`width`、`height` 和 Supabase WebP 转换参数
- 涉及线上白屏、chunk、缓存、图片慢、滚动空白时，必须同时检查 `functions/_middleware.ts`、`public/_headers`、`public/_redirects`、构建产物保留脚本、HTML 缓存和 Supabase 图片请求启动时间

现成资源：
- `src/components/SmartImage.tsx` / `src/components/DeferredSmartImage.tsx`
- `scripts/verify-public-performance.mjs`（`npm run verify:public-performance`）
- `scripts/verify-performance-budget.mjs`（`npm run verify:performance-budget`）
- `functions/_middleware.ts`、`public/_headers`、`public/_redirects`

## 2. 本次目标

C1 新增的 5 个交叉页 + C2 新增的 7 个业务线页上线前，做一次性能与 CWV 复核，确保新页不拖累全站。

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
- 新页面组件（`src/pages/ServiceAreaPage.tsx` 及 C2 相关组件）里的图片用法
- `functions/_middleware.ts`（仅在确认新路径需要特殊缓存时）
- `public/_headers`、`public/_redirects`（仅在新路径需要时）
- `scripts/` 下的校验脚本（如需扩展检查维度）

**禁止**：
- 不要为了让指标好看而移除 `width` / `height`（会造成 CLS）
- 不要给所有图片一律加 `loading="eager"`（会拖垮 LCP 反而更差）
- 不要引入新的图片处理库或 CDN
- 不要改动 `vite.config.ts` 的 chunk 分割策略（除非有新证据表明新页造成了回归，且需单独说明）

## 5. 硬性检查项

### 5.1 图片
- [ ] 新页里没有裸 `<img>`，全部走 `SmartImage` / `DeferredSmartImage`
- [ ] 首屏图有 `fetchPriority="high"`，非首屏有 `loading="lazy"`
- [ ] 所有图有明确 `width` / `height`
- [ ] `sizes` 属性与布局实际尺寸匹配（不要一律 `100vw`）
- [ ] 无 404 图片（逐个核对 `src` 路径是否存在）

### 5.2 数据获取
- [ ] 交叉页没有「进页面才发 2 个以上 Supabase 请求」的瀑布
- [ ] 复用现成 hooks（`usePublishedServiceBySlug` / `usePublishedServiceAreaBySlug`），不新写查询
- [ ] 列表型内容（如「该区域下的服务」）不依赖滚动触发

### 5.3 缓存与 HTML
- [ ] `functions/_middleware.ts` 对新路径的处理与现有公开页一致
- [ ] `public/_headers` 覆盖新路径的静态资源
- [ ] `public/_redirects` 无需新增（除非新路径与现有重定向冲突）
- [ ] 构建产物里新页的 HTML 是预渲染还是客户端渲染，明确说明

### 5.4 包体积
- [ ] 新页没有把大依赖带进首屏 chunk
- [ ] 构建输出里新 chunk 大小合理（对比现有 `public-home-route` 229 kB / `vendor` 279 kB 的量级）
- [ ] 若新页导致某 chunk 显著变大，给出原因

## 6. 验收标准

- [ ] `npm run verify:public-performance` 通过，或明确说明为何无法运行（该脚本需要 preview 或线上 URL）
- [ ] `npm run verify:performance-budget` 通过
- [ ] 逐项检查表全部有结论，不允许留「待确认」
- [ ] 给出新旧页面对比数据（至少：LCP 元素、首屏图片总字节、首屏 JS 总量）

## 7. 必须运行的命令

```bash
npm run build
npm run verify:performance-budget
npm run verify:public-performance   # 需先起 preview：npm run preview，指向 preview URL
npm run arch:check
npm test
```

如 `verify:public-performance` 需要线上 URL 而当前只有本地，明确写「未运行，原因：需要 Cloudflare Pages preview 或线上 URL」，并给出本地能做的替代检查结果。

## 8. 必须输出的报告

```text
Architecture Compliance Report:（同 AGENTS.md 十项）
```

外加：

**表 1：逐项检查结果**
```
检查项 | 结果 | 证据
```

**表 2：图片审计**
```
页面 | 图片数 | 裸 img 数 | 缺 width/height 数 | 404 数 | 首屏图 fetchPriority
```

**表 3：构建体积对比**
```
chunk | 改动前 | 改动后 | 差异 | 说明
```

## 9. 边界处理

| 情况 | 处理 |
|---|---|
| 新页需要显示该区域下的多个项目图（> 6 张） | 按 AGENTS.md 要求先做预注入或缓存方案，不要直接滚动加载 |
| 发现现有页面本来就有裸 `<img>` | 报告出来，但**不要顺手修**（超出本任务范围，避免 PR 混杂） |
| `verify:public-performance` 因为环境跑不起来 | 给出替代的手工检查证据，不要用「无法运行」当结论 |
