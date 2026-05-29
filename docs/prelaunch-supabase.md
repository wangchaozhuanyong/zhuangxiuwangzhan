# Supabase 上线检查（表单改造后必做）

## 1. 数据库迁移

按顺序执行 `supabase/migrations/` 中全部 SQL，**必须包含**：

- `202605290001_form_submit_via_edge.sql`（撤销 anon 直写 leads/quote_requests）

```bash
supabase db push
# 或在 Dashboard SQL Editor 中按文件名顺序执行
```

## 2. Edge Functions 部署

```bash
supabase functions deploy submit-lead
supabase functions deploy notify-lead
supabase functions deploy notification-settings
supabase functions deploy maintenance-reminder
supabase functions deploy generate-english-content
```

`submit-lead` 需要 **service role**（Supabase 自动注入 `SUPABASE_SERVICE_ROLE_KEY`）。

## 3. 管理员

确认 `admin_users` 中至少有一条 `active = true` 记录。

## 4. 联调验收

1. 前台提交 Contact / Quote 各一条  
2. Supabase 表 `leads` / `quote_requests` 有新记录  
3. 后台 `/admin/leads`、`/admin/quotes` 可见  
4. Telegram 收到通知（若已配置）  
5. 用 REST Client 带 anon key 直插 `leads` 应 **失败**（403/RLS）
