# FLASH CAST 性能修复与验证记录（2026-10-26）

> 后续发布方案与最终采样见 [发布验证记录](../performance-release-2026-10-26/REPORT.md)。本页保留历史阶段状态。

> 本文保留第一阶段的版本与测量结果。继续修复后的最终结论、对照数据及回退补充见 [CONTINUATION.md](CONTINUATION.md)；不要把本页旧候选数字当成最终结果。

本轮交付独立分支与草稿 PR，未合并 main、未部署、未写入 CMS 或客户业务数据。采用已确认有效的语言资源、数据复用和导航稳定性修复；缩略图方案实测造成回退，保留原图库。完整首页脚本量和受限网络 LCP 仍未全部达标。

## 版本、范围与恢复记录

- 仓库：`wangchaozhuanyong/zhuangxiuwangzhan`；项目 `flashcast-website`，Vite 8 / React 18 / TypeScript / React Query / Supabase / Cloudflare Pages；npm 锁文件未改。
- 基线：远程 main 与开始时线上版本均为 `c502ed547ff28be63b226e2f87f3ea9e29e2347d`，不是历史报告的 `1a3a4647`。PR #279 仍是旧草稿，未合并或挪用其整份分支。
- 分支：`perf/verified-loading-20261026`；性能采样代码提交：`76702a79ca739f9ec50c025b98a26f48bc674209`；随后整合最新 main `f988ac316fddd3effa30f3e2e88c5a09307a997c`，最终严格构建提交：`c1b51ce5099e61b5eb687af32cbd3f88476c4402`。main 新增的 12 文件仅涉及发布通道、工作流和测试，不改变本轮测量的前台运行代码；没有冲突。交付提交只增加验证脚本和报告。
- 在原项目内部 `.codex-worktrees/performance-evidence-20261026` 工作。原工作区 main 仍为 `d33175ae`，原有 314 个已修改跟踪文件的 SHA256 全部保持一致。另有其他任务新增的未跟踪报告目录，未读取或纳入本 PR。
- 原始日志、工作区状态/hash、范围记录位于原项目 `backups/performance-evidence-20261026/`；浏览器原始结果、截图与构建位于工作树 `tmp/performance-evidence/`。不复制 `.env`，不向报告保存构建密钥、凭证或编译后的实际配置代码。
- 被否决的缩略图原型保留在本地 `perf/evidence-loading-20261026`（`f8ff65a0`）及恢复对象 `dffa5994a547571e3a6efd6205b6f59351b58b20`；只推送采用有效修复的新分支。

## 确认的根因与采用的修改

| 批次 | 证据与原因 | 修改及保持的规则 |
| --- | --- | --- |
| 1：资源边界 | 公共内容 mapper / 标签 / 家具展示 / landing 导入完整马来语回退资源，中英文首页也取得这些代码。静态入口门禁已经递归统计 ESM；首页马上加载的动态模块另有大量实际成本。 | 四个浏览器入口改接轻量 runtime；只在 ms 页面或 ms 查询真正需要时加载原字典。同步本地化前等待资源，不输出临时英文替代；保持词典、术语与回退算法。语言切换保持同一子树，保留输入 DOM、草稿与焦点。 |
| 2：发现与预取 | main 已包含完整静态依赖统计、共享页面 loader、首次成功就绪/弱网/去重和动态 CSS-only 的 WebKit 策略；没有重复合并旧 PR。 | 延续原策略，ms 目标同时准备语言资源；失败的可选语言准备不污染下一次真实导航尝试。仅把已在入口图内的 tslib、图标工厂辅助代码合并到既有 vendor，图标定义与其他页面继续按需加载。 |
| 3：材料读取 | 正常材料详情先读完整材料列表，再读详情/图库；服务端详情也交接无关分类。 | 先读当前完整详情/图库，再只取其分类，保留原排序和相关卡片内容；详情上下文单独交接，不能把局部分类当成完整列表缓存。失败图库不伪造成成功空数组；成功空图库可明确交接。 |
| 3：详情缓存 | 博客预取没有共用完整列表正文复用；部分家具详情重复读取已取得的 catalog 设置。 | hook 与预取共用完整性/同语言/新鲜度/失效检查。只有完整正文可复用，摘要仍读详情；过期正文可保留展示，但继续刷新。家具只复用完整的已知 baseline 产品，托管商品摘要仍获取图库。 |
| 3：HTML 交接 | 服务/博客当前详情已由服务端读取，客户端仍再读一次；联系页与 ms 项目列表未充分交接。 | 只交接当前详情及当前语言真正需要的字段，保留原有回退字段与翻译就绪标记；列表与详情分键。联系 bundle、ms 项目摘要复用现有失效机制；查询失败不当成成功空内容。150/250 KiB 预注入限制未改。 |
| 3：字段选择 | 实际测得服务/博客全集响应较大，但正文还用于阅读时间和完整详情复用。 | 只去掉未使用列，保留全部当前展示字段、三语言正文、FAQ、SEO、价格与排序数据；没有把摘要冒充完整文章。收益很小，见下表。 |
| 4：图片 | 普通提前加载图片的 auto 优先级已在 main 修复，现有回归继续通过。缩略图独立地址会丢失主图共用缓存的收益。 | 不重复改优先级。对无损候选、原图复用和邻图预热做实际传输测试后否决缩略图改动，最终原图文件、顺序、图库组件均保持原样。 |
| 5：隐藏组件 | 桌面 display:none 的手机底栏仍产生 31 次几何读取。装饰动画扫描仅 4 次、约 0.3 ms。 | 底栏按既有 767px 断点暂停观察器、监听与读取，恢复手机宽度即恢复；清理回调且保留面板/输入状态。装饰动画没有值得修改的开销证据，保持原实现。 |
| 导航回归 | WebKit 焦点移动已改变 scrollY，但 scroll 事件稍后到达；快速 Enter 切换缓存页面会保存旧位置。基线测试应恢复 770px、实际为 0。 | 在现有输入中断处理里先记录实际位置，不新增定时等待或扫描；现有恢复/取消/焦点规则保持。新增测试修复前失败、修复后通过，真实 WebKit 筛选返回也恢复正确。 |

主要文件为 `src/i18n/malayContentRuntime.ts`、`LanguageRouteSync.tsx`、`contentApi.ts`、`publicDetailReuse.ts`、`usePublishedContent.ts`、`publicRoutePrefetch.ts`、CMS `publicContentRepository.ts`、`functions/_middleware.ts`、`publicDataProjection.ts`、`publicQuerySeed.ts`、`MobileBottomDock.tsx`、`useFloatingOcclusion.ts`、`ScrollToTop.tsx` 与 `vite.config.ts`。完整清单见 [files.txt](files.txt)。

## 同条件测量

Node 22.23.4 / npm 11.17.0，macOS 26.5.2 arm64，Chromium 147.0.7727.15；功能验收另用 WebKit 26.4。首页三语言、390/1440 视口各 3 个新 context 及同 context 刷新；受限网络 390 视口为 1.6 Mbps 下行 / 750 Kbps 上行 / 150 ms / CPU 4x，实际样本数见表。冷指浏览器 HTTP 缓存，不代表重启设备或清空 DNS。

最终资源对照在隔离浏览器中把正式域名映射到本地 HTTPS/同源构建，确认文档来自回环端口；临时 TLS 证书仅在进程内，未修改系统或生产配置。读取真实 gtag/destination 库；JS 与 CDP 双层阻断采集、转换、Beacon、写入及关闭页面的 keepalive。被禁止的采集端点（包括 Script 形式的转换上报）另列，不冒充已测生产业务传输。所有允许的 POST 仅为已确认只读的首页 bundle RPC。

分别记录应用就绪、品牌层实际退出、字体完成，以及此前已发起而仍在下载的资源。等待当前脚本与字体完成后汇总，避免遗漏 TAO 限制下的跨域字体。站内 JS 使用文件 gzip 总和；全部脚本/资源使用浏览器编码传输量，包含响应头，不能互换口径。内联启动脚本随 HTML 压缩，独立 gzip 仅用于说明其代码量，不重复算成独立网络请求。

| 资源口径 | 基线 | 修复后 |
| --- | ---: | ---: |
| 完整外部静态 JS 图（gzip） | 179.8 KiB / 24 模块 | 179.7 KiB / 22 模块 |
| 内联可执行启动代码（单独 gzip，非独立请求） | 4.0 KiB | 4.0 KiB |
| 英文手机首屏前已发起的站内 JS（gzip） | 418.0 KiB | 316.0 KiB |
| 英文手机全部脚本实际传输（含真实分析库） | 787.4 KiB | 685.1 KiB |
| 英文手机全部已获取资源实际传输 | 1,595.1 KiB | 1,492.8 KiB |
| 中文手机首屏前已发起的站内 JS（gzip） | 418.0 KiB | 316.0 KiB |
| 中文手机全部脚本实际传输（含真实分析库） | 787.4 KiB | 685.1 KiB |
| 中文手机全部已获取资源实际传输 | 3,768.7 KiB | 3,666.8 KiB |
| 马来语手机首屏前已发起的站内 JS（gzip） | 569.7 KiB | 572.0 KiB |
| 马来语手机全部脚本实际传输（含真实分析库） | 940.5 KiB | 943.0 KiB |
| 马来语手机全部已获取资源实际传输 | 1,842.8 KiB | 1,845.3 KiB |

以上手机冷缓存正常网络每组 n=3；全部允许资源已完成（pending=0）。中英文站内 JS 约减少 24.4%，不是仅把字典挪到首页马上下载；ms 仍需完整字典，站内 JS 增加约 2.3 KiB。静态预算本来已接近门槛，本轮只小幅减少 161 字节，没有调高门槛。

| 视口 / 语言 / 缓存 | 样本数（各版本） | 应用就绪 ms | 品牌层退出 ms | 实验室 LCP ms |
| --- | ---: | ---: | ---: | ---: |
| 390 / en / 冷 | 3 | 252 → 201 | 729 → 636 | 292 → 224 |
| 390 / en / 刷新 | 3 | 140 → 118 | 562 → 564 | 148 → 152 |
| 390 / zh / 冷 | 3 | 167 → 200 | 626 → 646 | 196 → 224 |
| 390 / zh / 刷新 | 3 | 386 → 401 | 830 → 830 | 404 → 412 |
| 390 / ms / 冷 | 3 | 696 → 993 | 1,149 → 1,428 | 732 → 1,008 |
| 390 / ms / 刷新 | 3 | 835 → 571 | 1,261 → 992 | 840 → 580 |
| 1440 / en / 冷 | 3 | 191 → 180 | 638 → 620 | 224 → 208 |
| 1440 / en / 刷新 | 3 | 140 → 146 | 578 → 586 | 160 → 156 |
| 1440 / zh / 冷 | 3 | 181 → 156 | 622 → 614 | 208 → 200 |
| 1440 / zh / 刷新 | 3 | 414 → 397 | 848 → 836 | 432 → 416 |
| 1440 / ms / 冷 | 3 | 705 → 676 | 1,171 → 1,111 | 744 → 692 |
| 1440 / ms / 刷新 | 3 | 573 → 559 | 1,001 → 988 | 588 → 572 |
| 390 / en / 冷 / 受限 | 2 | 5,471 → 5,160 | 6,643 → 5,594 | 6,258 → 5,184 |

上表均为中位数，逐样本范围见 CSV/JSON。正常网络的几十毫秒波动不代表稳定收益：ms 手机冷入 LCP 为 732 → 1,008 ms、品牌退出 1,149 → 1,428 ms；相反刷新有所改善，因此不宣称马来语首入提速。受限网络基线两次进入现有 degraded 状态，候选两次 ready；保留品牌效果，未加固定等待。
受限网络 LCP 范围为 6,244–6,272 → 5,120–5,248 ms，仍超过目标。主线程长任务总时长中位数 701 → 547 ms（n=2）；正常网络部分组无长任务、部分有波动，不宣称全部消除。

列表→详情→返回的五条采样流程 Event Timing 为 16–40 → 16–32 ms，不能当成用户群 INP。冷/热缓存、有限样本和本地适配器的时间不代表 Cloudflare 全球真实延迟。

六组首页（en/zh/ms × 390/1440）正文、图片地址/顺序均一致且无新增横向溢出；五组前后 PNG 的 SHA256 完全一致，中文 390px 存在像素差异，目视未见布局/内容变化，不能称为全部像素相同。中文手机前后图保留供复核；选取的原始截图见 [screenshots/](screenshots/)，全部比较摘要见 [screenshots.json](screenshots.json)。

原始汇总：[summary.json](summary.json)；逐语言、视口、冷热、网络的样本数/中位数/范围：[home-cohorts.csv](home-cohorts.csv)。不报告 Lighthouse 分数，不将少量实验室 Event Timing 当成真实 INP p75。

## 数据读取与内容一致性

- 18 个中/英/马来语详情/列表样本的正文与原图 URL、alt、顺序一致。材料当前分类响应从 382,259 降到 49,082 字节；详情与图库仍读取。HTML 材料 seed 从 65,693 降到 20,100 字节。
- 当前服务/博客详情独立 GET 被复用掉；相关内容仍需要完整列表，服务/博客各保留一次列表读取。联系页由 2 次变 0 次；ms 项目列表由 1 次变 0 次。ms 服务旧 HTML 备用路径仍有额外站点设置读取，未用不完整头部字段伪装完整设置。
- 实测服务全列表 203,318 → 201,915 字节；博客 337,326 → 336,287 字节。保留字段值和顺序全部相同，未宣称这是主要减重。
- 完整 SPA 博客列表后预取/进入详情，由 2 个详情 GET（当前及用户另一个指向目标）变 0；HTML 摘要进入详情仍需真实读取。家具列表进入 baseline 详情的 catalog 设置读取由 1 次变 0。联系链接 focus/hover/click 共用 1 次页面代码请求，共用 CSS 已就绪。
- CSS 产物逐字节一致；`index.html`、`public/_headers`、`public/_redirects`、`public/sw.js`、原图、内容数据文件、依赖及锁文件无差异。DOM/截图校验没有替代原有动画，也未降低图片质量或添加固定产品等待时间。

## 缩略图实验为何未采用

原图和缩略图本来可共用同一 URL 的缓存，不能把两个 img 元素算成必然两次传输。独立无损候选经真实文件、尺寸、像素及安全回退校验后，首版仍增加传输；再收紧到至少节省 35%，并复用已加载主图/邻图，仍在另一商品出现回退。

`slcfz-195-80x80cm-square-stainless-steel-folding-table`，390px/DPR3、同受限网络：基线首批/切图后均 822,320 字节，五次切图 41–81 ms；收紧后的候选首批 732,173 字节，但切图后 915,772 字节，第二/第四张约 916/986 ms。最终保留原图库，复测为 822,320 字节、五次 26–80 ms。该实验没有进入 PR 的产品代码或资源。

## 检查与边界

- 基线全量 301 文件 / 3,604 测试通过；修复后质量总检 307 文件 / 3,627 测试通过；整合最新 main 后再次运行完整质量检查，308 文件 / 3,641 测试通过，包括常规/严格核心类型、全仓 lint、架构、后台基础、98 路由交互、i18n 与用户技术文本检查。最后仅改入口工厂分组，另完成相关 lint/架构、12 项脚本回归、严格构建、预算和最终实际浏览器验收。
- 五项预算/构建防回归已接在现有 Interaction CI，另有七项发布控制脚本测试，共 12 项通过。未重复新增相同工作流。
- 严格生产构建从代码提交的独立 Git archive 运行原 prebuild 与 build，实际公开配置只读入进程，退出码 0；产物 receipt 记录同一提交。比较构建仅把版本文字固定为基线以控制压缩差异，不能用其本地版本接口冒充候选部署。
- 原公开性能检查在本地候选 Pages middleware 适配器及实际线上基线均通过，warnings/failures 为空；后者验证的是 c502ed54，不能证明本 PR 已在线上生效。
- Chromium/WebKit × 390/1440 的 29 个独立功能场景最终通过，包含 120 次三语言列表/详情直达、三语言首入/刷新、项目/博客筛选、家具第 2 页、详情返回/滚动、连续导航/POP、图库、菜单/联系面板、焦点和语言切换保留输入。360/390/768/1024/1440 断点往返保留输入且无新增横向溢出。
- 缺语言脚本后的现有安全刷新、离线 SPA 依赖失败后的恢复、省流/2g 跳过可选预取而正常点击仍可进入，3 项通过。没有提交咨询、付款、WhatsApp 或通知。故障触发的错误日志写入意图已被拦截。
- 连续强制换文档的附加压力序列仍有 WebKit 旧预取请求取消/访问控制错误记录；直达按新 Page、功能场景按独立 Context 严格验收，真实连续 SPA 导航仍在同 Page 测试，未过滤其错误。没有将压力失败或隔离重放通过写成“任何连续使用都无异常”。
- 验证过程中曾有测试工具问题：未压缩本地服务、HTTP 公共域名缺少安全上下文、回环 CSP、只读 RPC 的预检拦截等；无效尝试保留，最终使用本地 HTTPS/完整 CSP/正确只读预检重新测量，不混用其数字。质量检查也记录过已修复类型问题与一次 i18n 扫描导航竞态，修复/重跑通过后才计入结果。

## 剩余问题与未验证项目

1. 180 KiB 仍按仓库既有外部静态入口资源图执行；内联启动、首页立即加载的动态代码、分析库和字体成本另列。入口门禁通过不代表完整首文档或首页总成本已经低于 180 KiB。
2. 受限网络 LCP 仍高于 2.5 秒；完整首页脚本与外部字体仍较大，不能宣称全部性能解决。ms 保留必要翻译资源，新增边界有少量代码成本，未承诺所有语言体积都下降。
3. 缩略图节流方案因切图回退未采用。原有材料详情展示对象与返回完整 detail 对象不一致，是独立内容正确性问题，本轮未改变其显示结果。
4. ms 服务 no-script 文案标签不完整导致既有服务器 HTML transform 走 manifest 备用路径；保留原 metadata/readable fallback，只交接已成功读取的当前详情，未顺带修改翻译/SEO 文案。
5. 实际 Android、iPhone/Safari、真实马来西亚移动网络、Cloudflare 候选预览/CDN 边缘及部署后表现未验证。记录的出口 MY / colo SIN 仅是观测背景；本地映射不是马来西亚真机访问。
6. 移动端/桌面端真实用户 LCP、INP、CLS 的第 75 百分位均为 **NOT_MEASURED**。单次或少量合成样本不能证明所有用户顺畅。现有 sw.js 无离线 fetch 缓存，本轮只验证现有 SPA 故障恢复。

## 提交与回退

- `cd59e35a` perf(i18n): load Malay fallback content only for Malay routes
- `148d6ca9` perf(content): reuse complete public details and scope material reads
- `d90e6b03` fix(content): leave failed gallery hydration recoverable
- `0aa8b48d` perf(chrome): suspend hidden mobile dock observation on desktop
- `19ab391a` fix(content): isolate detail locales and retain stale display during refresh
- `49669c92` fix(i18n): preserve mounted page state across cold Malay switches
- `8688a55f` perf(content): hand off scoped material context and recoverable detail seeds
- `1ec2a1f2` fix(types): narrow optional material detail context explicitly
- `4281c653` fix(i18n): keep failed speculation separate from navigation recovery
- `6c08a032` fix(navigation): record focus scroll before fast route activation
- `76702a79` perf(build): co-locate mandatory icon factory with the shell runtime

最新 main 整合记录：`c1b51ce5099e61b5eb687af32cbd3f88476c4402`；此合并只把远程已完成工作带入本分支，未合并本分支到 main。验证脚本和报告为后续单独证据提交。

当前修改仅在独立分支/草稿 PR，main 和线上未更新，不需要生产回滚。当前可直接保留或关闭草稿 PR；如未来需要撤销这些代码，在新的干净工作树按以下明确的本任务代码提交逆序审查回退：`git revert --no-commit 76702a79 6c08a032 4281c653 1ec2a1f2 8688a55f 49669c92 19ab391a 0aa8b48d d90e6b03 148d6ca9 cd59e35a`，复核差异和测试后提交。不要回退 main 整合提交或使用包含其他任务的宽泛提交区间。不要对原有脏工作区 reset、强推或整目录覆盖。

Architecture Compliance Report:
1. Target module: system 公共运行支持、既有 cms 公开读取及 services/projects/materials/blog 的展示适配。
2. Target layer: 前端组件/hooks/i18n/lib、Pages HTML 交接、既有 CMS repository 与构建验证层。
3. Edited files: 见 files.txt；没有新增一级业务模块。
4. Forbidden files touched: no；图片、样式、依赖、迁移、权限、生产配置均未修改。
5. API paths changed: no；HTML 内部 seed 新增有界详情上下文，不新增 HTTP API。
6. Database access changed: yes，仅公开已发布 SELECT 的列投影/分类条件；没有写入、schema 或权限变更。
7. Cross-module dependency introduced: no 新业务域依赖；共享 runtime 延续既有公开页面加载/数据边界。
8. Business behavior changed: no；保持内容、三语言规则、排序、图片、导航、表单与品牌效果。
9. arch:check result: passed；原有已登记架构债务警告仍存在。
10. Remaining architecture risk: 同步 mapper 必须在 ms 资源就绪后使用；缓存复用必须继续遵守语言、字段完整性、时间与失效约束。
