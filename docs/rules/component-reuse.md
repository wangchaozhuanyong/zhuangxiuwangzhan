# 组件复用和设计系统规则

Flashcast 禁止每个页面重复造同一种 UI。复用优先级高于临时复制粘贴。

## 必须优先复用

- `SchemeANavbar`、`SchemeAFooterPrelude`、`SchemeAFooter`（`src/components/scheme-a/SchemeAPublicChrome.tsx`）
- `MobileBottomDock`、`FurnitureFloatingLink`（共享悬浮避让，禁止按页面添加例外）
- `PublicResultsBoundary`、`SchemeAContentState`、`PublicReadError`（列表状态、首次错误与重试）
- `RouteReadFeedback`（统一刷新、失败、离线反馈）
- `useSiteSettingsQuery`（公开页面与后台设置共用真实读取结果）
- `PageMeta`
- `DynamicBrandHead`
- `SmartImage` / `DeferredSmartImage`
- `src/components/ui` 下的基础控件
- `src/components/admin` 下的后台表格、弹窗、表单、空状态、权限组件

## 复用判断

- 同类 UI 出现 2 次：必须考虑抽公共组件或配置。
- 同类 UI 出现 3 次：必须抽公共组件或统一配置。
- 同类业务逻辑出现 2 次：应放入 `src/lib`、`src/hooks` 或对应 `src/backend/modules/<module>`。
- 同类配置出现 1 次以上并可能复用：应放入 `src/config` 或对应配置文件。

## 设计系统

- 设计参考来源遵守 `AGENTS.md` 的“设计参考来源与共享布局”：历史方案不自动成为本轮基准，附件正文与预览外壳分开判断。
- 当前公共布局以 `src/App.tsx` 实际挂载的组件为准；导航、语言切换、公共咨询区、页脚和手机底栏必须真实复用，不能从旧预览或附件复制一套外观相似的实现。
- 颜色、字体、圆角、阴影、间距优先看 `tailwind.config.ts` 和 `src/styles/base.css`。
- 后台页面优先复用 `src/components/admin`。
- 基础控件优先复用 `src/components/ui`。
- 公共按钮圆角统一读取既有 `--radius`；按钮样式归 `buttons.css` 和组件样式，区块间距文件只负责间距，颜色皮肤只负责颜色。禁止继续用全站 `!important` 覆盖组件圆角。
- 新增设计 token 前必须说明为什么现有 token 不够。

## 禁止事项

- 禁止每个页面单独写一套按钮、卡片、表格、弹窗、空状态、loading、错误提示。
- 禁止复制一大段 Tailwind class 到多个页面后不抽组件。
- 禁止绕过现有后台组件另写一套后台 UI。
- 禁止为了一个页面随机新增新颜色、新阴影、新圆角、新字体。
- 禁止未经确认改变全站视觉风格。
