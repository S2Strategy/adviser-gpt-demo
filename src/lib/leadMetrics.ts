export interface LeadPayload {
  fullName: string;
  email: string;
  companyName: string;
}

const LEAD_POSTED_KEY = "demo-tour-lead-posted";

function getLeadEndpoint(): string {
  const configuredBase = import.meta.env.VITE_METRICS_API_BASE_URL?.trim();
  const base = configuredBase ? configuredBase.replace(/\/$/, "") : "";
  return `${base}/api/metrics/lead`;
}

function getLeadApiKey(): string | null {
  const key = import.meta.env.VITE_METRICS_API_KEY?.trim();
  return key ? key : null;
}

export function hasPostedLead(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LEAD_POSTED_KEY) === "true";
}

export async function postLeadMetric(payload: LeadPayload): Promise<boolean> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = getLeadApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  try {
    const response = await fetch(getLeadEndpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) return false;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LEAD_POSTED_KEY, "true");
    }
    return true;
  } catch {
    return false;
  }
}
