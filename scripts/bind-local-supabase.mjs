import http from "node:http";
import { execFileSync, spawnSync } from "node:child_process";

export async function bindLocalSupabase(project) {
  if (!/^flashcast-(dev|full-restore)-\d{8}$/.test(project)) throw new Error("Expected an owned FLASH CAST local project.");
  const endpoint = execFileSync("docker", ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"], { encoding: "utf8" }).trim();
  if (!endpoint.startsWith("unix://")) throw new Error("A local Docker socket is required.");
  const socketPath = endpoint.slice(7);
  const request = (route, body) => new Promise((resolve, reject) => {
    const req = http.request({ socketPath, path: route, method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
      let result = "";
      res.on("data", (chunk) => { result += chunk; });
      res.on("end", () => res.statusCode >= 300 ? reject(new Error(`Local Docker operation rejected (${res.statusCode}).`)) : resolve(result ? JSON.parse(result) : {}));
    });
    req.on("error", reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
  const ids = execFileSync("docker", ["ps", "-aq", "--filter", `name=${project}`], { encoding: "utf8" }).trim().split(/\s+/).filter(Boolean);
  if (!ids.length) throw new Error("Start the owned local stack before binding ports.");
  const containers = JSON.parse(execFileSync("docker", ["inspect", ...ids], { encoding: "utf8" }));
  for (const original of containers.filter((item) => item.Name.endsWith(`_${project}`))) {
    const ports = Object.values(original.HostConfig.PortBindings || {}).flat();
    const name = original.Name.slice(1);
    const mfaFlags = ["GOTRUE_MFA_TOTP_ENROLL_ENABLED", "GOTRUE_MFA_TOTP_VERIFY_ENABLED"];
    const needsMfa = name.startsWith("supabase_auth_") && mfaFlags.some((flag) => original.Config.Env.includes(`${flag}=false`));
    if (!ports.some((port) => port.HostIp !== "127.0.0.1") && !needsMfa) continue;
    if (containers.some((item) => item.Name === `/${name}_before_loopback`)) throw new Error("A prior loopback replacement already exists; inspect it before retrying.");
    execFileSync("docker", ["stop", name], { stdio: "pipe" });
    execFileSync("docker", ["rename", name, `${name}_before_loopback`]);
    for (const port of ports) port.HostIp = "127.0.0.1";
    if (needsMfa) original.Config.Env = original.Config.Env.map((value) => mfaFlags.some((flag) => value.startsWith(`${flag}=`)) ? value.replace(/=false$/, "=true") : value);
    const endpoints = Object.fromEntries(Object.entries(original.NetworkSettings.Networks).map(([network, settings]) => [network, { Aliases: settings.Aliases }]));
    await request(`/containers/create?name=${name}`, { ...original.Config, HostConfig: original.HostConfig, NetworkingConfig: { EndpointsConfig: endpoints } });
    if (name.startsWith("supabase_kong_")) {
      // CLI-generated TLS/config files live in the writable layer, outside mounted volumes.
      const archive = execFileSync("docker", ["cp", `${name}_before_loopback:/home/kong/.`, "-"], { maxBuffer: 10 * 1024 * 1024 });
      const copy = spawnSync("docker", ["cp", "-", `${name}:/home/kong`], { input: archive });
      if (copy.status !== 0) throw new Error("Local gateway runtime files could not be preserved.");
    }
    await request(`/containers/${name}/start`);
  }
  console.log(JSON.stringify({ project, ports: "loopback only", existingVolumesPreserved: true }));
}

if (process.argv[1] === import.meta.filename) await bindLocalSupabase(process.argv[2]);
