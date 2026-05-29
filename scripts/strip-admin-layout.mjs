import fs from "node:fs";
import path from "node:path";

const adminDir = path.resolve("src/pages/admin");
const files = fs.readdirSync(adminDir).filter((f) => f.endsWith(".tsx") && f !== "AdminLayout.tsx");

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let src = fs.readFileSync(filePath, "utf8");
  const before = src;

  src = src.replace(/import AdminLayout from "\.\/AdminLayout";\r?\n/g, "");
  src = src.replace(/<AdminLayout>\s*/g, "");
  src = src.replace(/\s*<\/AdminLayout>/g, "");

  if (src !== before) {
    fs.writeFileSync(filePath, src, "utf8");
    console.log("updated", file);
  }
}
