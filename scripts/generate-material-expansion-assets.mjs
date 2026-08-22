import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const coverSourceDir = args.find((arg) => arg.startsWith("--cover-source-dir="))?.slice("--cover-source-dir=".length);
const projectRoot = path.resolve(args.find((arg) => arg.startsWith("--project-root="))?.slice("--project-root=".length) || process.cwd());

if (!coverSourceDir) {
  throw new Error("--cover-source-dir=<folder containing <slug>.png> is required.");
}

const candidates = [
  ["spc-flooring-light-oak", "floor", ["#d8bd91", "#b89466", "#f3eadc"]],
  ["engineered-wood-dark-walnut", "floor", ["#5b3427", "#8a5940", "#d9c0a2"]],
  ["kitchen-cabinet-matte-grey-slab", "cabinet", ["#73777a", "#a9acad", "#e5e2dc"]],
  ["kitchen-cabinet-natural-woodgrain", "cabinet", ["#b78555", "#dfc092", "#f2eadc"]],
  ["cabinet-system-moisture-resistant", "cabinet", ["#859c93", "#c2d0c8", "#edf0eb"]],
  ["quartz-countertop-dark-stone-look", "surface", ["#292b2d", "#696b6b", "#e4ded3"]],
  ["solid-surface-warm-beige", "surface", ["#d3bda1", "#efe1cf", "#a98865"]],
  ["bathroom-vanity-wall-hung", "vanity", ["#b88d5f", "#e8dfd1", "#8d9693"]],
  ["shower-screen-black-framed", "shower", ["#1f2528", "#9eb8bd", "#e8efee"]],
  ["bathroom-floor-tile-anti-slip", "tile", ["#9b9890", "#c8c4ba", "#e8e3d9"]],
  ["wall-panel-natural-timber-look", "wall", ["#bd8e5c", "#dfbf91", "#f0e7da"]],
  ["wall-panel-charcoal-fluted", "wall", ["#34383a", "#606567", "#d0c7b8"]],
  ["wall-panel-acoustic-system", "wall", ["#a77745", "#d3aa73", "#57544e"]],
  ["entry-shoe-cabinet-bench", "storage", ["#c89d69", "#eee8dc", "#8d8171"]],
  ["tv-storage-wall", "storage", ["#9c6d48", "#363b3d", "#dad2c5"]],
  ["wardrobe-full-height", "storage", ["#bf9569", "#e7d8c4", "#71675e"]],
  ["study-desk-storage", "storage", ["#c9a577", "#f0e8dc", "#66727a"]],
  ["display-storage-cabinet", "storage", ["#5c3c2d", "#706b65", "#d2aa77"]],
];

const views = [
  ["scene-plan.webp", "scene"],
  ["texture.webp", "texture"],
  ["detail.webp", "detail"],
  ["specification.webp", "specification"],
  ["installation.webp", "installation"],
  ["pairing.webp", "pairing"],
  ["edge-detail.webp", "edge"],
  ["maintenance.webp", "maintenance"],
  ["alternate-layout.webp", "alternate"],
];

const hash = (value) => [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
const lineSet = (seed, colour, opacity = 0.28) => Array.from({ length: 14 }, (_, index) => {
  const y = 110 + ((index * 97 + seed) % 1320);
  const bend = 40 + ((index * 53 + seed) % 150);
  return `<path d="M 50 ${y} C 380 ${y - bend}, 790 ${y + bend}, 1550 ${y - 12}" fill="none" stroke="${colour}" stroke-opacity="${opacity}" stroke-width="${4 + (index % 3) * 2}"/>`;
}).join("");

const productShape = (kind, colours, seed, variant = 0) => {
  const [primary, secondary, pale] = colours;
  const shift = (seed + variant * 47) % 90;
  if (kind === "floor" || kind === "tile") {
    const rows = Array.from({ length: 8 }, (_, row) => Array.from({ length: 7 }, (_, col) => {
      const x = 205 + col * 170 + ((row % 2) * 84);
      const y = 400 + row * 105;
      return `<path d="M ${x} ${y} l 145 -54 l 166 63 l -149 58 z" fill="${(row + col) % 3 === 0 ? secondary : primary}" fill-opacity="${0.72 + ((row + col) % 2) * 0.14}" stroke="#ffffff" stroke-opacity=".5" stroke-width="5"/>`;
    }).join("")).join("");
    return `<g transform="translate(${-shift},0)">${rows}</g>`;
  }
  if (kind === "cabinet" || kind === "storage") {
    const count = kind === "storage" ? 5 : 6;
    const doors = Array.from({ length: count }, (_, index) => {
      const width = 860 / count;
      return `<rect x="${370 + index * width}" y="440" width="${width - 10}" height="680" rx="${variant % 2 ? 8 : 24}" fill="${index % 3 === 1 ? secondary : primary}" fill-opacity="${0.78 + (index % 2) * .12}"/><circle cx="${370 + index * width + width - 36}" cy="790" r="8" fill="#302d2a" fill-opacity=".65"/>`;
    }).join("");
    return `<g><rect x="305" y="360" width="990" height="850" rx="38" fill="#332f2b" fill-opacity=".12"/>${doors}<rect x="420" y="1160" width="760" height="34" rx="17" fill="${pale}"/></g>`;
  }
  if (kind === "surface") {
    return `<g><path d="M 260 520 L 1250 410 L 1390 650 L 405 780 Z" fill="${primary}"/><path d="M 405 780 L 1390 650 L 1390 760 L 405 900 Z" fill="${secondary}"/><path d="M 260 520 L 405 780 L 405 900 L 260 635 Z" fill="${pale}"/>${lineSet(seed, pale, .42)}</g>`;
  }
  if (kind === "vanity") {
    return `<g><rect x="390" y="545" width="820" height="430" rx="34" fill="${primary}"/><rect x="390" y="510" width="820" height="65" rx="26" fill="${pale}"/><ellipse cx="800" cy="555" rx="160" ry="70" fill="#f8f7f3" stroke="${secondary}" stroke-width="15"/><rect x="480" y="975" width="640" height="28" rx="14" fill="${secondary}" fill-opacity=".45"/><circle cx="800" cy="780" r="10" fill="#3b3936"/></g>`;
  }
  if (kind === "shower") {
    return `<g><rect x="400" y="270" width="800" height="930" rx="18" fill="url(#glass)" stroke="${primary}" stroke-width="24"/><line x1="790" y1="282" x2="790" y2="1188" stroke="${primary}" stroke-width="19"/><line x1="415" y1="560" x2="1185" y2="560" stroke="${primary}" stroke-width="14"/><circle cx="850" cy="790" r="18" fill="${primary}"/><path d="M 290 1210 L 1320 1210" stroke="${secondary}" stroke-width="30" stroke-linecap="round"/></g>`;
  }
  return `<g>${Array.from({ length: 13 }, (_, index) => `<rect x="${260 + index * 82}" y="300" width="${44 + (index % 3) * 8}" height="900" rx="15" fill="${index % 4 === 0 ? secondary : primary}"/>`).join("")}<rect x="230" y="1210" width="1135" height="24" rx="12" fill="${pale}"/></g>`;
};

const createSvg = ({ slug, kind, colours, view, index }) => {
  const seed = hash(`${slug}-${view}`);
  const [primary, secondary, pale] = colours;
  const shape = productShape(kind, colours, seed, index);
  const dots = Array.from({ length: 28 }, (_, dot) => {
    const cx = 80 + ((seed + dot * 137) % 1440);
    const cy = 80 + (((seed >>> 3) + dot * 211) % 1440);
    const radius = 3 + ((seed + dot) % 8);
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${dot % 2 ? primary : secondary}" fill-opacity=".18"/>`;
  }).join("");

  const content = {
    scene: `<g transform="translate(0,-40)">${shape}</g><path d="M 130 1330 C 430 1230, 1100 1250, 1470 1340" fill="none" stroke="${primary}" stroke-opacity=".18" stroke-width="32"/>`,
    texture: `<rect x="170" y="170" width="1260" height="1260" rx="80" fill="${primary}"/>${lineSet(seed, pale, .48)}<rect x="230" y="230" width="1140" height="1140" rx="54" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="12"/>`,
    detail: `<g transform="translate(-170,150) scale(1.28)">${shape}</g><circle cx="1210" cy="360" r="205" fill="${pale}" stroke="${secondary}" stroke-width="30"/><circle cx="1210" cy="360" r="118" fill="${primary}" fill-opacity=".82"/>`,
    specification: `<g transform="translate(-30,-150) scale(.72)">${shape}</g>${Array.from({ length: 5 }, (_, n) => `<rect x="${250 + n * 225}" y="1090" width="170" height="170" rx="30" fill="${n % 3 === 0 ? primary : n % 3 === 1 ? secondary : pale}"/><circle cx="${335 + n * 225}" cy="1175" r="35" fill="#fff" fill-opacity=".2"/>`).join("")}`,
    installation: `<g transform="translate(40,-260) scale(.62)">${shape}</g>${Array.from({ length: 5 }, (_, n) => `<path d="M ${270 + n * 210} 1000 L ${380 + n * 210} 905 L ${490 + n * 210} 1000 L ${380 + n * 210} 1095 Z" fill="${n % 2 ? secondary : primary}" fill-opacity="${.55 + n * .07}"/>`).join("")}<path d="M 230 1180 H 1370" stroke="${pale}" stroke-width="55" stroke-linecap="round"/>`,
    pairing: `<g transform="translate(-160,-110) scale(.68)">${shape}</g><circle cx="1120" cy="520" r="190" fill="${primary}"/><circle cx="1260" cy="760" r="160" fill="${secondary}"/><circle cx="1050" cy="920" r="135" fill="${pale}"/><circle cx="1250" cy="1070" r="105" fill="#413c37" fill-opacity=".76"/>`,
    edge: `<path d="M 250 360 L 1070 360 L 1360 650 L 540 650 Z" fill="${primary}"/><path d="M 540 650 L 1360 650 L 1360 850 L 540 850 Z" fill="${secondary}"/><path d="M 250 360 L 540 650 L 540 850 L 250 550 Z" fill="${pale}"/><path d="M 540 650 H 1360" stroke="#fff" stroke-opacity=".45" stroke-width="14"/><circle cx="445" cy="1050" r="150" fill="${primary}" fill-opacity=".2"/><circle cx="1110" cy="1080" r="205" fill="${secondary}" fill-opacity=".18"/>`,
    maintenance: `<g transform="translate(-40,-220) scale(.62)">${shape}</g><circle cx="800" cy="1060" r="250" fill="${pale}"/><path d="M 670 1080 Q 800 870 930 1080 Q 860 1190 800 1230 Q 740 1190 670 1080" fill="${primary}" fill-opacity=".78"/><path d="M 720 1080 Q 800 980 880 1080" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="28" stroke-linecap="round"/>`,
    alternate: `<g transform="translate(-370,-170) scale(.58)">${shape}</g><g transform="translate(610,400) scale(.58)">${shape}</g><path d="M 800 220 V 1380" stroke="${secondary}" stroke-opacity=".25" stroke-width="14"/>`,
  }[view];

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600" viewBox="0 0 1600 1600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#faf8f4"/><stop offset="1" stop-color="${pale}" stop-opacity=".72"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="${secondary}" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".58"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="32" stdDeviation="32" flood-color="#2d2925" flood-opacity=".17"/></filter>
    </defs>
    <rect width="1600" height="1600" fill="url(#bg)"/>
    ${dots}
    <g filter="url(#shadow)">${content}</g>
    <rect x="42" y="42" width="1516" height="1516" rx="54" fill="none" stroke="${primary}" stroke-opacity=".13" stroke-width="5"/>
  </svg>`);
};

const writeCover = async (sourcePath, outputPath) => {
  const quality = 70;
  const output = await sharp(sourcePath)
    .rotate()
    .resize(1600, 1600, { fit: "cover", position: "attention" })
    .webp({ quality, effort: 4, smartSubsample: true })
    .toBuffer();
  await fs.writeFile(outputPath, output);
  return { bytes: output.length, quality };
};

const manifest = [];
for (const [slug, kind, colours] of candidates) {
  const outputDir = path.join(projectRoot, "public", "images", "materials", "catalog-expansion", slug);
  const sourceCover = path.resolve(coverSourceDir, `${slug}.png`);
  await fs.access(sourceCover);
  await fs.mkdir(outputDir, { recursive: true });
  const cover = await writeCover(sourceCover, path.join(outputDir, "cover.webp"));

  const conceptFiles = [];
  for (const [file, view] of views) {
    const svg = createSvg({ slug, kind, colours, view, index: views.findIndex(([name]) => name === file) });
    const target = path.join(outputDir, file);
    await sharp(svg).webp({ quality: 82, effort: 4 }).toFile(target);
    const stats = await fs.stat(target);
    conceptFiles.push({ file, bytes: stats.size });
  }
  manifest.push({ slug, cover, conceptFiles });
}

console.log(JSON.stringify({ ok: true, generatedAt: new Date().toISOString(), products: manifest.length, manifest }, null, 2));
