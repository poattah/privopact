# Privopact – Global Privacy Control Privacy Policy

Effective date: October 25, 2026

Privopact is a Chrome extension that sends Global Privacy Control (GPC) signals and shows an on-device assessment of how visited websites appear to recognize GPC and other privacy signals.

## Information the extension handles

On websites you visit, the extension reads the page URL, hostname, title, a limited sample of visible page text and links, script hostnames, whether a privacy policy link appears, an estimate of the number of accessible cookies, and the site's response to `/.well-known/gpc.json`. It uses these signals to produce the result shown in the extension popup. It does not save page text, link samples, script hostnames, or cookie values.

The extension saves your GPC on/off preference, the hosts and URLs it has assessed, scan times, up to 40 recent activity entries, and recognition and privacy score summaries in Chrome's local extension storage on your device. These records support the popup's current-site result and sites-reached count. Site summaries remain in local storage until the extension's data is cleared or the extension is removed.

## How information is used and shared

The extension uses this information only to send GPC signals and provide its on-device site assessment. It does not send browsing history, page content, or the saved summaries to the developer's servers. It does not sell user data or use it for advertising, lending, or credit decisions.

When GPC is enabled, the extension adds a `Sec-GPC: 1` header to supported requests. Its page script sets `navigator.globalPrivacyControl` to `true`. The extension requests `/.well-known/gpc.json` from websites it assesses. These requests go to the websites you visit as part of the extension's function.

## Your choices

You can change the GPC setting in the extension popup. You can remove locally stored extension data by clearing the extension's storage or uninstalling the extension. A site's assessment is based on observable signals. It does not guarantee that a website complies with a privacy law or honors your preference.

## Contact

For privacy questions, contact the publisher at **poattah@gmail.com**.
