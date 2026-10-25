import { detectGpcRecognition, privacyScoreFromSignals } from "../lib/heuristics";
import { STORAGE_KEY } from "../lib/constants";
import type { ActivityEntry, ExtensionState, SiteScanPayload } from "../lib/types";

const DNR_RULE_ID = 100_001;
const MAX_ACTIVITY = 40;
const LEGACY_STORAGE_KEY = "panopticGpcState";

const defaultState = (): ExtensionState => ({
  gpcEnabled: true,
  protectedHosts: [],
  activity: [],
  hostSummaries: {},
});

async function readState(): Promise<ExtensionState> {
  const res = await chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  const saved = (res[STORAGE_KEY] ?? res[LEGACY_STORAGE_KEY]) as ExtensionState | undefined;
  const merged = { ...defaultState(), ...saved };
  if (!res[STORAGE_KEY] && saved) {
    await chrome.storage.local.set({ [STORAGE_KEY]: merged });
  }
  return merged;
}

async function writeState(state: ExtensionState) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function applyDnr(enabled: boolean) {
  // Use a single atomic update to avoid races that cause:
  // "Rule with id ... does not have a unique ID."
  const removeRuleIds = [DNR_RULE_ID];
  const addRules = enabled
    ? [
        {
          id: DNR_RULE_ID,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              {
                header: "Sec-GPC",
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: "1",
              },
            ],
          },
          condition: {
            urlFilter: "*",
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
              chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.OTHER,
            ],
          },
        },
      ]
    : [];

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await readState();
  if (state.gpcEnabled === undefined) {
    await writeState({ ...defaultState(), ...state, gpcEnabled: true });
  }
  await applyDnr((await readState()).gpcEnabled);
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await readState();
  await applyDnr(state.gpcEnabled);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_STATE") {
    readState().then(sendResponse);
    return true;
  }
  if (message?.type === "SET_GPC_ENABLED") {
    (async () => {
      const next = Boolean(message.enabled);
      const state = await readState();
      await writeState({ ...state, gpcEnabled: next });
      await applyDnr(next);
      sendResponse({ ok: true, gpcEnabled: next });
    })();
    return true;
  }
  if (message?.type === "SITE_SCAN") {
    (async () => {
      const payload = message.payload as SiteScanPayload;
      const state = await readState();
      const recognition = detectGpcRecognition(payload);
      const score = privacyScoreFromSignals(recognition, payload);

      const entry: ActivityEntry = {
        id: uid(),
        timestamp: payload.timestamp,
        host: payload.host,
        url: payload.url,
        recognition,
        score,
      };

      const protectedHosts = new Set(state.protectedHosts);
      if (state.gpcEnabled) protectedHosts.add(payload.host);

      const activity = [entry, ...state.activity].slice(0, MAX_ACTIVITY);
      const hostSummaries = {
        ...state.hostSummaries,
        [payload.host]: {
          host: payload.host,
          lastRecognition: recognition,
          lastScore: score,
          lastSeen: payload.timestamp,
          lastUrl: payload.url,
        },
      };

      await writeState({
        ...state,
        protectedHosts: Array.from(protectedHosts),
        activity,
        hostSummaries,
      });
      sendResponse({ ok: true, recognition, score });
    })();
    return true;
  }
  return false;
});

void (async () => {
  const state = await readState();
  await applyDnr(state.gpcEnabled);
})();
