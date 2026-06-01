# Real Browser Compatibility

This project has two browser-compatibility layers:

1. `npm run test:e2e` covers the mainstream browser engines with Playwright: Chromium, Firefox, WebKit, Android Chrome emulation, and iPhone Safari emulation.
2. `npm run test:real-browsers` runs real BrowserStack sessions against the public site.

## BrowserStack Setup

Add these GitHub Actions secrets before running the manual workflow:

- `BROWSERSTACK_USERNAME`
- `BROWSERSTACK_ACCESS_KEY`

Then open the manual workflow:

- `BrowserStack real browser compatibility`

Default targets:

- `windows-chrome`
- `windows-edge`
- `windows-firefox`
- `macos-safari`
- `iphone-safari-real`
- `android-chrome-real`

Use the `targets` workflow input to run a subset, for example:

```text
windows-chrome,iphone-safari-real
```

## Vendor Browser Notes

360 Browser, QQ Browser, UC Browser, and Samsung Internet are vendor shell browsers. Their behavior is usually close to Chromium/WebKit, but a strict certification pass needs those exact apps on real devices or a cloud provider that exposes those exact browser names. Keep the BrowserStack result as the automated baseline, then record any exact vendor-browser manual pass separately if the provider does not expose that app for automation.

## Local Installed Browser Check

On a Windows workstation with vendor browsers installed, run:

```bash
npm run test:installed-browsers
```

The script detects and tests installed desktop browsers from these target ids:

- `chrome`
- `edge`
- `360`
- `qq`
- `uc`

Run a subset with:

```bash
INSTALLED_BROWSER_TARGETS=chrome,360 npm run test:installed-browsers
```

Set `INSTALLED_BROWSER_HEADLESS=0` if you want to see the browser window while testing.
