import fs from "node:fs";
import path from "node:path";

const adminDir = path.resolve("src/pages/admin");
const skip = new Set([
  "AdminLayout.tsx",
  "AdminRoute.tsx",
  "AdminAuthProvider.tsx",
  "AdminLogin.tsx",
  "AdminImageUpload.tsx",
  "AdminProjectImages.tsx",
]);

function closeFragmentBeforeComponentEnd(src) {
  const exportAtBottom = src.search(/\nexport default /);
  const cut =
    exportAtBottom >= 0
      ? exportAtBottom
      : src.lastIndexOf("\n}") >= 0
        ? src.lastIndexOf("\n}")
        : src.length;

  const head = src.slice(0, cut);
  const tail = src.slice(cut);
  const lines = head.split("\n");

  for (let i = lines.length - 1; i >= 0; i--) {
    if (!/^\s*\);\s*$/.test(lines[i])) continue;
    const prev = (lines[i - 1] || "").trim();
    if (prev === "</>") break;
    const indent = lines[i].match(/^(\s*)/)[1];
    lines.splice(i, 0, `${indent}</>`);
    break;
  }
  return lines.join("\n") + tail;
}

function wrapAdminPageHeaderReturn(src) {
  if (!/return \(\s*\n\s*<AdminPageHeader/.test(src)) return src;
  if (/return \(\s*\n\s*<>[\s\S]*?<AdminPageHeader/.test(src)) return src;
  return src.replace(
    /return \(\s*\n(\s*)<AdminPageHeader/,
    "return (\n$1<>\n$1<AdminPageHeader",
  );
}

for (const file of fs.readdirSync(adminDir)) {
  if (!file.endsWith(".tsx") || skip.has(file)) continue;
  const filePath = path.join(adminDir, file);
  let src = fs.readFileSync(filePath, "utf8");
  const original = src;

  src = wrapAdminPageHeaderReturn(src);
  if (/return \(\s*\n\s*<>/.test(src) || /return \(\s*\n\s*<AdminPageHeader/.test(src)) {
    src = closeFragmentBeforeComponentEnd(src);
  }

  if (src !== original) {
    fs.writeFileSync(filePath, src, "utf8");
    console.log("fixed", file);
  }
}
