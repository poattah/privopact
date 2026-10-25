import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityEntry, ExtensionState, GpcRecognition, HostSummary } from "../lib/types";

const LEAD_URL = "https://privopact.com";
const PRIVACY_URL = "https://privopact.com/privacy";

function recognitionLabel(r: GpcRecognition) {
  switch (r) {
    case "honors":
      return "Honors GPC";
    case "partial":
      return "Partial recognition";
    case "none":
      return "No recognition";
    default:
      return "Unknown";
  }
}

function scoreLabel(s: string) {
  return s.replaceAll("_", " ");
}

function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(ts));
  } catch {
    return `${ts}`;
  }
}

export function App() {
  const [state, setState] = useState<ExtensionState | null>(null);
  const [tabHost, setTabHost] = useState<string>("");
  const [tabSummary, setTabSummary] = useState<HostSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const s = (await chrome.runtime.sendMessage({ type: "GET_STATE" })) as ExtensionState;
    setState(s);
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab[0]?.url;
    if (url && /^https?:/i.test(url)) {
      const host = new URL(url).hostname;
      setTabHost(host);
      setTabSummary(s.hostSummaries[host] ?? null);
    } else {
      setTabHost("");
      setTabSummary(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 1500);
    return () => clearInterval(id);
  }, [refresh]);

  const onToggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      await chrome.runtime.sendMessage({ type: "SET_GPC_ENABLED", enabled });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const activity = useMemo(() => (state?.activity ?? []) as ActivityEntry[], [state]);

  if (!state) {
    return (
      <div className="shell">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="brand">
        <img src="icons/icon48.png" alt="" />
        <h1>Privopact</h1>
        <span className="badge">Beta</span>
      </div>

      <div className="content">
      <div className="toggle-row">
        <div>
          <strong>GPC signal</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            Sec-GPC header + navigator flag
          </div>
        </div>
        <label className="switch" title="Toggle Global Privacy Control">
          <input
            type="checkbox"
            checked={state.gpcEnabled}
            disabled={busy}
            onChange={(e) => void onToggle(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Current site</h2>
          <div className="metric host">{tabHost || "—"}</div>
          <div className="sub">
            {tabSummary ? (
              <>
                <span className={`pill ${tabSummary.lastRecognition}`}>
                  {recognitionLabel(tabSummary.lastRecognition)}
                </span>
                <div style={{ marginTop: 8 }} className="score">
                  Privacy score: <b>{scoreLabel(tabSummary.lastScore)}</b>
                </div>
              </>
            ) : (
              <span className="muted">Visit a page to analyze recognition.</span>
            )}
          </div>
        </div>
        <div className="card">
          <h2>Sites reached</h2>
          <div className="metric">{state.protectedHosts.length}</div>
          <div className="sub muted">Unique hosts while GPC was enabled.</div>
        </div>
      </div>

      {tabSummary && (
        <div className={`context-box ${tabSummary.lastScore}`}>
          <div className="context-header">
            <strong>Analysis results</strong>
          </div>
          <p>
            {tabSummary.lastRecognition === "honors" ? (
              <>Site respects GPC signal.</>
            ) : tabSummary.lastRecognition === "partial" ? (
              <>Partial GPC recognition detected.</>
            ) : (
              <>No GPC signal recognition detected.</>
            )}
            {" "}
            {tabSummary.lastScore === "high_risk" || tabSummary.lastScore === "poor" ? (
              <>High tracker density reduces privacy score.</>
            ) : (
              <>Clean tracking and cookie practices observed.</>
            )}
          </p>
        </div>
      )}
      </div>

      <div className="footer">
        <a href={LEAD_URL} target="_blank" rel="noreferrer">
          privopact.com
        </a>
        <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
          Privacy policy
        </a>
      </div>
    </div>
  );
}
