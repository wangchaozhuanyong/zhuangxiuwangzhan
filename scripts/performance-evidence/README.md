# 性能证据复现

这些脚本仅启动本地生产产物及 Pages middleware 的 Node 适配器，使用匿名公开读取；不会部署、修改 CMS 或提交咨询。先确认当前目录是本项目 Git 根，使用锁文件安装依赖和 Node 22。所有输出位于当前项目 `tmp/performance-evidence/`，已有公开构建配置只读入进程，不复制 `.env` 或把配置值写入报告。

## 源码与基线

- 本轮基线固定为 `c502ed547ff28be63b226e2f87f3ea9e29e2347d`，不是旧报告的 `1a3a4647`，也不是 PR #279。
- `build.mjs baseline` 必须在上述提交的干净独立工作树运行；脚本会拒绝把候选源码标成基线。可把本目录的验证脚本复制到该工作树，再执行构建和测量。工作树须位于所属项目 `.codex-worktrees/`，不能放在桌面容器目录。
- 首次测量时，`server.mjs baseline` 从该版本编译并冻结 `middleware-baseline.mjs`。之后比较复用同一基线 middleware 和 Vite 产物，不能用候选源码重新生成。缺少冻结文件且 HEAD 不匹配时会中止。
- 本轮本地记录在源码修改前生成的基线、冻结 bundle 的 SHA256 和 `scope.json`。构建/测量 receipt 记录源码提交；候选构建版本字符串固定为基线 SHA，仅用于消除版本文本对压缩体积的影响。**它不是部署标识**。独立的严格构建使用真实候选提交作为版本号。
- 默认从 Git common-dir 所属原工作区读取现有 `VITE_` 公开构建配置。独立复现可指定 `PERFORMANCE_PUBLIC_ENV_DIR`，值为已有配置的项目目录，不要把配置提交到 Git。

```sh
node scripts/performance-evidence/build.mjs baseline
PERFORMANCE_PRODUCTION_HOST=1 PERFORMANCE_LIMITED_SAMPLES=2 node scripts/performance-evidence/measure.mjs baseline
```

然后在候选工作树执行（基线的输出与冻结 middleware 需保留在同一项目的对应测量目录；不要覆盖同名证据）：

```sh
node scripts/performance-evidence/build.mjs candidate
PERFORMANCE_PRODUCTION_HOST=1 PERFORMANCE_LIMITED_SAMPLES=2 node scripts/performance-evidence/measure.mjs candidate
node scripts/performance-evidence/gallery.mjs candidate
node scripts/performance-evidence/handoff.mjs candidate
node scripts/performance-evidence/prefetch.mjs candidate
node scripts/performance-evidence/listener-profile.mjs candidate
node scripts/performance-evidence/acceptance.mjs candidate
node scripts/performance-evidence/failures.mjs
node scripts/performance-evidence/public-verifier.mjs
node scripts/performance-evidence/strict-build.mjs
```

对照运行 `gallery` / `handoff` / `prefetch` / `listener-profile` / `acceptance` 时将参数替换为 `baseline`。`strict-build` 从已提交的 HEAD 创建独立 Git archive，依次运行项目原有 prebuild 和 production build；不复用旧构建、不把生成物写回源工作树。

## 测量口径与限制

- 默认端口 4387；并行功能检查可用 `PERFORMANCE_PORT` 改端口。计时对照按顺序运行，期间不运行构建或全量测试。
- 首页每种语言、390/1440 视口各 3 个新浏览器 context，随后在同 context 刷新，共 36 条；通过 `PERFORMANCE_LIMITED_SAMPLES=2` 另取 2 条受限网络样本（默认值为 1）。新 context 表示冷 HTTP 缓存，不表示重启设备/DNS/操作系统。
- 应用 `public-route-ready`、品牌遮罩实际退出和字体完成分别记录。资源在 load + `document.fonts.ready` 后回看，包含就绪时仍在下载的请求，不把入口挪到立即加载的首页模块当成总减重。
- CDP 记录跨域字体的真实 encoded transfer，避免 Resource Timing 因 TAO 限制返回 0。完成后的 transfer 包含协议头；本地 JS gzip 汇总独立计算，不混用这两种口径。未完成请求数量也保留，不能将不完整采样称为全部传输量。
- 最终首页对照启用 `PERFORMANCE_PRODUCTION_HOST=1`：仅在隔离 Chromium 中把 `flashcast.com.my` 映射到回环服务器，使用进程内生成的临时 TLS 证书并只信任其 SPKI。不会修改 hosts、系统 DNS、系统信任库、线上域名或生产配置，也不保存证书/私钥文件。每次确认文档来自回环地址。这样保留正式域名的分析库代码路径和原 CSP，使用原生安全上下文 API。
- 此模式允许读取真实 gtag 与 destination 脚本；在 JS 层阻断 Beacon、采集及写入 fetch/XHR，在 CDP 层拦截其余采集/转化请求与未知外域请求。广告转化端点即使以 Script 类型请求也会被阻断，不能误当成只读脚本。页面关闭时的 keepalive 同样受保护。报告分别列站内 JS gzip、包含分析库的实际脚本传输、全部已获取资源和被拦截的采集意图，不把禁止发送的业务请求当成已实测的生产传输。
- `measure` / `gallery` 用 CDP 请求保护，保持真实浏览器 HTTP 缓存；`acceptance` / `failures` 等交互套件使用 Playwright route，缓存会被禁用，不能拿其结果证明热缓存速度。
- 所有浏览器脚本阻断非 GET/HEAD/OPTIONS 写入，只有已确认只读的首页 bundle RPC POST 被允许；普通交互套件将分析库替换为无副作用内容，完整资源套件按上述双层保护读取真实库。离线/资源故障场景可能触发错误日志写入意图，但被保护器拦截。
- 普通交互套件的 loopback 是 HTTP；仅此模式的 Node 适配器移除响应 CSP 的 `upgrade-insecure-requests`，以免 WebKit 把 HTTP socket 升级为 TLS。最终资源套件使用 HTTPS 并保留完整 CSP。生产 CSP、脚本 hash、headers、redirects 源码均未更改。适配器不能代替 Cloudflare preview 的 CDN/边缘验收。
- WebKit 连续换文档偶有旧预取读取取消产生 pageerror。保留连续运行失败和隔离重放结果，不过滤错误、不以重放通过宣称连续使用绝无异常。
- 直达测试为每个语言/列表/详情创建新 Page；筛选返回、连续导航、前进后退、表单语言切换等在同一 Page 内完成。每个功能场景单独创建 Context，错误归属该场景，不让上一已销毁文档的取消事件污染下一场景。原连续换文档压力序列另存，不冒充正常直达验证。
- 1.6 Mbps / 750 Kbps / 150 ms RTT / CPU 4x 是实验配置，不是真实马来西亚移动网络。Chromium/WebKit 桌面引擎和视口模拟不等于 Android/iPhone/Safari 真机，Event Timing 也不是用户群 INP p75。

`PERFORMANCE_TARGET_URL=https://flashcast.com.my PERFORMANCE_HOME_ONLY=1 PERFORMANCE_WIDTHS=390 node scripts/performance-evidence/measure.mjs online-reference` 可记录只读线上参考；禁止把该线上结果与本地候选直接当成同环境加速对比。

具体数字、失败记录、剩余问题和回退方式见本轮 `reports/performance-evidence-2026-10-26/` 报告。

## 继续修复的最终复测（2026-10-26）

第一阶段的 `baseline` / `candidate` 证据保留不变。本次对照使用修改前冻结的 `continuation-baseline` 构建和同名 middleware（源码 `a48f4d3a`）；最终源码为 `910ac24a`，比较构建名 `continuation-font-original`，测量名 `continuation-final`。字体试验已撤回，最终 `index.html` 字节与本次对照源码一致。不得用当前代码重新生成旧 middleware 后冒充对照。

```sh
PERFORMANCE_BUILD_PROFILE=continuation-baseline PERFORMANCE_FROZEN_MIDDLEWARE=1 PERFORMANCE_PRODUCTION_HOST=1 PERFORMANCE_TRACE_READINESS=1 PERFORMANCE_LIMITED_WIDTHS=390,1440 PERFORMANCE_LIMITED_LANGUAGES=en,zh,ms PERFORMANCE_LIMITED_SAMPLES=3 node scripts/performance-evidence/measure.mjs continuation-final-control
node scripts/performance-evidence/build.mjs continuation-font-original
PERFORMANCE_BUILD_PROFILE=continuation-font-original PERFORMANCE_PRODUCTION_HOST=1 PERFORMANCE_TRACE_READINESS=1 PERFORMANCE_LIMITED_WIDTHS=390,1440 PERFORMANCE_LIMITED_LANGUAGES=en,zh,ms PERFORMANCE_LIMITED_SAMPLES=3 node scripts/performance-evidence/measure.mjs continuation-final
PERFORMANCE_REFERENCE_PROFILE=continuation-final-control node scripts/performance-evidence/acceptance.mjs continuation-font-original
PERFORMANCE_BUILD_PROFILE=continuation-font-original node scripts/performance-evidence/failures.mjs
PERFORMANCE_BUILD_PROFILE=continuation-font-original node scripts/performance-evidence/motion-recovery.mjs
PERFORMANCE_BUILD_PROFILE=continuation-font-original node scripts/performance-evidence/public-verifier.mjs
node scripts/performance-evidence/summarize-continuation.mjs
```

每版本 36 条普通网络冷/刷新样本、18 条受限网络样本（3 语言 × 2 视口 × 3 次），另有 5 条列表→详情→返回。`PERF_LIMITED_ONLY=1` 只用于额外的单独试验目录；不能覆盖已验收的完整结果。`PERFORMANCE_TRACE_READINESS=1` 记录有界图片/路由属性变化；LCP 元素候选用于区分主图与字体重绘。失败运行保留部分结果、控制台错误、网络记录和截图；不能只保留通过样本。

`motion-recovery.mjs` 对两种浏览器人为延迟实际首屏主图，验证原 degraded 状态保持不变、只发一次 degraded 事件、原品牌层不重现、输入释放，真实图片恢复后装饰效果才恢复。它不生成假的 ready，不替代真实网络计时。

两种字体压缩原型及无损图库格式原型被否决，源码/原始资源/失败结果保存在所属项目忽略目录；没有进入最终产品或公开图片资源。汇总脚本仅读取冻结的试验摘要和像素对比结果，缺少原始实验目录时不会自行重建或伪造证据。完整复测结论与限制见 `CONTINUATION.md`。
