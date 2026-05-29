import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const AdminRoute = () => {
  const { state: authState, isSupabaseConfigured } = useAdminAuth();
  const lang = useMemo(() => (isZhBrowser() ? "zh" : "en"), []);

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-muted px-4 pt-24">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">{lang === "zh" ? "Supabase 未配置" : "Supabase is not configured"}</h1>
          <p className="text-muted-foreground mb-5">
            {lang === "zh"
              ? "请在环境变量中添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后再使用后台。"
              : "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment to enable the admin panel."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to={lang === "zh" ? "/zh" : "/en"}>{lang === "zh" ? "返回网站" : "Back to website"}</Link>
            </Button>
            <Button asChild>
              <Link to="/admin">{lang === "zh" ? "返回登录页" : "Back to login"}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (authState === "checking") {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">正在检查管理员状态...</p>
        </div>
      </main>
    );
  }
  if (authState === "signed-out") return <Navigate to="/admin" replace />;
  if (authState === "denied") {
    return (
      <main className="min-h-screen bg-muted px-4 pt-24">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">{lang === "zh" ? "需要管理员权限" : "Admin access required"}</h1>
          <p className="text-muted-foreground mb-5">
            {lang === "zh"
              ? "当前账号已登录，但未被列为管理员。请联系站点负责人为你开通权限。"
              : "Your account is signed in, but it is not listed as an admin."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={async () => {
                await supabase?.auth.signOut();
                window.location.href = "/admin";
              }}
            >
              {lang === "zh" ? "退出登录" : "Sign out"}
            </Button>
            <Button asChild variant="outline">
              <Link to={lang === "zh" ? "/zh" : "/en"}>{lang === "zh" ? "返回网站" : "Back to website"}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Outlet />
    </>
  );
};

export default AdminRoute;

