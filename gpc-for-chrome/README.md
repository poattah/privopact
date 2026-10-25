# Privopact GPC for Chrome

A free, open-source Chrome extension that sends the [Global Privacy Control](https://globalprivacycontrol.org/) (GPC) signal to every website you visit and shows which sites say they honor it.

Part of [Privopact](https://privopact.com), a suite of free privacy tools for web, mobile and connected TV.

## What it does

- **Sends the GPC signal.** Adds the `Sec-GPC: 1` header to page, frame and XHR requests, and sets `navigator.globalPrivacyControl` to `true` on every page.
- **Checks each site.** Reads the site's `/.well-known/gpc.json` file and looks for privacy-policy and opt-out language to estimate whether the site recognizes GPC.
- **Scores privacy signals.** Gives each site a simple score based on GPC support, known trackers, third-party scripts, cookies and whether it links to a privacy policy.
- **One switch.** Turn GPC on or off from the popup at any time.

In California, Colorado and a growing list of other US states, covered businesses must treat GPC as a valid request to opt out of the sale or sharing of personal data.

## Privacy

Everything runs locally in your browser.

- No accounts, no analytics and no requests to Privopact servers.
- Settings and a short history of assessed sites are kept in `chrome.storage.local` on your device.
- The only network request the extension makes itself is to the `/.well-known/gpc.json` file of the site you're visiting.

Privacy policy: [privopact.com/privacy](https://privopact.com/privacy). Extension-specific details are also in [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Saves your on/off setting and the local history shown in the popup. |
| `declarativeNetRequest` | Adds the `Sec-GPC: 1` header to requests. |
| Host access (`<all_urls>`) | Sends the signal to every site, sets `navigator.globalPrivacyControl` and checks the site's GPC file. |

All code ships in the package. The extension loads no remote code.

## Build from source

Requires Node.js 18 or newer.

```bash
git clone https://github.com/poattah/privopact.git
cd privopact/gpc-for-chrome
npm install
npm run build
```

The unpacked extension is written to `dist/`. To load it:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `dist` folder.

Other scripts:

- `npm run dev` rebuilds on every change.
- `npm run check` runs the TypeScript checks.
- `npm run zip` builds and packages `extension.zip` for the Chrome Web Store.

## Project layout

```
src/
  background/   Service worker: GPC header rule and site-scan storage
  content/      Content scripts: navigator flag and site checks
  lib/          Shared types, constants and scoring heuristics
  popup/        React popup UI
  manifest.json Extension manifest
public/icons/   Extension icons
```

## Contributing

Issues and pull requests are welcome. For anything larger than a small fix, please open an issue first so we can agree on the approach.

## License

[MIT](../LICENSE) © 2026 Prince Owusu Attah
