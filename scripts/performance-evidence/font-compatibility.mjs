import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, expect } from '@playwright/test';

const run = process.env.PERFORMANCE_FONT_RUN || 'font-comparison';
if (!/^[a-z0-9-]{1,64}$/.test(run)) throw new Error('Use a project-local font run name.');
const directory = path.resolve('tmp/performance-evidence', run);
const before = fs.readFileSync(path.join(directory, 'before.css'), 'utf8');
const after = fs.readFileSync(path.join(directory, 'range.css'), 'utf8');
const rename = (css, prefix) => css.replace(/font-family:\s*'(Noto (?:Sans|Serif) SC)'/g, (_, family) => `font-family: '${prefix} ${family}'`);
const text = 'FLASH CAST Ruang yang lebih baik. 更好的空间，美好的生活。装修 家具 吉隆坡 雪兰莪';
const results = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      return ['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && url.hostname === 'fonts.gstatic.com'
        ? route.continue() : route.abort();
    });
    await page.setContent(`<style>${rename(before, 'Before')}\n${rename(after, 'After')}</style><canvas width="1800" height="80"></canvas>`);
    const pairs = await page.evaluate(async ({ text }) => {
      const canvas = document.querySelector('canvas'), context = canvas.getContext('2d');
      const result = [];
      for (const family of ['Noto Sans SC', 'Noto Serif SC']) for (const weight of [300, 400, 500, 600, 700, 800]) {
        const render = async prefix => {
          const font = `${weight} 32px "${prefix} ${family}"`;
          const loaded = await document.fonts.load(font, text);
          if (!loaded.length) throw new Error('Expected font was not loaded.');
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.font = font; context.fillStyle = '#15110d'; context.fillText(text, 8, 50);
          return { pixels: context.getImageData(0, 0, canvas.width, canvas.height).data, width: context.measureText(text).width };
        };
        const old = await render('Before'), current = await render('After');
        result.push({ family, weight, widthEqual: old.width === current.width, pixelsEqual: old.pixels.every((value, index) => value === current.pixels[index]) });
      }
      return result;
    }, { text });
    results.push({ browser: name, version: browser.version(), pairs });
    expect(pairs.every(pair => pair.widthEqual && pair.pixelsEqual)).toBe(true);
  } finally { await browser.close(); }
}
fs.writeFileSync(path.join(directory, 'render-comparison.json'), JSON.stringify({ results }, null, 2) + '\n');
console.log(JSON.stringify(results));
