# 公共字体字形子集

首页常用字符采用冻结原字体的 WOFF2 子集，保留原字体、静态字重及完整 fallback CSS。新增内容中的其他字符仍由原始 Google 字体声明加载。原始声明和子集声明合并成一张 CSS，避免两张异步样式表到达顺序造成重复字体下载。`index.html` 通过 `data-public-font-href` 保留字体样式地址，初始不设置 `href`。`publicBoot` 在真实页面就绪且视觉过渡结束后开始下载样式，下载完成后再激活可选字体，避免样式本身和字体与路由脚本、关键图片争抢带宽；字体不参与就绪判定，超时与错误恢复沿用原有流程。

字符集位于 `scripts/fixtures/public-font-subset-characters.txt`，来源为三语首页公开文字及 Latin-1 字符。生成器只访问原始 CSS 中已有的 fonts.gstatic.com 地址，不调用付费服务。FontTools 仅是离线生成工具，不是网站依赖。

在项目根目录执行：

```sh
python3 -m venv tmp/prelaunch-font-tools
tmp/prelaunch-font-tools/bin/pip install -r scripts/requirements-font-subsets.txt
tmp/prelaunch-font-tools/bin/python scripts/generate-public-font-subsets.py \
  --corpus scripts/fixtures/public-font-subset-characters.txt \
  --source-css public/fonts/noto-sc-static-902c20475ce5.css \
  --output public/fonts --cache tmp/prelaunch-font-sources
node scripts/check-public-font-subsets.mjs
```

更新生成物时同步修改 index.html 中字体样式表的内容哈希。生成文件必须以完整原始 fallback CSS 为前缀，不要扩大字重范围。已有哈希资源保留至正常发布清理流程处理。两份 OFL 授权文件随字体提供。

验收：运行原字体生成检查和子集检查；在 Chromium、WebKit 中比对所有子集字符、两个字体和实际/合成字重的像素与宽度，并复测三语桌面/手机首屏和弱网资源。生成成功不代表性能或外观验收通过。
