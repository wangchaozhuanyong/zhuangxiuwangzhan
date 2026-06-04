export const categoryLabelMap: Record<string, string> = {
  "Traffic and SEO": "流量与 SEO",
  "Lead Handling": "线索处理",
  "Content Health": "内容健康",
  "Technical Checks": "技术检查",
  "Monthly Tasks": "每月任务",
};

export const itemTitleMap: Record<string, string> = {
  "seo-search-console": "检查 Google Search Console",
  "seo-sitemap-robots": "确认 sitemap 和 robots",
  "seo-page-tags": "抽查 SEO 标签",
  "leads-new-review": "查看新线索和报价请求",
  "leads-older-than-24h": "跟进超过 24 小时的提交",
  "telegram-health": "确认 Telegram 提醒正常送达",
  "content-homepage": "检查首页和 CTA 文案",
  "content-cases": "检查新案例内容",
  "content-blog-location": "检查博客和地区页",
  "technical-smoke-test": "执行生产环境烟测",
  "technical-mobile-cta": "检查移动端 CTA",
  "technical-cloudflare-supabase": "检查 Cloudflare 和 Supabase 健康状态",
  "monthly-blog": "发布至少一篇 SEO 博客",
  "monthly-case-study": "新增或更新一个案例",
  "monthly-location-material": "扩充一个地区页或材料页",
};

export const siteUrl = () => Deno.env.get("SITE_URL") || "https://flashcast.com.my";
