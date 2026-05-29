/**
 * Re-encode hero videos when ffmpeg is available.
 * Targets: desktop MP4 <= 8MB, mobile MP4 <= 5MB, optional WebM.
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
  { in: "home-hero.mp4", out: "home-hero.mp4", maxMb: 8, scale: "1920:-2" },
  { in: "home-hero-mobile.mp4", out: "home-hero-mobile.mp4", maxMb: 5, scale: "1280:-2" },
  { in: "home-hero.mp4", out: "home-hero.webm", maxMb: 6, scale: "1920:-2", webm: true },
  { in: "home-hero-mobile.mp4", out: "home-hero-mobile.webm", maxMb: 4, scale: "1280:-2", webm: true },
];

for (const job of jobs) {
  const input = path.join(dir, job.in);
  const output = path.join(dir, job.out);
  if (!existsSync(input)) {
    console.warn(`[compress-hero-videos] missing ${input}`);
    continue;
  }
  const tmp = job.webm ? `${output}.tmp.webm` : `${output}.tmp.mp4`;
  const crf = job.webm ? "32" : "28";
  const codec = job.webm ? ["-c:v", "libvpx-vp9", "-b:v", "0"] : ["-c:v", "libx264", "-preset", "slow", "-crf", crf];
  const format = job.webm ? ["-f", "webm"] : ["-f", "mp4", "-movflags", "+faststart"];
  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    `scale=${job.scale}`,
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
