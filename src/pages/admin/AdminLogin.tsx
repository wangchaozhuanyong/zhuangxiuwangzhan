import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, FileText, Images, KeyRound, LayoutDashboard, Loader2, Moon, SearchCheck, ShieldCheck, Sun } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLoginText } from "@/i18n/adminLoginText";
import {
  hasAdminAuthConfig,
  prepareAdminMfaFlow,
  signInAdmin,
  signOutAdmin,
  verifyAdminMfa,
  type AdminMfaFlow,
} from "@/backend/modules/admin-auth/service/adminAuthService";
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
type LoginStep = "credentials" | "challenge" | "enroll";
type TotpEnrollment = Extract<AdminMfaFlow, { step: "enroll" }>["enrollment"];

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
      "h-10 min-w-10 rounded-full px-3 text-xs font-semibold transition-colors",
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
  if (normalized.includes("admin_access_required")) {
    return t.adminAccessRequired;
  }
  if (normalized.includes("invalid totp") || normalized.includes("invalid otp") || normalized.includes("challenge")) {
    return t.invalidMfaCode;
  }
  if (normalized.includes("mfa") || normalized.includes("factor") || normalized.includes("totp")) {
    return t.mfaUnavailable;
  }
  return t.fallback;
};

const AdminLogin = () => {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaSecret, setShowMfaSecret] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaEnrollment, setMfaEnrollment] = useState<TotpEnrollment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [language, setLanguage] = useState<AdminLang>(() => getAdminLang());
  const [theme, setTheme] = useState<AdminTheme>(() => getAdminTheme());
  const pendingLanguageRef = useRef(language);
  const currentLanguageRef = useRef(language);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const t = copy[language];
  const locationState = location.state as { reason?: "signed-out" | "mfa-required"; redirectTo?: string } | null;
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

  useEffect(() => {
    currentLanguageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (locationState?.reason !== "signed-out" && locationState?.reason !== "mfa-required") return;
    if (initializing || loginStep !== "credentials") return;
    const timer = window.setTimeout(() => emailInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [initializing, locationState?.reason, loginStep]);

  const changeLanguage = (nextLanguage: AdminLang) => {
    if (pendingLanguageRef.current === nextLanguage) return;
    pendingLanguageRef.current = nextLanguage;
    setLanguage(nextLanguage);
    setAdminLang(nextLanguage);
  };

  const applyMfaFlow = useCallback(
    async (flow: AdminMfaFlow) => {
      if (flow.step === "complete") {
        window.location.replace(redirectTo);
        return;
      }

      if (flow.step === "denied") {
        await signOutAdmin();
        setLoginStep("credentials");
        setMfaFactorId(null);
        setMfaEnrollment(null);
        setError(copy[currentLanguageRef.current].errors.adminAccessRequired);
        return;
      }

      if (flow.step === "challenge") {
        setLoginStep("challenge");
        setMfaFactorId(flow.factorId);
        setMfaEnrollment(null);
        setMfaCode("");
        return;
      }

      if (flow.step === "enroll") {
        setLoginStep("enroll");
        setMfaFactorId(flow.enrollment.factorId);
        setMfaEnrollment(flow.enrollment);
        setMfaCode("");
        return;
      }

      setLoginStep("credentials");
      setMfaFactorId(null);
      setMfaEnrollment(null);
    },
    [redirectTo],
  );

  useEffect(() => {
    if (!hasAdminAuthConfig()) return;
    let active = true;

    const resumeSession = async () => {
      try {
        const flow = await prepareAdminMfaFlow();
        if (!active) return;
        await applyMfaFlow(flow);
      } catch (resumeError) {
        if (!active) return;
        setError(formatAdminLoginError(resumeError instanceof Error ? resumeError.message : String(resumeError), currentLanguageRef.current));
      } finally {
        if (active) setInitializing(false);
      }
    };

    void resumeSession();
    return () => {
      active = false;
    };
  }, [applyMfaFlow]);

  if (!hasAdminAuthConfig()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    let signInError: unknown = null;
    try {
      await signInAdmin(email, password);
      setPassword("");
      await applyMfaFlow(await prepareAdminMfaFlow());
    } catch (error) {
      signInError = error;
    }
    setLoading(false);

    if (signInError) {
      setError(formatAdminLoginError(signInError instanceof Error ? signInError.message : String(signInError), language));
      return;
    }

  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaFactorId || !/^\d{6}$/.test(mfaCode)) {
      setError(t.errors.invalidMfaCode);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyAdminMfa(mfaFactorId, mfaCode);
      await applyMfaFlow(await prepareAdminMfaFlow());
    } catch (mfaError) {
      setError(formatAdminLoginError(mfaError instanceof Error ? mfaError.message : String(mfaError), language));
    } finally {
      setLoading(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    setLoading(true);
    await signOutAdmin();
    setEmail("");
    setPassword("");
    setMfaCode("");
    setMfaFactorId(null);
    setMfaEnrollment(null);
    setLoginStep("credentials");
    setError("");
    setLoading(false);
    window.setTimeout(() => emailInputRef.current?.focus(), 0);
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
          <form
            onSubmit={loginStep === "credentials" ? handleSubmit : handleMfaSubmit}
            aria-busy={loading || initializing}
            className="rounded-lg border border-border bg-card p-4 shadow-luxury-soft sm:p-8"
          >
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
                <div className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-border bg-muted/60 p-1 sm:flex-none" aria-label={t.language}>
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

            <p className="mb-6 break-words text-sm leading-6 text-muted-foreground">
              {loginStep === "enroll" ? t.mfaEnrollDescription : loginStep === "challenge" ? t.mfaChallengeDescription : t.description}
            </p>

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
            {locationState?.reason === "mfa-required" && !error && loginStep !== "credentials" && (
              <AdminAlert tone="info" className="mb-4">
                {t.mfaRequiredToContinue}
              </AdminAlert>
            )}

            <div className="space-y-4">
              {loginStep === "credentials" ? (
                <>
                  <div>
                    <label htmlFor="admin-login-email" className="mb-1.5 block text-sm font-medium">{t.email}</label>
                    <Input
                      id="admin-login-email"
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="username"
                      required
                      disabled={loading || initializing}
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-login-password" className="mb-1.5 block text-sm font-medium">{t.password}</label>
                    <div className="relative">
                      <Input
                        id="admin-login-password"
                        className="pr-11"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (error) setError("");
                        }}
                        autoComplete="current-password"
                        required
                        disabled={loading || initializing}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={showPassword ? t.hidePassword : t.showPassword}
                        title={showPassword ? t.hidePassword : t.showPassword}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={loading || initializing}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-lg" disabled={loading || initializing}>
                    {loading || initializing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {initializing ? t.checkingSession : t.signingIn}
                      </>
                    ) : (
                      t.signIn
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {loginStep === "enroll" && mfaEnrollment && (
                    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="font-semibold text-foreground">{t.mfaEnrollTitle}</h2>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.mfaEnrollHelp}</p>
                        </div>
                      </div>
                      <img
                        src={mfaEnrollment.qrCode}
                        alt={t.mfaQrAlt}
                        className="mx-auto h-44 w-44 rounded-lg border border-border bg-white p-2"
                        width="176"
                        height="176"
                      />
                      <div>
                        <label htmlFor="admin-mfa-secret" className="mb-1.5 block text-xs font-medium text-foreground">{t.mfaSecret}</label>
                        <div className="relative">
                          <Input
                            id="admin-mfa-secret"
                            className="pr-11 font-mono text-xs"
                            type={showMfaSecret ? "text" : "password"}
                            value={mfaEnrollment.secret}
                            readOnly
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={showMfaSecret ? t.hideMfaSecret : t.showMfaSecret}
                            title={showMfaSecret ? t.hideMfaSecret : t.showMfaSecret}
                            aria-pressed={showMfaSecret}
                            onClick={() => setShowMfaSecret((value) => !value)}
                          >
                            {showMfaSecret ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label htmlFor="admin-mfa-code" className="mb-1.5 block text-sm font-medium">{t.mfaCode}</label>
                    <Input
                      id="admin-mfa-code"
                      value={mfaCode}
                      onChange={(event) => {
                        setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                        if (error) setError("");
                      }}
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder={t.mfaCodePlaceholder}
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-lg" disabled={loading || mfaCode.length !== 6}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {t.verifyingMfa}
                      </>
                    ) : loginStep === "enroll" ? (
                      t.enableMfa
                    ) : (
                      t.verifyMfa
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="h-10 w-full rounded-lg" disabled={loading} onClick={() => void handleUseAnotherAccount()}>
                    {t.useAnotherAccount}
                  </Button>
                </>
              )}
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
