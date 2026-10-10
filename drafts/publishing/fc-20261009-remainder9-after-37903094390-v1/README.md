# 固定余九行：三个真实停止 run 之后的单向续发

本注册表只包含原始 20 行冻结注册表中的 c07–c15，共 9 行、9 份实际 QA。前 11 行永久排除，来源严格按 2/7/2 绑定三个 run、原 SHA 和完整 31 字段许可 tuple。

## 已冻结的真实只读证据

`completed-eleven-rechecked-proof.json` 是 2026-10-09 原证明，保持原字节与 SHA-256 `bc6ac21909e661f26f25b0a85fbee20b653b7f41e243b3b49f7457fbcdb13c63`。原 fixed9 绑定另原样保存为 `registry-observed-20261009.json`。两者不因后续产品源码改变而改写。

2026-10-10 当前绑定采用独立的 `completed-eleven-current-renderer-proof-20261010.json` 与 `renderer-source-review-20261010.json`。本轮实际只读重新核对 11 行 desired/retained/saved CAS、13 份 QA、11 个唯一 completed 许可，剩 9 行原 baseline/CAS/QA 与零 active permit，并回读前 11 行 22 个真实双语正文页。该线上观察版本严格为 `2f055035d469c02833a8dd7025ddb8b2223c0b8c`。产品候选 `8eb9f8061926bcacb15dea952097649511977a60` 在证明生成时仅本地审核，未部署；不得把旧版本回读当作新候选线上验收。

新候选独立审查绑定读取链 7 文件、实际正文管线 7 文件与实际元信息闭包 42 文件，离线 18 份正文候选及 9 个严格反例已通过。元信息分别派生实际 Edge 原 HTML 和实际 mapper→页面→PageMeta 的 hydrated 结果，并绑定匿名 `site_settings.default` 当前 company/brand/updated_at。旧屋翻新实际专用路由的 hydrated 标题取固定页面字典，原 HTML 标题取 CMS；该既有差异按实际路由分别派生。前 11 行中的其他 mapper 路由元信息输入逐字等于原审核值；设计页中文版的新品牌前缀/关联说明按新源码派生。剩余 c08 中文 mapper 翻译，以及 c11/c12 英文 Edge 文案过滤，导致 raw/hydrated 合理不同，分别严格全等校验，原 CMS QA/CAS 字段不变。

- `37893433883` / `9f446c6fbe2348105549dae51293a27c3648abc9`：原 2 行 saved；原 v18 receipt 仍为 false。
- `37898568406` / `15fdefac8abfed413e5f1d8ba6089420f53333fd`：7 行 saved；原 c04 body receipt 仍为 false，保留原 9 条 missingRequired。
- `37903094390` / `03e840c4b1aa91de1d12b309af364ca3dd985fe5`：2 行 saved；原 c06 body receipt 仍为 false，保留原 12 条 missingRequired。

三个原始 `FAILED_STOPPED` summary 完整保存。最新页面通过不把旧 run 改写为成功。首次 issuer preview 的 receipt bytes 曾被 execute 覆写，本证明不声称其与最终磁盘 bytes 相同。

## 每次执行仍须重新检查

入口 `scripts/publish-remainder9-after-37903094390.mjs` 仅接受 mode/artifact-dir。固定 18 份候选先经过实际产品 mapper/translate/sanitizer 的离线 Chrome 契约，必须全部 PASS 且管线源码指纹匹配；该 receipt 标记 fixtureOnly=true、livePageAcceptance=false。随后 fresh 读取前 11 行的 desired/retained/CAS 与 13 份 QA，实际公开页面 22 份正文和 metadata 必须全部通过，才能发起任何新 preview、permit 或 write。publish 另先私读前 11 个 completed 许可完整 tuple 并拒绝重复、issued/writing/uncertain 残留；dry-run 不加载 service-role 或 issuer。

每次运行先拒绝不匹配的源码，再重新 GET 固定公开身份；身份变化必须重新审查元信息，不能继续 preview。前 11 行和新九行都分别检查原 HTML 与 hydrated 标题/描述字符串全等，以及真实正文每段原文可见。原 2 行既定 special-heading 策略保留。当前 main 运行 SHA 必须等于实际部署版本。没有任意 skip、旧 completed 许可重放或 rollback 入口；只读证明不等于新九行已发布。

旧 fixed18/fixed11 的历史纯读取仅用于保留原证明和回归测试；原执行入口仍立即校验当时冻结源码，在新 renderer 上严格拒绝运行。
