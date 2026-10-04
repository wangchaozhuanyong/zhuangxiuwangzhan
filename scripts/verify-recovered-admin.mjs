import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./lib/project-env.mjs";

const root = process.cwd();
const reportFile = path.join(root, "audits/environment-recovery-20261003/restore-result.json");
const container = "supabase_db_flashcast-full-restore-20261003";
const lab = path.join(root, "backups/environment-recovery-20261003/restore-lab");
function sql(query) {
  const result = spawnSync("docker", ["exec", "-i", container, "psql", "-U", "supabase_admin", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"], { input: query, encoding: "utf8" });
  if (result.status !== 0) throw new Error("Local account readback failed; private output withheld.");
  return result.stdout.trim();
}
function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const letter of secret.toUpperCase().replace(/=+$/, "")) {
    const index = alphabet.indexOf(letter);
    if (index < 0) throw new Error("Recovered MFA secret needs its original encryption configuration.");
    bits += index.toString(2).padStart(5, "0");
  }
  const key = Buffer.from((bits.match(/.{8}/g) || []).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  key.fill(0);
  const offset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}

async function verify() {
  const receipt = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  if (!receipt.data_verified || !receipt.schema_verified || !receipt.auth_verified || receipt.target !== "isolated-local-flashcast-full-restore-20261003") throw new Error("Verify the restored database before account acceptance.");
  const output = spawnSync("npx", ["--yes", "supabase@2.119.0", "status", "--workdir", lab, "--output", "json"], { encoding: "utf8", timeout: 30000 });
  if (output.status !== 0) throw new Error("Isolated Auth status unavailable.");
  const local = JSON.parse(output.stdout);
  const url = new URL(local.API_URL);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "56321") throw new Error("Account acceptance is restricted to the isolated local API.");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url.href, local.SERVICE_ROLE_KEY, options);
  const client = createClient(url.href, local.ANON_KEY, options);
  const anon = createClient(url.href, local.ANON_KEY, options);
  const env = readEnvFile(path.join(root, ".env.production.local"));
  for (const key of ["ADMIN_TEST_EMAIL", "ADMIN_TEST_PASSWORD", "ADMIN_TEST_TOTP_SECRET"]) if (process.env[key] !== undefined) env[key] = process.env[key];
  const emailFilter = env.ADMIN_TEST_EMAIL ? ` AND u.email='${env.ADMIN_TEST_EMAIL.replaceAll("'", "''")}'` : "";
  const accountText = sql(`SELECT row_to_json(q) FROM (SELECT au.user_id,u.email,f.id AS factor_id,f.secret FROM public.admin_users au JOIN auth.users u ON u.id=au.user_id LEFT JOIN auth.mfa_factors f ON f.user_id=u.id AND f.status='verified' AND f.factor_type='totp' WHERE au.active=true AND au.role='super_admin'${emailFilter} ORDER BY f.id NULLS LAST LIMIT 1) q;`);
  if (!accountText) throw new Error("No recovered active super-admin account found.");
  const account = JSON.parse(accountText);
  if (process.argv.includes("--prompt-password")) {
    if (process.platform !== "darwin") throw new Error("The private password dialog requires macOS.");
    const email = String(account.email).replace(/["\\\r\n]/g, " ");
    const message = `请输入 FLASH CAST 后台管理员 ${email} 的原登录密码。仅在本机恢复库验证，不保存密码，也不修改生产账号。`;
    const prompt = spawnSync("osascript", ["-e", `text returned of (display dialog ${JSON.stringify(message)} default answer "" with hidden answer buttons {"稍后", "验证"} default button "验证" cancel button "稍后" giving up after 180)`], { encoding: "utf8", timeout: 190000 });
    if (prompt.status !== 0 || !prompt.stdout.trimEnd()) throw new Error("Original password verification deferred; existing recovery proof preserved.");
    env.ADMIN_TEST_EMAIL = account.email;
    env.ADMIN_TEST_PASSWORD = prompt.stdout.replace(/\r?\n$/, "");
  }
  const passwordConfigured = Boolean(env.ADMIN_TEST_EMAIL && env.ADMIN_TEST_PASSWORD);
  let login;
  if (passwordConfigured) login = await client.auth.signInWithPassword({ email: account.email, password: env.ADMIN_TEST_PASSWORD });
  else {
    // A local recovery-link acceptance does not prove the original password works.
    // generateLink does not send an email. The link/token remains in memory.
    const generated = await admin.auth.admin.generateLink({ type: "magiclink", email: account.email });
    if (generated.error) throw new Error("Recovered-account local recovery link failed.");
    login = await client.auth.verifyOtp({ type: "magiclink", token_hash: generated.data.properties.hashed_token });
  }
  if (login.error || login.data.user?.id !== account.user_id) throw new Error("Recovered-account local sign-in failed.");
  const aal1 = await client.rpc("admin_role");
  const anonymous = await anon.from("admin_users").select("user_id", { count: "exact", head: true });
  if (aal1.error || aal1.data !== null || (!anonymous.error && anonymous.count !== 0)) throw new Error("Anonymous or pre-MFA admin access was not blocked.");
  const factors = await client.auth.mfa.listFactors();
  const factor = factors.data?.totp?.find((item) => item.id === account.factor_id);
  if (factors.error || !factor) throw new Error("Recovered original MFA factor is unavailable.");
  const challenge = await client.auth.mfa.challenge({ factorId: factor.id });
  if (challenge.error) throw new Error(`Recovered original MFA challenge failed (${challenge.error.status || "unknown"}/${/^[a-z_]+$/.test(challenge.error.code || "") ? challenge.error.code : "unknown"}).`);
  const secret = env.ADMIN_TEST_TOTP_SECRET || account.secret;
  if (!secret) throw new Error("Original MFA verification requires a private TOTP secret.");
  const verification = await client.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.data.id, code: totp(secret) });
  if (verification.error) throw new Error("Recovered original MFA verification failed.");
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const role = await client.rpc("admin_role");
  const privileged = await client.from("admin_users").select("user_id", { count: "exact", head: true });
  if (assurance.data?.currentLevel !== "aal2" || role.error || role.data !== "super_admin" || privileged.error || privileged.count < 1) throw new Error("Recovered post-MFA super-admin permissions failed.");
  receipt.original_admin_login_verified = passwordConfigured;
  receipt.original_admin_mfa_verified = true;
  receipt.recovered_account_auth_session_verified = true;
  receipt.login_method = passwordConfigured ? "original-password" : "isolated-recovery-link";
  receipt.permissions_verified = true;
  receipt.permission_checks = { anonymous_admin_data_blocked: true, pre_mfa_admin_role_blocked: true, post_mfa_super_admin_access: true };
  receipt.checked_at = new Date().toISOString();
  receipt.acceptance_complete = passwordConfigured;
  fs.writeFileSync(reportFile, JSON.stringify(receipt, null, 2), { mode: 0o600 });
  await client.auth.signOut();
  console.log(JSON.stringify({ originalAccountSession: true, originalMFA: true, permissions: true, originalPasswordLogin: passwordConfigured, pending: passwordConfigured ? [] : ["original administrator password login"] }));
}
try { await verify(); }
catch (error) { console.error(`[verify-recovered-admin] ${error.message}`); process.exitCode = 1; }
