import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, Outlet } from "react-router-dom";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import { adminPublicSitePath, applyAdminTheme, clearAdminTheme, getAdminLang, getAdminTheme } from "@/lib/adminLocale";

const copy = {
  en: {
    notConfiguredTitle: "Supabase is not configured",
    notConfiguredBody: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment before using the admin panel.",
    backToWebsite: "Back to website",
    backToLogin: "Back to login",
    checking: "Checking admin session...",
    accessRequired: "Admin access required",
    deniedBody: "You are signed in, but this account is not listed as a FLASH CAST admin.",
    signOut: "Sign out",
  },
  zh: {
    notConfiguredTitle: "Supabase 未配置",
    notConfiguredBody: "请先在环境变量里配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，再使用管理后台。",
    backToWebsite: "返回网站",
    backToLogin: "返回登录页",
    checking: "正在检查管理员状态...",
    accessRequired: "需要管理员权限",
    deniedBody: "当前账号已经登录，但没有被列为 FLASH CAST 管理员。",
    signOut: "退出登录",
  },
};

const AdminNotice = ({
  title,
  body,
  helpText,
  children,
}: {
  title: string;
  body?: string;
  helpText?: string;
  children?: ReactNode;
}) => (
  <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
    <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          FC
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">FLASH CAST 后台</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-normal">
            <span>{title}</span>
            <AdminHelpTip text={helpText} />
          </h1>
        </div>
      </div>
      {body && <p className="mb-5 text-sm leading-6 text-muted-foreground">{body}</p>}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  </main>
);

const AdminRoute = () => {
  const { state: authState, isSupabaseConfigured } = useAdminAuth();
  const lang = getAdminLang();
  const theme = getAdminTheme();
  const t = copy[lang];
  const sitePath = adminPublicSitePath(lang);
  const ownsAdminThemeRef = useRef(false);
  const shouldOwnAdminTheme = authState !== "signed-in";

  useLayoutEffect(() => {
    if (!shouldOwnAdminTheme) {
      ownsAdminThemeRef.current = false;
      return;
    }
    ownsAdminThemeRef.current = true;
    applyAdminTheme(theme, lang);
  }, [shouldOwnAdminTheme, theme, lang]);

  useEffect(() => {
    return () => {
      if (ownsAdminThemeRef.current) clearAdminTheme();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <AdminNotice title={t.notConfiguredTitle} body={t.notConfiguredBody} helpText="先检查环境变量和数据库配置，没配好时后台不会开放。">
        <Button asChild variant="outline" className="rounded-lg">
          <Link to={sitePath}>{t.backToWebsite}</Link>
        </Button>
        <Button asChild className="rounded-lg">
          <Link to="/admin">{t.backToLogin}</Link>
        </Button>
      </AdminNotice>
    );
  }

  if (authState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t.checking}</p>
        </div>
      </main>
    );
  }

  if (authState === "signed-out") return <Navigate to="/admin" replace />;

  if (authState === "denied") {
    return (
      <AdminNotice title={t.accessRequired} body={t.deniedBody} helpText="已经登录但不是后台白名单账号，所以会被拦住。">
        <Button
          className="rounded-lg"
          onClick={async () => {
            await supabase?.auth.signOut();
            window.location.href = "/admin";
          }}
        >
          {t.signOut}
        </Button>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to={sitePath}>{t.backToWebsite}</Link>
        </Button>
      </AdminNotice>
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
