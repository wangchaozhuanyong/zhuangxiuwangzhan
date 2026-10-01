import fs from "node:fs";
import { getContrastRatio } from "../../src/lib/colorContrast.ts";

const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), "utf8"));
const matrix = read("contact-matrix.json");
const layoutPassed = matrix.length === 10 && matrix.every(entry => !entry.overflow
  && entry.rows.length === 8 && entry.rows.every(row => row.aligned && row.textFits && row.height >= 44)
  && entry.cta.length === 2 && Math.abs(entry.cta[0].top - entry.cta[1].top) < 1
  && entry.cta[0].right <= entry.cta[1].left && entry.cta.every(button => button.textFits && button.height >= 48));
const measurements = read("reading-colors.json").flatMap(reading => reading.samples.map(sample => {
  const ratios = ["#000000", "#ffffff"].map(backdrop => getContrastRatio(sample.color, sample.background, backdrop));
  return { path: reading.path, width: reading.width, ...sample,
    minimum: ratios.some(ratio => ratio === null) ? null : Math.min(...ratios),
    pass: ratios.every(ratio => ratio !== null && ratio >= 4.5) };
}));
const failed = measurements.filter(measurement => !measurement.pass);
const result = { layoutPassed, layoutCases: matrix.length, sampleCount: measurements.length,
  minimumContrast: Math.min(...measurements.map(measurement => measurement.minimum ?? 0)), failed, measurements };
fs.writeFileSync(new URL("contrast-results.json", import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, measurements: undefined }));
if (!layoutPassed || failed.length) process.exitCode = 1;
