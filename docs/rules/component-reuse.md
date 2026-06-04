# 组件复用和设计系统规则

Flashcast 禁止每个页面重复造同一种 UI。复用优先级高于临时复制粘贴。

## 必须优先复用

- `Navbar`
- `Footer`
- `FloatingCTA`
- `MobileActionBar`
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

- 颜色、字体、圆角、阴影、间距优先看 `tailwind.config.ts` 和 `src/styles/base.css`。
- 后台页面优先复用 `src/components/admin`。
- 基础控件优先复用 `src/components/ui`。
- 新增设计 token 前必须说明为什么现有 token 不够。

## 禁止事项

- 禁止每个页面单独写一套按钮、卡片、表格、弹窗、空状态、loading、错误提示。
- 禁止复制一大段 Tailwind class 到多个页面后不抽组件。
- 禁止绕过现有后台组件另写一套后台 UI。
- 禁止为了一个页面随机新增新颜色、新阴影、新圆角、新字体。
- 禁止未经确认改变全站视觉风格。
