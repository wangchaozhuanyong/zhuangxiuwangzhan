import { Helmet } from "react-helmet-async";
import { Link, Navigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import { adminPublicSitePath } from "@/lib/adminLocale";

const AdminRoute = () => {
  const { state: authState, isSupabaseConfigured } = useAdminAuth();
  const sitePath = adminPublicSitePath();

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-muted px-4 pt-24">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">Supabase 未配置</h1>
          <p className="text-muted-foreground mb-5">
            请在环境变量中添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后再使用后台。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to={sitePath}>返回网站</Link>
            </Button>
            <Button asChild>
              <Link to="/admin">返回登录页</Link>
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
          <h1 className="font-display text-2xl font-bold mb-3">需要管理员权限</h1>
          <p className="text-muted-foreground mb-5">
            当前账号已登录，但未被列为管理员。请联系站点负责人为你开通权限。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={async () => {
                await supabase?.auth.signOut();
                window.location.href = "/admin";
              }}
            >
              退出登录
            </Button>
            <Button asChild variant="outline">
              <Link to={sitePath}>返回网站</Link>
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
