# Codex 任务：KL 电子锁组合页做厚 + 三页分工 + L5 暂缓

> 生成日期：2026-11-21
> 前置状态：L1 / L2 / L3 / L4 已上线并已由 Lead 独立核实通过
> 本任务**不包含** L5（9 个区域页），原因见第五节

---

## 一、前置核实结果（Lead 实测，供 Codex 对照）

| 项目 | 实测 |
|---|---|
| L1 型号页 | 54/54 全部 HTTP 200；51 个有 `Product` schema；54 页均有价格；文本 7,326–24,785 字符，均值 15,756 |
| L2 首页 | 每页恰好 1 个 `h1`，已为品类词；**每页 17 个型号页 `<a href>` 链接** |
| L3 sitemap | 54 条，zh/en/ms 各 18；216 个 hreflang 标签 |
| L4 `llms.txt` | 200，`text/plain; charset=utf-8`；17 个型号价格与附录逐项一致（G13 = 635.20） |

L2 的静态型号索引解决了内链孤岛问题，这一点已确认。

---

## 二、本次要解决的三个问题

### 问题 1：KL 组合页太薄

`/zh/locations/kuala-lumpur/digital-lock` 现状：

```
可见文本   1,221 字符（zh）
           2,459 字符（en）
结构       2 个 h2 + 1 个 h3
```

对照：子域型号页均值 15,756 字符，问题是 H2 + FAQ + 同价对比。

**用这个模板复制到 9 个区，等于主动生产 9 个低质页。**

### 问题 2：三个页面在抢同一个词

| 页面 | 当前 title |
|---|---|
| `flashcast.com.my/en/services/digital-lock` | Digital Lock Installation KL \| Supply & Install |
| `flashcast.com.my/en/locations/kuala-lumpur/digital-lock` | Digital Lock Installation Kuala Lumpur |
| `locks.flashcast.com.my/en/` | （h1）Digital Lock Kuala Lumpur & Selangor |

三个页面、两个 host，同抢 `digital lock KL`。

### 问题 3：ms 版是英文内容

```
/ms/locations/kuala-lumpur/digital-lock
  字符数   365
  h1       "Digital Lock Installation Kuala Lumpur | FLASH CAST"
  正文     全英文，无一处马来语
```

当前被 `hasCompleteMalayContent` 标为 `noindex, follow` 且不在 sitemap —— 系统保护生效了，但这是用户访问时可见的缺陷。

---

## 三、任务 A：把 KL 组合页做厚

### 目标

`/zh/` 与 `/en/` 的 KL 组合页从 1,221 / 2,459 字符提升到 **2,500 字符（zh）/ 600 词以上（en）**。

### 建议结构

```
h2  {区名}换电子锁，先确认这三件事
h2  公寓入户门的门型与门位
h3    常见三种门型的适配差异
h3    门厚与门框宽度要量什么
h2  管理处审批：要准备什么
h3    装修押金与施工时段
h3    钻孔与改门框的申报
h2  有地住宅与排屋的差异
h2  安装当天流程与验收
h2  常见问题（问句式 H2/H3）
h2  其他区域
```

### 内容约束（重要）

| 允许写 | 不允许写 |
|---|---|
| 门型分类与适配条件（技术事实） | 「已服务 XX 公寓 300 户」等安装数量 |
| 公寓装修需管理处审批（通用事实） | 具体楼盘名称作为「已服务案例」，除非业主确认 |
| 安装流程、验收项目 | 任何未经确认的客户名单 |
| 价格区间（引用子域已有数据） | 编造的市场份额、排名 |

**原因**：这些页面是公开商业声明，编造服务履历会有实际风险。业主确认过的信息才能写进「案例」。

### 技术注意

- 内容来源若走模板，模板必须在 `functions/_middleware.ts` 或对应渲染路径里可预注入
- 参考已完成的区域页预注入（PR #347）与型号页做法，确保初始 HTML 含正文
- 用 `<ul>` 不用 `<table>`：预注入的 `sanitizeReadableContent` 白名单不含 `table`，列表会保留

---

## 四、任务 B：三页分工

调整 metadata 与内链，让三个页面各有明确主战场，不再互相竞争。

| 页面 | 定位 | 主关键词方向 |
|---|---|---|
| `locks.flashcast.com.my/{lang}/` | 产品目录：17 款、价格、型号对比 | ANZHE 品牌词、型号词、`digital lock price` |
| `flashcast.com.my/{lang}/services/digital-lock` | 服务说明：安装流程、门型适配、报价方式 | `digital lock installation`（不含地名） |
| `flashcast.com.my/{lang}/locations/{area}/digital-lock` | 本地化：该区门型特点、管理处口径、进场条件 | `digital lock {区名}` |

### 具体动作

1. 主站服务页 title 去掉 `KL`，改为不含地名的服务词
2. KL 组合页 title 保留地名，且与子域首页的 H1 措辞区分开
3. 三个页面之间建立内链：服务页 → 组合页（按区域查看）；子域首页 → 主站服务页（已有）；组合页 → 子域型号页
4. 检查 canonical 无互指错误

---

## 五、明确不做：L5 的 9 个区域页

**暂不登记 `/locations/{area}/digital-lock` 的 9 个新组合。**

### 理由

1. 现有模板太薄（见问题 1），复制 9 份 = 9 个薄页面
2. 三页已在抢同一词，再加 9 个是把竞争放大 9 倍
3. 原始方案自己写明「避免一次堆太多变成 doorway」

### 什么时候可以做

任务 A 与 B 上线 **4 周后**，看 KL 组合页的 GSC 数据：

- 有曝光、有排名 → 按同一标准复制到其余 9 区
- 无曝光、无排名 → 说明这条路不通，9 个页面也救不了

### 业主需提供的前置资料

若之后要做，每区需要业主确认该区**实际服务过的楼盘类型**（不是楼盘名单，是类型：高层公寓 / 服务式公寓 / 排屋 / 半独立）。没有这个，「本地独有内容」只能是换区名的模板。

---

## 六、验收标准

### 任务 A

- [ ] `/zh/locations/kuala-lumpur/digital-lock` 初始 HTML 可见文本 ≥ 2,500 字符
- [ ] `/en/locations/kuala-lumpur/digital-lock` 初始 HTML 可见文本 ≥ 4,000 字符
- [ ] 两页均有 ≥ 5 个 h2，且至少 2 个为问句式
- [ ] 初始 HTML 含 `data-flashcast-readable-body` 标记
- [ ] 页面不含任何未经业主确认的楼盘名或安装数量
- [ ] `npm run verify:seo-html` 通过

### 任务 B

- [ ] 三个页面的 title 无重复关键词堆叠
- [ ] 三页互链存在且方向正确
- [ ] 每页 canonical 自指
- [ ] `/en/services/digital-lock` 的 title 不含 `KL` 或 `Kuala Lumpur`

### 任务 C（ms 版）

- [ ] `/ms/locations/kuala-lumpur/digital-lock` 正文为马来语
- [ ] 若马来语内容不完整，保持 `noindex, follow`（不要强行放出）
- [ ] h1 不得为英文标题

---

## 七、不要做的事

| 禁止 | 原因 |
|---|---|
| 现在登记 9 个区域组合 | 薄页面 + doorway 风险，等数据 |
| 给 KL 组合页写编造的服务案例 | 公开商业声明，需业主确认 |
| 用 `<table>` 承载正文表格 | 预注入白名单不含 table，会被剥掉 |
| 强行给 ms 版解除 noindex | `hasCompleteMalayContent` 门槛是有意义的 |
| 改子域型号页内容 | L1 已验收通过，不要回改 |
| 用 `qualification: ineligible` 排除页面 | 触发 `seo_manifest_unqualified` 全局报错 |
