import type { ExtensionState } from "../lib/types";

/** Keep in sync with `src/lib/constants.ts` for the service worker bundle. */
const STORAGE_KEY = "privopactGpcState";
const LEGACY_STORAGE_KEY = "panopticGpcState";


async function isGpcEnabled(): Promise<boolean> {
  const res = await chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  const state = (res[STORAGE_KEY] ?? res[LEGACY_STORAGE_KEY]) as ExtensionState | undefined;
  return state?.gpcEnabled !== false;
}

void (async function init() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEY]) return;
    // Note: State change is now automatically reflected in headers by DNR in background.
    // The main-world property is static for now for reliability.
  });
})();

function collectScriptHosts(): string[] {
  const hosts = new Set<string>();
  for (const s of Array.from(document.scripts)) {
    try {
      if (s.src) hosts.add(new URL(s.src).hostname);
    } catch {
      /* ignore */
    }
  }
  return Array.from(hosts).slice(0, 80);
}

function sampleText(maxLen: number) {
  const text = document.body?.innerText ?? "";
  return text.slice(0, maxLen);
}

function sampleHrefs(maxLen: number) {
  const parts: string[] = [];
  for (const a of Array.from(document.querySelectorAll("a[href]")).slice(0, 120)) {
    parts.push(`${a.textContent ?? ""} ${(a as HTMLAnchorElement).href}`);
  }
  return parts.join("\n").slice(0, maxLen);
}

function hasPrivacyPolicyLink() {
  return Array.from(document.querySelectorAll("a[href]")).some((a) => {
    const href = (a as HTMLAnchorElement).href.toLowerCase();
    const t = (a.textContent ?? "").toLowerCase();
    return (
      href.includes("privacy") ||
      t.includes("privacy policy") ||
      t.includes("privacy notice")
    );
  });
}

async function checkWellKnownGpc(): Promise<boolean | null> {
  try {
    const resp = await fetch("/.well-known/gpc.json", {
      method: "GET",
      credentials: "omit",
      cache: "no-cache",
    });
    if (!resp.ok) return false;
    const json = await resp.json();
    return json?.gpc === true;
  } catch {
    return null;
  }
}

async function postScan() {
  try {
    const url = location.href;
    const host = location.hostname;
    const title = document.title || host;
    const wellKnownGpc = await checkWellKnownGpc();

    const payload = {
      url,
      host,
      title,
      textSample: sampleText(12_000),
      hrefSample: sampleHrefs(12_000),
      scriptHosts: collectScriptHosts(),
      cookieCountEstimate: (document.cookie || "").split(";").filter(Boolean).length,
      hasPrivacyPolicyLink: hasPrivacyPolicyLink(),
      wellKnownGpc,
      timestamp: Date.now(),
    };
    void chrome.runtime.sendMessage({ type: "SITE_SCAN", payload });
  } catch {
    /* ignore */
  }
}

const schedule = () => {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    requestAnimationFrame(() => setTimeout(postScan, 750));
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () => setTimeout(postScan, 750),
      { once: true }
    );
  }
};

schedule();
