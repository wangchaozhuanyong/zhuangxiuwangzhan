# FLASH CAST 后台已接入客户内容清单

本文档只回答一个问题:

哪些前台客户内容, 目前已经走管理后台 / Supabase 发布链路, 因而属于“需要同步”的范围。

判断标准:

- 前台页面或前台模块直接使用 `usePublished...` / `getPublished...`
- 数据来源是 Supabase 已发布内容表或 `get_public_home_bundle`
- 后台能管理, 前台会读取并显示

不在本文档范围内的内容:

- 还没接后台的本地静态文案
- 纯代码逻辑、交互逻辑、样式
- 后台管理页本身

## 总结

当前已经接后台并需要同步的客户内容, 主要包括:

- 首页内容包
- 关于我们页
- 服务列表页与服务详情页
- 项目列表页与项目详情页
- 材料列表页、分类页、子分类页、材料详情页
- 博客列表页与博客详情页
- FAQ 页
- 施工流程页
- 联系页
- 报价页
- 地区页
- 落地页
- CMS 动态页
- 页脚 CTA、品牌合作、前后对比、首页评价等前台模块

## 前台页面同步范围

| 前台路由 | 是否走后台 | 前台读取方式 | 主要后台来源 |
| --- | --- | --- | --- |
| `/:lang` | 是 | `usePublishedHomeContentBundle` | `get_public_home_bundle` RPC, `hero_slides`, `home_sections`, `projects`, `services`, `before_after_items`, `testimonials`, `faqs`, `cta_blocks`, `brand_partners`, `site_pages`, `cms_pages` |
| `/:lang/about` | 是 | `usePublishedAboutSection`, `usePublishedSitePage` | `about_sections`, `site_pages`, `cms_pages` |
| `/:lang/services` | 是 | `usePublishedServices`, `usePublishedSitePage` | `services`, `site_pages`, `cms_pages` |
| `/:lang/services/:slug` | 是 | `usePublishedServiceBySlug`, `usePublishedServices`, `usePublishedSitePage` | `services`, `site_pages`, `cms_pages` |
| `/:lang/projects` | 是 | `usePublishedProjectSummaries`, `usePublishedSitePage` | `projects`, `project_images`, `site_pages`, `cms_pages` |
| `/:lang/projects/:slug` | 是 | `usePublishedProjectBySlug`, `usePublishedProjectSummaries` | `projects`, `project_images` |
| `/:lang/materials` | 是 | `usePublishedMaterials`, `usePublishedSitePage` | `materials`, `site_pages`, `cms_pages` |
| `/:lang/materials/category/:categorySlug` | 是 | `usePublishedMaterials`, `usePublishedSitePage` | `materials`, `site_pages`, `cms_pages` |
| `/:lang/materials/category/:categorySlug/:subcategorySlug` | 是 | `usePublishedMaterials` | `materials` |
| `/:lang/materials/:slug` | 是 | `usePublishedMaterialBySlug` | `materials` |
| `/:lang/blog` | 是 | `usePublishedBlogPosts`, `usePublishedSitePage` | `blog_posts`, `site_pages`, `cms_pages` |
| `/:lang/blog/:slug` | 是 | `usePublishedBlogPostBySlug`, `usePublishedBlogPosts` | `blog_posts` |
| `/:lang/process` | 是 | `usePublishedProcessSteps`, `usePublishedSitePage` | `process_steps`, `site_pages`, `cms_pages` |
| `/:lang/faq` | 是 | `usePublishedFaqs`, `usePublishedSitePage` | `faqs`, `site_pages`, `cms_pages` |
| `/:lang/contact` | 是 | `usePublishedSitePage` | `site_pages`, `cms_pages` |
| `/:lang/quote` | 是 | `usePublishedSitePage` | `site_pages`, `cms_pages` |
| `/:lang/locations/:slug` | 是 | `usePublishedServiceAreaBySlug` | `service_areas` |
| `/:lang/landing/:slug` | 是 | `usePublishedLandingPageBySlug` | `landing_pages` |
| `/:lang/*` | 是 | `getPublishedCmsPageByPath` | `cms_pages`, `cms_sections` |

## 前台模块同步范围

这些模块即使不单独占一个路由, 也已经走后台:

| 前台模块 | 是否走后台 | 前台读取方式 | 主要后台来源 |
| --- | --- | --- | --- |
| 首页 Hero | 是 | `usePublishedHomeContentBundle` 或 `usePublishedHeroSlides` | `hero_slides` |
| 首页统计模块 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedHomeSection("stats")` | `home_sections` |
| 首页为什么选择我们 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedHomeSection("why_choose_us")` | `home_sections` |
| 首页精选项目 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedProjectSummaries` | `projects`, `project_images` |
| 首页服务模块 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedServiceSummaries` | `services` |
| 首页施工流程 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedProcessSteps` | `process_steps` |
| 首页前后对比 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedBeforeAfterItems` | `before_after_items` |
| 首页客户评价 | 是 | `usePublishedHomeContentBundle` 或 `usePublishedTestimonials` | `testimonials` |
| 首页 FAQ | 是 | `usePublishedHomeContentBundle` 或 `usePublishedFaqs("home")` | `faqs` |
| 首页 CTA | 是 | `usePublishedHomeContentBundle` 或 `usePublishedCtaBlock("home_final")` | `cta_blocks` |
| 品牌合作 Logo | 是 | `usePublishedHomeContentBundle` 或 `usePublishedBrandPartners` | `brand_partners` |
| 页脚 CTA | 是 | `usePublishedCtaBlock("home_final")` | `cta_blocks` |

## 当前同步事实来源

前台读取后台内容的核心入口:

- `src/hooks/usePublishedContent.ts`
- `src/lib/contentApi.ts`
- `src/lib/homeContentApi.ts`
- `src/backend/modules/cms/repository/publicContentRepository.ts`

后台编辑入口大致对应:

- 服务: `/admin/services`
- 项目: `/admin/projects`
- 材料: `/admin/materials`
- 博客: `/admin/blog`
- 通用页面: `/admin/simple-cms/*`, `/admin/content/*`, `/admin/about`, `/admin/home`

## 本次核对结论

按当前实现, 凡是本文档列出的“走后台”内容, 都属于客户前台与管理后台同步范围。

已做过的核对包括:

- 代码链路核对: 前台确实走 `usePublished...` / `getPublished...`
- 数据权限核对: `anon` 读到的已发布记录数与后台一致
- 线上页面抽样核对: 首页、关于、服务、材料、博客等页面命中后台内容

因此, 你现在可以直接按这份清单理解“哪些客户内容需要同步”。
