import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { Moon, ShieldCheck, Sun } from "lucide-react";
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
      setError(signInError.message);
      return;
    }

    window.location.href = "/admin/dashboard";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-end gap-2">
          <div className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-muted/60 p-1" aria-label={t.language}>
            <ToggleButton active={language === "zh"} label="中文" onClick={() => changeLanguage("zh")}>
              中文
            </ToggleButton>
            <ToggleButton active={language === "en"} label="English" onClick={() => changeLanguage("en")}>
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
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">{t.title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.description}</p>
            </div>
          </div>

          {error && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t.email}</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t.password}</label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
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
