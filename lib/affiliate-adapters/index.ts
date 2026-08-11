import { ValidationStatus } from "@/types/affiliate-command";

export interface AffiliateNetworkAdapter {
  networkName: string;
  generateLink(baseUrl: string, affiliateId: string, trackingId?: string): string | null;
  validateLink(url: string): Promise<{ status: ValidationStatus; httpCode?: number; destinationUrl?: string }>;
}

export class ManualAdapter implements AffiliateNetworkAdapter {
  networkName = "Manual / Direct";

  generateLink(baseUrl: string): string | null {
    if (!baseUrl || !baseUrl.startsWith("http")) return null;
    return baseUrl.trim();
  }

  async validateLink(url: string): Promise<{ status: ValidationStatus; httpCode?: number; destinationUrl?: string }> {
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return { status: "INVALID" };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Vault-Validator/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (res.status >= 200 && res.status < 400) {
        return { status: "VALID", httpCode: res.status, destinationUrl: res.url };
      } else if (res.status === 403 || res.status === 401) {
        return { status: "BLOCKED", httpCode: res.status };
      } else {
        return { status: "INVALID", httpCode: res.status };
      }
    } catch {
      return { status: "TIMEOUT" };
    }
  }
}

export class TemplateAdapter implements AffiliateNetworkAdapter {
  networkName: string;
  private templatePattern: string;

  constructor(networkName: string, templatePattern: string) {
    this.networkName = networkName;
    this.templatePattern = templatePattern;
  }

  generateLink(baseUrl: string, affiliateId: string, trackingId: string = "aivault"): string | null {
    if (!affiliateId) return null;
    return this.templatePattern
      .replace("{BASE_URL}", encodeURIComponent(baseUrl))
      .replace("{AFFILIATE_ID}", affiliateId)
      .replace("{TRACKING_ID}", trackingId);
  }

  async validateLink(url: string): Promise<{ status: ValidationStatus; httpCode?: number; destinationUrl?: string }> {
    const manual = new ManualAdapter();
    return manual.validateLink(url);
  }
}

export const SUPPORTED_NETWORKS: Record<string, AffiliateNetworkAdapter> = {
  Direct: new ManualAdapter(),
  Impact: new TemplateAdapter("Impact", "https://impact.com/c/{AFFILIATE_ID}/aivault?u={BASE_URL}"),
  ShareASale: new TemplateAdapter("ShareASale", "https://www.shareasale.com/r.cfm?b=12345&u={AFFILIATE_ID}&m=67890&urllink={BASE_URL}"),
  PartnerStack: new TemplateAdapter("PartnerStack", "{BASE_URL}?ps_partner={AFFILIATE_ID}&ps_xid={TRACKING_ID}"),
};
