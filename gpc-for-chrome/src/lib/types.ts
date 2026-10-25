export type GpcRecognition = "honors" | "partial" | "none" | "unknown";

export type PrivacyScoreBand = "excellent" | "good" | "moderate" | "poor" | "high_risk";

export type SiteScanPayload = {
  url: string;
  host: string;
  title: string;
  textSample: string;
  hrefSample: string;
  scriptHosts: string[];
  cookieCountEstimate: number;
  hasPrivacyPolicyLink: boolean;
  wellKnownGpc: boolean | null;
  timestamp: number;
};

export type ActivityEntry = {
  id: string;
  timestamp: number;
  host: string;
  url: string;
  recognition: GpcRecognition;
  score: PrivacyScoreBand;
};

export type HostSummary = {
  host: string;
  lastRecognition: GpcRecognition;
  lastScore: PrivacyScoreBand;
  lastSeen: number;
  lastUrl: string;
};

export type ExtensionState = {
  gpcEnabled: boolean;
  protectedHosts: string[];
  activity: ActivityEntry[];
  hostSummaries: Record<string, HostSummary>;
};
