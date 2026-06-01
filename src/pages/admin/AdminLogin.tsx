import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { Moon, ShieldCheck, Sun } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
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

const copy = {
  en: {
    brand: "FLASH CAST Admin",
    title: "Admin Login",
    description: "Sign in to manage website content, enquiries, media and SEO.",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    language: "Language",
    lightTheme: "Light",
    darkTheme: "Dark",
    security: "Protected admin area",
  },
  zh: {
    brand: "FLASH CAST 后台",
    title: "管理员登录",
    description: "登录后可以管理网站内容、客户询盘、媒体素材和 SEO。",
    email: "邮箱",
    password: "密码",
    signIn: "登录",
    signingIn: "登录中...",
    language: "语言",
    lightTheme: "浅色",
    darkTheme: "深色",
    security: "受保护的后台区域",
  },
};

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
  if (normalized.includes("invalid login credentials")) {
    return language === "zh" ? "邮箱或密码不正确，请检查后再试。" : "The email or password is incorrect. Please check and try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return language === "zh" ? "这个邮箱还没有完成验证，请先完成邮箱验证。" : "This email has not been confirmed yet.";
  }
  if (normalized.includes("too many") || normalized.includes("rate")) {
    return language === "zh" ? "尝试次数太多，请稍后再试。" : "Too many attempts. Please try again later.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return language === "zh" ? "网络连接异常，请检查网络后再试。" : "Network error. Please check your connection and try again.";
  }
  return language === "zh" ? "登录失败，请检查账号、密码或后台权限。" : message || "Sign in failed. Please check your account and permission.";
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<AdminLang>(() => getAdminLang());
  const [theme, setTheme] = useState<AdminTheme>(() => getAdminTheme());
  const t = copy[language];

  useEffect(() => {
    applyAdminTheme(theme, language);
    setAdminTheme(theme);
    return () => clearAdminTheme();
  }, [theme, language]);

  if (!isSupabaseConfigured) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const changeLanguage = (nextLanguage: AdminLang) => {
    setAdminLang(nextLanguage);
    setLanguage(nextLanguage);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase!.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(formatAdminLoginError(signInError.message, language));
      return;
    }

    window.location.href = "/admin/dashboard";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Helmet>
        <title>{`${t.title} | FLASH CAST 后台管理`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md">
        <AdminPageHeader
          title={t.title}
          description={t.description}
          helpText="这里是后台登录入口，只用来进入管理系统，不负责内容编辑。"
        />

        <div className="mb-4 flex items-center justify-end gap-2">
          <div className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-muted/60 p-1" aria-label={t.language}>
            <ToggleButton active={language === "zh"} label="中文" onClick={() => changeLanguage("zh")}>
              中文
            </ToggleButton>
            <ToggleButton active={language === "en"} label="英文" onClick={() => changeLanguage("en")}>
              EN
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

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              FC
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{t.brand}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">{t.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.description}</p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
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
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-lg" disabled={loading}>
              {loading ? t.signingIn : t.signIn}
            </Button>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/55 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
            <span>{t.security}</span>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;
