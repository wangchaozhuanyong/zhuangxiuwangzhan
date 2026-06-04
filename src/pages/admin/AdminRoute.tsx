import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, Outlet } from "react-router-dom";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import { Button } from "@/components/ui/button";
import { adminRouteText } from "@/i18n/adminRouteText";
import { signOutAdmin } from "@/backend/modules/admin-auth/service/adminAuthService";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import { adminPublicSitePath, applyAdminTheme, clearAdminTheme, getAdminLang, getAdminTheme } from "@/lib/adminLocale";

const copy = adminRouteText;

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
  <main className="flex min-h-screen items-center justify-center overflow-x-clip bg-background px-3 py-6 text-foreground sm:px-4 sm:py-10">
    <div className="w-full max-w-lg rounded-lg border border-border bg-card p-4 shadow-sm sm:p-8">
      <div className="mb-5 flex items-start gap-3 sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            FC
          </div>
          <div className="min-w-0">
          <p className="break-words text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{copy[getAdminLang()].brand}</p>
          <h1 className="mt-1 flex items-start gap-2 text-xl font-semibold tracking-normal sm:items-center sm:text-2xl">
            <span className="min-w-0 break-words">{title}</span>
            <AdminHelpTip text={helpText} />
          </h1>
        </div>
      </div>
      {body && <p className="mb-5 break-words text-sm leading-6 text-muted-foreground">{body}</p>}
      {children && (
        <div className="flex flex-wrap items-center gap-2" data-admin-card-actions>
          {children}
        </div>
      )}
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
      <AdminNotice title={t.notConfiguredTitle} body={t.notConfiguredBody} helpText={t.notConfiguredHelp}>
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
      <main className="flex min-h-screen items-center justify-center overflow-x-clip bg-background px-3 py-6 text-foreground sm:px-4 sm:py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t.checking}</p>
        </div>
      </main>
    );
  }

  if (authState === "signed-out") return <Navigate to="/admin" replace />;

  if (authState === "denied") {
    return (
      <AdminNotice title={t.accessRequired} body={t.deniedBody} helpText={t.deniedHelp}>
        <Button
          className="rounded-lg"
          onClick={async () => {
            await signOutAdmin();
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
