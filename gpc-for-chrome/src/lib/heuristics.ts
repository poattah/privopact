import type { GpcRecognition, PrivacyScoreBand, SiteScanPayload } from "./types";

const GPC_PHRASES = [
  "global privacy control",
  "global-privacy-control",
  "sec-gpc",
  "gpc signal",
];

const HONOR_VERBS = ["honor", "honour", "respect", "recognize", "recognise", "process", "respond"];

const PARTIAL_MARKERS = [
  "do not sell",
  "do not share",
  "opt-out",
  "opt out",
  "targeted advertising",
  "personal information sale",
  "your privacy choices",
  "privacy rights",
  "ccpa",
  "cpra",
  "colorado privacy",
  "virginia consumer",
  "connecticut data",
];

const TRACKER_HINTS = [
  "googletagmanager.com",
  "google-analytics.com",
  "doubleclick.net",
  "facebook.net",
  "scorecardresearch.com",
  "ads-twitter.com",
  "linkedin.com/px",
  "hotjar.com",
  "segment.com",
  "mixpanel.com",
];

function normalize(s: string) {
  return s.toLowerCase();
}

export function detectGpcRecognition(payload: SiteScanPayload): GpcRecognition {
  // 1. Official Well-Known GPC check (strongest indicator)
  if (payload.wellKnownGpc === true) return "honors";

  const hay = normalize(`${payload.textSample}\n${payload.hrefSample}\n${payload.title}`);

  const mentionsGpc = GPC_PHRASES.some((p) => hay.includes(p));
  const honorsLanguage =
    mentionsGpc &&
    HONOR_VERBS.some((v) => {
      const i = hay.indexOf(v);
      if (i === -1) return false;
      const windowText = hay.slice(Math.max(0, i - 120), i + 160);
      return GPC_PHRASES.some((p) => windowText.includes(p));
    });

  if (honorsLanguage) return "honors";

  const partial = PARTIAL_MARKERS.some((m) => hay.includes(m));
  if (partial) {
    return mentionsGpc ? "partial" : "partial";
  }

  if (payload.hasPrivacyPolicyLink && hay.length > 400) return "unknown";
  return "none";
}

export function privacyScoreFromSignals(
  recognition: GpcRecognition,
  payload: SiteScanPayload
): PrivacyScoreBand {
  const trackerHits = TRACKER_HINTS.filter((h) =>
    payload.scriptHosts.some((s) => s.includes(h.replace("www.", "")))
  ).length;

  const thirdPartyLoad = Math.min(5, payload.scriptHosts.length);
  const cookiePressure = Math.min(5, Math.floor(payload.cookieCountEstimate / 8));

  let points = 50;
  if (recognition === "honors") points += 35;
  else if (recognition === "partial") points += 18;
  else if (recognition === "none") points -= 12;
  else points += 4;

  points -= trackerHits * 8;
  points -= thirdPartyLoad * 3;
  points -= cookiePressure * 2;

  if (!payload.hasPrivacyPolicyLink) points -= 6;

  if (points >= 82) return "excellent";
  if (points >= 68) return "good";
  if (points >= 52) return "moderate";
  if (points >= 36) return "poor";
  return "high_risk";
}
