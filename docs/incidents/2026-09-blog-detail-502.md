# 2026-09 博客详情页 502 事故与修复

## 现象

2026-09-03 审计多次观察到以下英文详情页返回 `502 Bad Gateway`，而同时博客列表和其他文章可用：

```text
https://flashcast.com.my/en/blog/renovation-permit-dbkl-guide
```

2026-09-04 在生产提交 `850482bc1a2b7849d65f6579fd4cb0e0e50c2bdb` 上重验时，中英文和 `__flashcast_refresh=1` 均已恢复为 HTTP 200，因此本轮无法再抓到当时的 Cloudflare 异常栈。历史 502 是已有审计证据，但不应把当前 200 写成“故障仍在持续”。

## 复现方法

1. 对已知路径、中文路径、对照文章和带恢复参数路径发送 HEAD/GET 请求，保留状态、CF-Ray、缓存头、TTFB 和 HTML 字节数。
2. 通过公开页面的正常客户端读取链路，只统计目标文章字段类型和长度，不输出正文、访问密钥或客户数据。
3. 在 Edge 集成测试中使 Supabase 博客读取一直等待到 `AbortSignal` 超时。修复前请求没有超时上限，只能等平台终止；修复后在 2 秒内切换至 manifest app shell 并返回 200。

## 根因

已确认的根因是 Edge 博客详情链路没有资源边界：

- `functions/_middleware.ts` 对 `blog_posts` 详情使用 `select=*`，为了生成 `<head>` 也会把 `content_en/content_zh` 整篇正文拉到 Cloudflare Function。
- `buildDynamicSeoEntry` 在 SEO description 和 excerpt 缺失时会对整篇正文执行 HTML/正则清理。
- Supabase 读取没有应用级超时；下游请求卡住时，代码中的 `catch` 无法在 Cloudflare 强制终止前获得控制权。
- HTML 生成最外层没有可返回静态 manifest 的安全底线，未捕获的转换/序列化错误可直接变成 5xx。
- 预加载 JSON 没有字节上限，异常大的动态负载可以继续放大 Edge 内存和 HTML 哈希成本。

当前 DBKL 记录未发现字段腐坏：`tags` 为数组，日期可解析，文本中无 NUL 或非法控制字符。其英文正文长度为 3,142，对照文章为 533；这会放大无边界路径的成本，但仅凭当前数据不能证明它是当时唯一的触发因素。无历史 Cloudflare 请求日志时，不编造具体异常栈。

## 修复点

- 博客 Edge SEO 读取改为明确的元数据字段投影，禁止读取正文。
- 博客描述回退固定为 `seo_description -> excerpt -> manifest -> title`。
- Edge 外部读取使用 2 秒超时，只记录 route/stage/status/耗时/request ID/错误类别。
- 已知 manifest 路径在动态读取或 HTML 生成异常时返回 200 app shell，并加 `x-flashcast-edge-fallback: manifest`。
- 真正未知路径仍返回 404 + noindex。
- 公开预加载 JSON 在 150 KB 警告，超过 250 KB 时不注入，由客户端按需读取。
- 博客客户端将“查询失败”与“确实不存在”分开；静态文章仍可降级，CMS-only 文章失败时显示可重试且 noindex 的错误状态。

## 为何原测试未发现

- 原 SEO 检查只验证 12 个列表/静态路径，没有固定验证 DBKL 详情。
- 原生产监控只检查 `/zh/blog` 列表，不从 sitemap 抽样详情。
- 原 Edge 集成测试只验证缓存与路由，没有模拟下游超时、缺 SEO 描述、非法字段和超大负载。

## 回归测试

- 断言博客详情的 Supabase `select` 不是 `*` 且不包含正文字段。
- 断言缺少 description/excerpt 时不会扫描正文。
- 断言 Supabase 超时后返回 manifest 200 及降级响应头。
- 断言非法 tags/日期不会触发 502。
- 断言未知博客路径仍是 404 + noindex。
- 断言超过 250 KB 的预加载不注入 HTML。

## 生产验证

本 PR 未合并、未部署，因此不宣称修复已上线。2026-09-04 修复前基线为：

| 路径 | HTTP | TTFB | HTML |
| --- | ---: | ---: | ---: |
| `/en/blog/renovation-permit-dbkl-guide` | 200 | 1.264 s | 9,304 B |
| `/zh/blog/renovation-permit-dbkl-guide` | 200 | 0.837 s | 8,993 B |
| `/en/blog/renovation-payment-schedule-malaysia` | 200 | 0.990 s | 9,173 B |
| `/zh/blog/renovation-payment-schedule-malaysia` | 200 | 1.132 s | 10,157 B |
| `/en/blog/renovation-permit-dbkl-guide?__flashcast_refresh=1` | 200 | 1.061 s | 9,304 B |

上述响应的 deploymentVersion 为 `850482bc1a2b7849d65f6579fd4cb0e0e50c2bdb`，canonical 已去除查询参数，中英文 hreflang 成对。合并并部署后还必须完成 20 次连续 200、Cloudflare 无未捕获异常和浏览器 DOM 验收。

## 风险与回滚

- 风险：动态 CMS 元数据在超时窗口内可短暂显示构建时 manifest 版本；正文由客户端继续读取，不在 Edge 伪造内容。
- 风险：超大预加载被省略时，客户端会增加一次按需请求，但页面不应因注入数据过大而 5xx。
- 回滚：revert 本 PR 并通过标准 `main` 发布流程重新部署上一提交。本 PR 无数据库迁移，回滚不修改 CMS 记录。
