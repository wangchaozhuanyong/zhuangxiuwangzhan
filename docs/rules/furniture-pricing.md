# 家具展示定价规则

适用范围：本网站的家具展示目录（`/zh/furniture`、`/en/furniture` 及商品详情）。独立商城有自己的商品与定价流程。

来源批发价审计文件只保存在项目本地，并由 `.gitignore` 排除；公开仓库和部署产物不得包含该文件。

- `src/data/furniturePriceAudit.json` 的 `products[*].price` 保存来源网站采集到的**批发价**，作为唯一的原始价格。更新来源价格时只改此文件，并更新 `capturedAt`；不要把已经翻倍的展示价写回原始价格。
- `src/data/furnitureCatalog.json` 的 `products[*].price` 保存前台**展示价**：原始批发价乘以 **2**。价格区间的两端分别乘以 2，保留 `RM`、千位分隔符和两位小数。中文、英文列表及详情页共用这一个展示价。
- 来源没有价格时，原始价格与展示价均为 `null`，前台显示“价格请咨询”或对应英文文案；不得推测价格。
- 每次采集新商品或更新价格后，先在项目本地更新未纳入 Git 的批发价审计文件，再运行 `node scripts/build-furniture-catalog.mjs --prices` 和 `node scripts/build-furniture-catalog.mjs --check-prices`。普通目录采集及图片更新也会在保存目录时从原始价格重算，因此重复运行不会再次翻倍。
- 核对有价商品、价格区间及无价商品在中英文列表和详情页的显示。未经用户授权不推送或部署。
