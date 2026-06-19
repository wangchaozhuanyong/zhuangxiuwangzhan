import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useLocation } from "react-router-dom";
import { FileText, Images, LayoutDashboard, Loader2, Moon, SearchCheck, ShieldCheck, Sun } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLoginText } from "@/i18n/adminLoginText";
import { hasAdminAuthConfig, signInAdmin } from "@/backend/modules/admin-auth/service/adminAuthService";
import {
  applyAdminTheme,
  clearAdminTheme,
  getAdminLang,
  getAdminTheme,
  setAdminLang,
  setAdminTheme,
  type AdminLang,
  type AdminTheme,
} from "@/lib/adminLocale";
import { cn } from "@/lib/utils";

const copy = adminLoginText;
const workspaceIcons = [LayoutDashboard, FileText, Images, SearchCheck] as const;

const ToggleButton = ({
  active,
  children,
  onClick,
  label,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground",
    )}
  >
    {children}
  </button>
);

const formatAdminLoginError = (message: string, language: AdminLang) => {
  const normalized = message.toLowerCase();
  const t = copy[language].errors;
  if (normalized.includes("invalid login credentials")) {
    return t.invalidCredentials;
  }
  if (normalized.includes("email not confirmed")) {
    return t.emailNotConfirmed;
  }
  if (normalized.includes("too many") || normalized.includes("rate")) {
    return t.tooManyAttempts;
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return t.network;
  }
  return language === "en" ? message || t.fallback : t.fallback;
};

const AdminLogin = () => {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<AdminLang>(() => getAdminLang());
  const [theme, setTheme] = useState<AdminTheme>(() => getAdminTheme());
  const pendingLanguageRef = useRef(language);
  const t = copy[language];
  const locationState = location.state as { reason?: string; redirectTo?: string } | null;
  const redirectTo =
    locationState?.redirectTo && locationState.redirectTo.startsWith("/admin") && !/^\/admin\/?$/.test(locationState.redirectTo)
      ? locationState.redirectTo
      : "/admin/dashboard";

  useLayoutEffect(() => {
    applyAdminTheme(theme, language);
    setAdminTheme(theme);
  }, [theme, language]);

  useEffect(() => {
    return () => clearAdminTheme();
  }, []);

  if (!hasAdminAuthConfig()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const changeLanguage = (nextLanguage: AdminLang) => {
    if (pendingLanguageRef.current === nextLanguage) return;
    pendingLanguageRef.current = nextLanguage;
    setLanguage(nextLanguage);
    setAdminLang(nextLanguage);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    let signInError: unknown = null;
    try {
      await signInAdmin(email, password);
    } catch (error) {
      signInError = error;
    }
    setLoading(false);

    if (signInError) {
      setError(formatAdminLoginError(signInError instanceof Error ? signInError.message : String(signInError), language));
      return;
    }

    window.location.href = redirectTo;
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-background px-3 py-6 text-foreground sm:px-6 sm:py-10 lg:px-8">
      <Helmet>
        <title>{`${t.title} | ${t.helmetTitle}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)]">
        <section className="hidden min-h-[560px] flex-col justify-center lg:flex" aria-labelledby="admin-login-workspace-title">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/65 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>{t.workspaceEyebrow}</span>
            </div>
            <h2 id="admin-login-workspace-title" className="mt-5 max-w-lg text-4xl font-semibold tracking-normal text-foreground">
              {t.workspaceTitle}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">{t.workspaceDescription}</p>

            <div className="mt-7 flex flex-wrap gap-2" aria-label={t.workspaceAreasLabel}>
              {t.workspacePills.map((item) => (
                <span key={item} className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-semibold text-foreground">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-5">
              {t.workspaceHighlights.map((item, index) => {
                const Icon = workspaceIcons[index % workspaceIcons.length];
                return (
                  <div key={item.title} className="flex items-start gap-4 border-t border-border/75 pt-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-sans text-sm font-semibold tracking-normal text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none lg:justify-self-end">
          <form onSubmit={handleSubmit} aria-busy={loading} className="rounded-lg border border-border bg-card p-4 shadow-luxury-soft sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  FC
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{t.brand}</p>
                  <h1 className="mt-1 break-words text-xl font-semibold tracking-normal sm:text-2xl">{t.title}</h1>
                </div>
              </div>

              <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                <div className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-border bg-muted/60 p-1 sm:flex-none" aria-label={t.language}>
                  <ToggleButton active={language === "zh"} label={t.zhLanguageLabel} onClick={() => changeLanguage("zh")}>
                    {t.zhLanguageButton}
                  </ToggleButton>
                  <ToggleButton active={language === "en"} label={t.enLanguageLabel} onClick={() => changeLanguage("en")}>
                    {t.enLanguageButton}
                  </ToggleButton>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  aria-label={theme === "dark" ? t.lightTheme : t.darkTheme}
                  title={theme === "dark" ? t.lightTheme : t.darkTheme}
                  onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <p className="mb-6 break-words text-sm leading-6 text-muted-foreground">{t.description}</p>

            {error && (
              <div role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {locationState?.reason === "signed-out" && !error && (
              <AdminAlert tone="info" className="mb-4">
                {t.signInToContinue}
              </AdminAlert>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="admin-login-email" className="mb-1.5 block text-sm font-medium">{t.email}</label>
                <Input
                  id="admin-login-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="admin-login-password" className="mb-1.5 block text-sm font-medium">{t.password}</label>
                <Input
                  id="admin-login-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="h-11 w-full rounded-lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t.signingIn}
                  </>
                ) : (
                  t.signIn
                )}
              </Button>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-muted/55 px-3 py-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{t.securityTitle}</p>
                <p className="mt-1 break-words leading-5">{t.security}</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
