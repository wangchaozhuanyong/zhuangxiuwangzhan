import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: {
    brand: "FLASH CAST Admin",
    title: "Admin Login",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
  },
  zh: {
    brand: "FLASH CAST 后台",
    title: "管理员登录",
    email: "邮箱",
    password: "密码",
    signIn: "登录",
    signingIn: "登录中...",
  },
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lang = "zh";
  const t = copy[lang];

  if (!isSupabaseConfigured) {
    return <Navigate to="/admin/dashboard" replace />;
  }

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
    <main className="min-h-screen bg-muted pt-24 px-4">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent mb-2">{t.brand}</p>
        <h1 className="font-display text-2xl font-bold mb-6">{t.title}</h1>
        {error && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.email}</label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t.password}</label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? t.signingIn : t.signIn}</Button>
        </div>
      </form>
    </main>
  );
};

export default AdminLogin;
