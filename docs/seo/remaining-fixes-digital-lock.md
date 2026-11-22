# 电子锁项目 · 剩余收尾事项（全部）

> 生成：2026-11-22
> 现状：子域 72 页、主站 20 区域页、内容与性能修复全部完成
> 本文只列**还没做的**，已完成的不再重复

---

## 一、值得做：主站服务页内链（1 项）

### 问题

`/zh/services/digital-lock`、`/en/services/digital-lock` 是主站流量最大、权重最高的电子锁入口，但它现在是孤岛：

| 现状 | 后果 |
|---|---|
| 不链接 51 个型号页 | 主站权重传不到子域 |
| 不链接 12 个品类页 | 用户找不到"按门型选" |
| 不链接 20 个区域页 | 区域页只能从 sitemap 被发现 |

GSC 里 crawled 的路径会从主站服务页断掉，型号页只能靠子域首页和 sitemap 被发现。

### 修法

在 CMS 正文末尾插入两个模块，**不需要改 React 代码**，走后台 bodyHtml：

**模块 1：按门型选（链品类页）**

```html
<section class="seo-rich-block">
<h2>按门型与功能选择</h2>
<p>ANZHE 电子锁按安装位置与开锁方式分组，点进对应页面可以看到该品类的全部型号、含安装价与选择要点。</p>
<ul>
<li><a href="https://locks.flashcast.com.my/zh/lock/type/entrance-door/">入户门电子锁（14 款）</a></li>
<li><a href="https://locks.flashcast.com.my/zh/lock/type/interior-door/">室内门电子锁（2 款）</a></li>
<li><a href="https://locks.flashcast.com.my/zh/lock/type/aluminium-door/">窄框铝门电子锁（1 款）</a></li>
<li><a href="https://locks.flashcast.com.my/zh/lock/feature/face-recognition/">人脸识别电子锁（10 款）</a></li>
<li><a href="https://locks.flashcast.com.my/zh/lock/feature/palm-vein/">掌静脉电子锁（9 款）</a></li>
<li><a href="https://locks.flashcast.com.my/zh/lock/feature/video-intercom/">可视对讲电子锁（6 款）</a></li>
</ul>
</section>
```

**模块 2：按区域查看（链区域页）**

```html
<section class="seo-rich-block">
<h2>按安装区域查看</h2>
<p>以下区域的页面写有该区常见的门型、铁闸间距与管理处施工规定，选型前可以先看自己所在区域的部分。</p>
<ul>
<li><a href="/zh/locations/kuala-lumpur/digital-lock">吉隆坡电子锁安装</a></li>
<li><a href="/zh/locations/petaling-jaya/digital-lock">八打灵再也电子锁安装</a></li>
<li><a href="/zh/locations/cheras/digital-lock">蕉赖电子锁安装</a></li>
<li><a href="/zh/locations/subang-jaya/digital-lock">梳邦再也电子锁安装</a></li>
<li><a href="/zh/locations/mont-kiara/digital-lock">Mont Kiara 电子锁安装</a></li>
<li><a href="/zh/locations/bangsar/digital-lock">Bangsar 电子锁安装</a></li>
<li><a href="/zh/locations/puchong/digital-lock">蒲种电子锁安装</a></li>
<li><a href="/zh/locations/selangor/digital-lock">雪兰莪电子锁安装</a></li>
<li><a href="/zh/locations/shah-alam/digital-lock">莎阿南电子锁安装</a></li>
<li><a href="/zh/locations/kajang/digital-lock">加影电子锁安装</a></li>
</ul>
</section>
```

英文版把路径换成 `/en/...`，文案换成英文：

```html
<section class="seo-rich-block">
<h2>Choose by door type and function</h2>
<p>ANZHE locks are grouped by where they are fitted and how they open. Each page lists every model in that group with the installation-inclusive price.</p>
<ul>
<li><a href="https://locks.flashcast.com.my/en/lock/type/entrance-door/">Entrance door digital locks (14 models)</a></li>
<li><a href="https://locks.flashcast.com.my/en/lock/type/interior-door/">Interior door digital locks (2 models)</a></li>
<li><a href="https://locks.flashcast.com.my/en/lock/type/aluminium-door/">Narrow frame aluminium door locks (1 model)</a></li>
<li><a href="https://locks.flashcast.com.my/en/lock/feature/face-recognition/">Face recognition locks (10 models)</a></li>
<li><a href="https://locks.flashcast.com.my/en/lock/feature/palm-vein/">Palm vein locks (9 models)</a></li>
<li><a href="https://locks.flashcast.com.my/en/lock/feature/video-intercom/">Video intercom locks (6 models)</a></li>
</ul>
</section>

<section class="seo-rich-block">
<h2>Browse by installation area</h2>
<p>Each area page covers the door types common there, gate clearances, and building management rules for drilling work.</p>
<ul>
<li><a href="/en/locations/kuala-lumpur/digital-lock">Digital lock installation Kuala Lumpur</a></li>
<li><a href="/en/locations/petaling-jaya/digital-lock">Digital lock installation Petaling Jaya</a></li>
<li><a href="/en/locations/cheras/digital-lock">Digital lock installation Cheras</a></li>
<li><a href="/en/locations/subang-jaya/digital-lock">Digital lock installation Subang Jaya</a></li>
<li><a href="/en/locations/mont-kiara/digital-lock">Digital lock installation Mont Kiara</a></li>
<li><a href="/en/locations/bangsar/digital-lock">Digital lock installation Bangsar</a></li>
<li><a href="/en/locations/puchong/digital-lock">Digital lock installation Puchong</a></li>
<li><a href="/en/locations/selangor/digital-lock">Digital lock installation Selangor</a></li>
<li><a href="/en/locations/shah-alam/digital-lock">Digital lock installation Shah Alam</a></li>
<li><a href="/en/locations/kajang/digital-lock">Digital lock installation Kajang</a></li>
</ul>
</section>
```

### 发布方式

这是主站内容表，**禁止脚本直写**。两条路径：

| 路径 | 条件 |
|---|---|
| 后台 CMS 手动粘贴 | 你现在就能做，两页共 4 段 HTML |
| `content-publish` Edge Function | 需要 `CONTENT_PUBLISH_SECRET` 或管理员 Bearer token |

### 验收

- [ ] `/zh/services/digital-lock` 页面可见文本增加，且含 16 个对外链接
- [ ] `/en/services/digital-lock` 同上
- [ ] 16 个链接全部指向 200 页面（无死链）
- [ ] 页面 canonical / title / description 未被改动
- [ ] 发布后前台真实显示（不能只看后台保存成功）

---

## 二、可做可不做（3 项，收益都很小）

| # | 事项 | 为什么可跳过 |
|---|---|---|
| 1 | 子域加可见面包屑（首页 › 品类 › 型号） | schema 已有 BreadcrumbList，Google 已经在用；可见面包屑主要是交互体验 |
| 2 | 子域 sitemap 加 image 扩展 | 型号图不是用户搜图的目标，图片搜索收益接近 0 |
| 3 | 子域友好 404 页 | 现在返回纯文本 "Not found"，状态码正确；换成带导航的 404 只影响极少数误入用户 |

这三项做了不会让排名变化。要省事就全跳过。

---

## 三、不是 Codex 的活（3 项）

| # | 事项 | 卡在什么 |
|---|---|---|
| 1 | 博客 6 篇发布（12 个网址，现全 404） | CMS 后台人工确认发布 |
| 2 | 17 款 GBP 商品上传 | Chrome 扩展文件权限 / 或手动逐个上传 |
| 3 | 评价 2 → 15 条 | 需要联系真实客户 |

---

## 四、明确不做的（1 项）

**首页 LCP 4.11s**。测的是 Slow 4G 模拟数据，不是真实用户；首页不抢品类词；从 6.01s 已经降到 4.11s。再降要改目录区渲染方式，成本远大于收益。

监控方式改成看 GSC 的 Core Web Vitals 真实数据，连续两周「需改进」超过 20% 再动。

---

## 五、结论

**Codex 能做的只剩第一项的一半**（内容由上面提供，它负责发布或你自己粘）。

其余全部是人工运营动作或已经决定不做。

这条线到此可以封版。
