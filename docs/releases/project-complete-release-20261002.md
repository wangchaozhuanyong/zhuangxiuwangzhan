# 2026-10-02 项目已完成改动统一发布

用户明确授权汇总本项目已完成待发布改动、合并 main、统一部署并验证上线。
发布前 main 和线上版本：`f7216cd921735964e266fa1f2cd5832ad4e2746a`；原部署运行 `36989198251` 已成功。
隔离候选位于项目 `.worktrees/project-release-20261002`；源码快照保留在 `backups/project-release-20261002`，运行证据保留在 `audits/project-release-20261002`。

## 发布范围

| 交付 | 结果与来源 |
| --- | --- |
| 全屏图片导航统一字色 | 使用统一深色文字与浅色半透明导航底，标志仍单独适应图片；保留首页、设计、维修页面原图。 |
| A 暖砂分栏首屏 | 桌面图文连续面板、暖砂底、资料细分隔与继续浏览入口；手机保留上下阅读布局。 |
| A 曜石香槟商城入口 | 桌面264×88、平板228×72、手机76×76；保留悬停、键盘、触摸和商城新窗口行为。 |
| 首页流光归位 | 首次首页就绪后等待350ms播放，电脑1600ms、手机1200ms；刷新可重播，站内导航不重播；用户操作取消，减少动态效果时只描亮边框。 |
| 中文展示标签 | `14e98ef8bb189107d680eb59d7bd9178d14a4cd1`，补齐装修承包商和定制内嵌家具标签，不改变英文源文案。 |
| 旧屋 FAQ 同源 | `d152bb54c383e5f0b8680807cb47f41b130283bb`，旧屋静态页面的双语5条可见FAQ与服务端JSON-LD使用同一份文案；其他服务继续使用CMS FAQ。 |
| 七个地区页咨询 | `63a97062349a5c7ad0272f9759a97cb13e0db362`，Balakong、Klang、Sungai Buloh、Desa ParkCity、Semenyih、Putrajaya、TTDI使用“房产类型示例”标签，WhatsApp入口带地区、项目类型和范围补问。 |

前四项来自本窗口已完成源码快照，10个文件在隔离候选中逐文件SHA256一致。后三项来自当前生产基线上的独立提交，逐项检查差异并重新验证。
已有 #161/#162 中的图片贴边、圆角、统计边界、材料正文、博客内链、旧屋正文等保留，不重放旧候选；旧 D 款/旧长条入口以用户最新 A 方案为准。
Rawang/Seri 源绑定工作区在盘点时仍有未提交修改，且没有本项目内完成验收记录，保留原样。历史演示稿、构建生成物和未确认 CMS 内容草案不作为完成代码提交。本次不发布 CMS、不改数据库、依赖、权限、密钥、DNS或托管配置。

## 实际检查与发布路径

- Node22.20.0：类型、完整lint、架构、多语言、界面技术字段检查通过。
- 12个相关测试文件193项测试通过；6项发布控制测试通过。
- 整合候选实际浏览器：29组布局/交互检查、16项首页动效生命周期检查通过，覆盖360/390/768/1024/1440及中英文。
- 首页动效的后台隐藏、降级及图片失败边界使用受控事件/属性注入；商城点击仅验证新窗口地址，不进行商城业务操作。
- 同一PR Head通过现有CI后才合并。生产仅由main触发 `.github/workflows/cloudflare-pages-deploy.yml`，同SHA已有运行时不重复派发。
- 线上版本、关键桌面/手机页面、旧屋FAQ原始HTML与浏览器一致性、地区页咨询链接、公共页面性能另行验收，实际回执记录在项目证据目录。本清单不提前宣称上线完成。

## Architecture Compliance Report

1. Target module: home/materials/company/services/seo 既有公共组件、地区页与SEO输出。
2. Target layer: frontend presentation/i18n/existing Cloudflare HTML middleware。
3. Edited files: 16个源码/测试文件与本发布清单；完整文件列表见PR和本地证据。
4. Forbidden files touched: no。
5. API paths changed: no。
6. Database access changed: no。
7. Cross-module dependency introduced: no new backend dependency；旧屋JSON-LD复用已有静态文案。
8. Business behavior changed: 页面内继续浏览、入口反馈与地区咨询预填；保留原业务接口。
9. arch:check result: PASS。
10. Remaining architecture risk: 无迁移/新依赖；真实生产回执和浏览器验收需发布后核验，实体手机未验收。
