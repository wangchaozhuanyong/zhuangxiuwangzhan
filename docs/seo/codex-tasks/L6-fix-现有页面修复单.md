# L6-fix · 现有页面内容与图片修复单

> 投放对象：Codex
> 性质：**只修现有页面，不加页面、不改 URL 结构**。改完 URL 总数仍然是 72。
> 前置：L7 已上线

---

## 背景

L1 / L6 / L7 上线后，实测发现四个问题。全部是已上线页面本身的缺陷，不涉及新功能。

| # | 问题 | 实测值 |
|---|---|---|
| 1 | 品类页正文太薄 | 入户门 986、室内门 592、铝门 581、人脸 859、掌静脉 799、对讲 734 字符 |
| 2 | 九个新区域页中文比英文薄一半 | zh 1,552–1,708，en 2,740–3,244，KL 既有页 2,953 |
| 3 | 首页 76 张型号缩略图 `alt` 为空 | 104 张 img 中 76 张 `alt=""` |
| 4 | 品类页卡图全部 `loading="eager"` | 14 张卡图同时 eager，拖累 LCP |

---

## 一、品类页正文补充

**文案文件**：`docs/seo/anzhe-lock-category-body.json`

结构：`zh["type/entrance-door"]["doorCheck"]` 等，键名对应页面现有章节：

| 键 | 对应 h2 |
|---|---|
| `doorCheck` | 先量门厚与锁体位置 |
| `accessChoice` | 按家人习惯选开锁方式 |
| `handleStyle` | 比较把手与上锁方式 |
| `privacyUse` | （室内门）房内反锁与分租管理 |
| `whatSkip` | （室内门）室内门不需要什么 |
| `cutoutAndSwing` | （铝门）锁孔与开启方向 |
| `glassFrame` | （铝门）玻璃铝框的固定点 |
| `whoFits` | （人脸/掌静脉/对讲）适用场景 |
| `enrolNote` | （掌静脉）录入注意 |
| `screenAndCamera` | （对讲）屏幕与摄像头 |
| `remoteNote` | （对讲）远程功能 |

要求：

- 把每节的 HTML 段落**追加**到对应章节现有段落之后，不要整节替换
- 型号卡、价格、FAQ 保持不动
- 只处理 zh；en / ms 的对应扩充不在本次范围

目标：品类页可见文本从 581–986 提升到 **1,300–1,800**。

---

## 二、区域页中文补充

**文案文件**：`docs/seo/anzhe-lock-area-body-extra.json`

结构：`zh["petaling-jaya"]` 为一段 HTML，直接追加到该区域中文 `body` 末尾。

九个键对应九个区域：

```
petaling-jaya  cheras  subang-jaya  mont-kiara  bangsar
puchong  selangor  shah-alam  kajang
```

要求：

- 追加到 `src/components/services/serviceAreaPageText.json` 对应路径的 `zh.body` 数组末尾
- 不要动 en、不要动已有段落、不要动 title / description / answer
- 不要碰 `kuala-lumpur`（那页是既有内容）

目标：九个区域中文可见文本从 1,552–1,708 提升到 **1,900–2,100**。

---

## 三、首页缩略图 alt

首页三语（`public/anzhe-showroom/{zh,en,ms}/index.html`）的型号索引缩略图现在是：

```html
<img src="../assets/thumb-f8.webp" alt="" decoding="async" loading="lazy" width="160" height="102" ...>
```

`alt=""` 对装饰图是合规的，但这 76 张是**型号产品缩略图**，应该带描述。

要求：

- 改成 `alt="{型号} · 产品缩略图"`（en 用 `{model} · product thumbnail`，ms 用 `{model} · imej kecil produk`）
- 型号名从现有 `lockCatalog` 的 `name` 取，不要手打
- 不要改其它属性（`width` / `height` / `loading` / `sizes` 保持不动）
- 三语各 76 张，改完用 grep 确认 `alt=""` 数量为 0

---

## 四、品类页卡图加载优先级

品类页现在 14 张型号卡图全部：

```html
loading="eager" fetchpriority="auto"
```

要求：

- 前 **2 张**保持 `loading="eager" fetchpriority="high"`
- 第 3 张起改为 `loading="lazy" fetchpriority="low" decoding="async"`
- 序号按生成顺序，不要按型号名排序

---

## 五、硬性约束

```
不改任何 URL 结构
不改 pagePath 正则
不改 functions/_middleware.ts
不改 src/** 的 React 组件
不加新页面
不碰 ms 的 noindex 设置
不碰 sitemap 条数（仍为 66）
```

---

## 六、验收标准

- [ ] 62 个受影响页面（6 品类 × 3 语 + 9 区域 × 2 语 中的 zh 部分 + 3 首页）重新生成后线上 200
- [ ] 品类页可见文本：入户门 ≥1,700、室内门 ≥1,300、铝门 ≥1,200、人脸 ≥1,400、掌静脉 ≥1,300、对讲 ≥1,300
- [ ] 区域页 zh 可见文本：九个区全部 ≥1,900
- [ ] 首页 `alt=""` 数量为 0，三语各 76 张缩略图均有 alt
- [ ] 品类页卡图：首 2 张 `fetchpriority="high"`，其余 `fetchpriority="low"` 且 `loading="lazy"`
- [ ] URL 总数仍为 72（3 首页 + 51 型号 + 18 品类）
- [ ] sitemap 仍为 66 条
- [ ] 页面 HTML 结构未变（h1 数量、canonical、hreflang 与改前一致）
- [ ] `node scripts/generate-anzhe-boot.mjs --check` 通过
- [ ] `npx playwright test e2e/anzhe-showroom-lock-pages.spec.ts` 通过
- [ ] `npm run arch:check` / `typecheck` / `lint` / `verify:interaction-standards` 通过

---

## 七、必须输出的报告

```text
## 修改前后可见文本对比
| 页面 | 改前 | 改后 | 达标 |

## 首页 alt 修复
| 语言 | 改前 alt="" 数量 | 改后 |

## 品类页卡图优先级
| 页面 | eager 数量 | lazy 数量 | 前 2 张 fetchpriority |

## URL 与 sitemap 数量核对
改前 72 / 66，改后 ? / ?

## 未完成项
```

---

## 八、边界

| 情况 | 处理 |
|---|---|
| 某节文案追加后与现有段落语义重复 | 报告指出，不要自行删除现有段落 |
| 追加后页面超过 40KB | 说明是哪一页，不要为了压大小删正文 |
| alt 改动影响现有图片测试 | 更新测试而不是回退 alt |
| 区域页 zh 追加后与 en 长度差距仍大 | 照实报告数字，不要机翻补 en |
