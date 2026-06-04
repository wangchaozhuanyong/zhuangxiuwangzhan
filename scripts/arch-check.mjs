import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const fixedModules = [
  "home",
  "company",
  "services",
  "projects",
  "materials",
  "blog",
  "cms",
  "leads",
  "quotes",
  "followups",
  "media",
  "seo",
  "admin-auth",
  "admin-users",
  "settings",
  "system",
];

const requiredLayers = ["routes", "controller", "service", "repository"];
const optionalLayers = ["schemas"];

const requiredFiles = [
  "AGENTS.md",
  "docs/ARCHITECTURE.md",
  "docs/ARCHITECTURE_AUDIT.md",
  "src/App.tsx",
  "src/routes/publicRoutes.tsx",
  "src/routes/adminRoutes.tsx",
  "supabase/functions",
  "supabase/migrations",
  "public/_headers",
  "public/_redirects",
  "functions/_middleware.ts",
];

const requiredArchitecturePhrases = [
  "Modular Monolith + Layered Architecture",
  "Architecture Decision:",
  "Architecture Compliance Report:",
  "Recommended Backend Modules",
  "src/backend/modules/<module>/{routes,controller,service,repository}",
];

const requiredFunctionNames = [
  "submit-lead",
  "notify-lead",
  "notification-settings",
  "maintenance-reminder",
  "geocode-address",
  "generate-english-content",
  "health-check",
  "sitemap",
];

const errors = [];
const warnings = [];
const legacyWarnings = [];

function rel(...parts) {
  return path.join(root, ...parts);
}

function exists(relativePath) {
  return fs.existsSync(rel(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(rel(relativePath), "utf8");
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function legacyWarn(message) {
  legacyWarnings.push(message);
}

function walkFiles(start, extensions = [".ts", ".tsx", ".js", ".mjs"]) {
  const startPath = rel(start);
  if (!fs.existsSync(startPath)) return [];

  const files = [];
  const stack = [startPath];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const stat = fs.statSync(current);

    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
      continue;
    }

    if (extensions.includes(path.extname(current))) {
      files.push(current);
    }
  }

  return files;
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => "\n".repeat(match.split(/\r?\n/).length - 1))
    .replace(/^\s*\/\/.*$/gm, "");
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function scanLegacySupabaseAccess() {
  const directSupabasePattern = /supabase!?\s*\.\s*(from|rpc|functions|storage|auth)|requireSupabase\s*\(/g;
  const scanTargets = [
    { path: "src/pages", level: "error", reason: "page layer must call hooks/services instead of direct Supabase access" },
    { path: "src/components", level: "error", reason: "components must stay UI-focused and avoid direct Supabase access" },
    { path: "src/hooks", level: "error", reason: "hooks must coordinate state and call module service wrappers" },
    { path: "src/lib", level: "error", reason: "src/lib is a compatibility/util layer; database and Edge Function access must live in backend modules" },
    {
      path: "supabase/functions",
      level: "warning",
      indexOnly: true,
      reason: "Edge Function index files should be entry adapters, with complex logic moved into function-local service/repository",
    },
  ];

  for (const target of scanTargets) {
    let matchCount = 0;
    const matchingFiles = [];

    const files = walkFiles(target.path).filter((file) => !target.indexOnly || path.basename(file) === "index.ts");
    for (const file of files) {
      const relativeFile = path.relative(root, file).replaceAll(path.sep, "/");
      const source = fs.readFileSync(file, "utf8");
      const content = stripComments(source);
      const firstMatches = [];
      directSupabasePattern.lastIndex = 0;

      for (const match of content.matchAll(directSupabasePattern)) {
        matchCount += 1;
        if (firstMatches.length < 5) firstMatches.push(lineNumberAt(content, match.index || 0));
      }

      if (firstMatches.length > 0) {
        matchingFiles.push(`${relativeFile}:${firstMatches.join(",")}`);
      }
    }

    if (matchCount > 0) {
      const message = `${target.path}: found ${matchCount} direct Supabase access matches across ${matchingFiles.length} files; ${target.reason}. Examples: ${matchingFiles.slice(0, 8).join("; ")}`;
      if (target.level === "error") fail(message);
      else legacyWarn(message);
    }
  }
}

for (const file of requiredFiles) {
  if (!exists(file)) fail(`Missing required architecture path: ${file}`);
}

if (new Set(fixedModules).size !== fixedModules.length) {
  fail("Fixed module list contains duplicates.");
}

if (fixedModules.length !== 16) {
  fail(`Recommended module list must contain exactly 16 modules, found ${fixedModules.length}.`);
}

if (exists("AGENTS.md")) {
  const agents = read("AGENTS.md");
  for (const moduleName of fixedModules) {
    if (!agents.includes(`\`${moduleName}\``)) fail(`AGENTS.md is missing recommended module: ${moduleName}`);
  }
  for (const phrase of requiredArchitecturePhrases) {
    if (!agents.includes(phrase)) fail(`AGENTS.md is missing required phrase: ${phrase}`);
  }
}

if (exists("docs/ARCHITECTURE.md")) {
  const architecture = read("docs/ARCHITECTURE.md");
  for (const moduleName of fixedModules) {
    if (!architecture.includes(`\`${moduleName}\``)) fail(`docs/ARCHITECTURE.md is missing recommended module: ${moduleName}`);
  }
  for (const phrase of requiredArchitecturePhrases) {
    if (!architecture.includes(phrase)) fail(`docs/ARCHITECTURE.md is missing required phrase: ${phrase}`);
  }
}

if (exists("package.json")) {
  const pkg = JSON.parse(read("package.json"));
  if (pkg.scripts?.["arch:check"] !== "node scripts/arch-check.mjs") {
    fail('package.json must define "arch:check": "node scripts/arch-check.mjs".');
  }
}

if (exists(".github/workflows/prelaunch.yml")) {
  const prelaunch = read(".github/workflows/prelaunch.yml");
  if (!prelaunch.includes("npm run arch:check")) {
    fail("prelaunch CI must run npm run arch:check.");
  }
}

for (const functionName of requiredFunctionNames) {
  if (!exists(path.join("supabase/functions", functionName, "index.ts"))) {
    fail(`Missing required Supabase function entry: supabase/functions/${functionName}/index.ts`);
  }
}

const backendModulesPath = rel("src/backend/modules");
if (fs.existsSync(backendModulesPath)) {
  const moduleEntries = fs.readdirSync(backendModulesPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const entry of moduleEntries) {
    if (!fixedModules.includes(entry.name)) {
      fail(`Unknown backend module directory: src/backend/modules/${entry.name}`);
      continue;
    }

    const modulePath = path.join(backendModulesPath, entry.name);
    for (const layer of requiredLayers) {
      const layerPath = path.join(modulePath, layer);
      if (!fs.existsSync(layerPath) || !fs.statSync(layerPath).isDirectory()) {
        fail(`Backend module ${entry.name} is missing required layer: ${layer}`);
      }
    }

    for (const child of fs.readdirSync(modulePath, { withFileTypes: true }).filter((item) => item.isDirectory())) {
      if (![...requiredLayers, ...optionalLayers].includes(child.name)) {
        fail(`Backend module ${entry.name} contains unknown layer: ${child.name}`);
      }
    }
  }
} else {
  warn("src/backend/modules does not exist yet; current Supabase-compatible backend structure is documented only.");
}

scanLegacySupabaseAccess();

if (errors.length > 0) {
  console.error("Architecture check failed:");
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length > 0) {
    console.error("\nWarnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log("Architecture check passed.");
console.log(`Recommended backend modules: ${fixedModules.length}`);
for (const warning of warnings) console.log(`Warning: ${warning}`);
for (const warning of legacyWarnings) console.log(`Legacy architecture warning: ${warning}`);
