/**
 * Re-encode hero videos when ffmpeg is available.
 * Targets: responsive homepage hero videos with higher clarity than the
 * previous heavily compressed versions.
 */
import { existsSync, renameSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";

const hasFfmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
if (!hasFfmpeg) {
  console.warn("[compress-hero-videos] ffmpeg not found — skip re-encode. Install ffmpeg and re-run.");
  process.exit(0);
}

const dir = "public/videos";
const jobs = [
  { in: "home-hero.mp4", out: "home-hero.mp4", scale: "1920:-2:flags=lanczos", crf: "20", sharpen: true },
  { in: "home-hero-mobile.mp4", out: "home-hero-mobile.mp4", scale: "1080:-2", crf: "24" },
  { in: "home-hero-tablet.mp4", out: "home-hero-tablet.mp4", scale: "1536:-2", crf: "25" },
  { in: "home-hero.mp4", out: "home-hero.webm", scale: "1920:-2:flags=lanczos", crf: "24", webm: true, sharpen: true },
  { in: "home-hero-mobile.mp4", out: "home-hero-mobile.webm", scale: "1080:-2", crf: "30", webm: true },
  { in: "home-hero-tablet.mp4", out: "home-hero-tablet.webm", scale: "1536:-2", crf: "31", webm: true },
];

for (const job of jobs) {
  const input = path.join(dir, job.in);
  const output = path.join(dir, job.out);
  if (!existsSync(input)) {
    console.warn(`[compress-hero-videos] missing ${input}`);
    continue;
  }
  const tmp = job.webm ? `${output}.tmp.webm` : `${output}.tmp.mp4`;
  const crf = job.crf || (job.webm ? "30" : "24");
  const codec = job.webm
    ? ["-c:v", "libvpx-vp9", "-b:v", "0", "-deadline", "good", "-cpu-used", "2", "-row-mt", "1"]
    : ["-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p"];
  const format = job.webm ? ["-f", "webm"] : ["-f", "mp4", "-movflags", "+faststart"];
  const filters = [`scale=${job.scale}`];
  if (job.sharpen) filters.push("unsharp=5:5:0.45:3:3:0.18");
  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    filters.join(","),
    ...codec,
    "-an",
    ...format,
    tmp,
  ];
  execSync(`ffmpeg ${args.map((a) => `"${a}"`).join(" ")}`, { stdio: "inherit", shell: true });
  renameSync(tmp, output);
  console.log(`[compress-hero-videos] wrote ${output}`);
}

console.log("[compress-hero-videos] done");
