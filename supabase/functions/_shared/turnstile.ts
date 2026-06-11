export type TurnstileVerification =
  | { ok: true; enforced: boolean }
  | { ok: false; status: number; error: string };

export const getRequestIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

export const verifyTurnstileToken = async (
  token: unknown,
  remoteIp: string | null,
): Promise<TurnstileVerification> => {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return { ok: true, enforced: false };

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, status: 400, error: "Bot verification failed" };
  }

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token.trim());
  if (remoteIp) form.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await response.json().catch(() => null) as { success?: boolean } | null;

  if (!response.ok || !data?.success) {
    return { ok: false, status: 400, error: "Bot verification failed" };
  }

  return { ok: true, enforced: true };
};
