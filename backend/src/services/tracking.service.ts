import { env } from "../config/env";

/**
 * Injects a 1x1 transparent pixel at the end of the HTML email body.
 */
export function injectOpenTrackingPixel(html: string, eventId: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const pixelUrl = `${appUrl}/api/track/open?e=${eventId}`;
  const pixelTag = `\n<img src="${pixelUrl}" width="1" height="1" alt="" style="display: none; width: 1px; height: 1px;" />`;
  
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}</body>`);
  }
  return html + pixelTag;
}

/**
 * Parses anchor tags inside the email HTML and rewrites external link hrefs 
 * to pass through our redirection and tracking routes.
 */
export function rewriteLinksForTracking(html: string, eventId: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  
  // Regex to match http/https urls inside href quotes
  const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  
  return html.replace(hrefRegex, (match, url) => {
    // Avoid tracking local app routing links
    if (url.startsWith(appUrl)) {
      return match;
    }
    
    // Encode to base64 to prevent URL parsing errors
    const b64Url = Buffer.from(url).toString("base64url");
    const trackingUrl = `${appUrl}/api/track/click?e=${eventId}&u=${b64Url}`;
    
    return `href="${trackingUrl}"`;
  });
}

/**
 * Appends a tenant-scoped unsubscribe link at the bottom of the email HTML.
 */
export function injectUnsubscribeLink(html: string, leadId: string, companyId: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const unsubUrl = `${appUrl}/api/track/unsubscribe?l=${leadId}&c=${companyId}`;
  
  const unsubSection = `
    <div style="margin-top: 32px; padding-top: 16px; border-t: 1px solid #e4e4e7; font-family: sans-serif; font-size: 11px; color: #71717a; text-align: center;">
      If you no longer wish to receive these outreach emails, please 
      <a href="${unsubUrl}" style="color: #6366f1; text-decoration: underline;">unsubscribe here</a>.
    </div>
  `;
  
  if (html.includes("</body>")) {
    return html.replace("</body>", `${unsubSection}</body>`);
  }
  return html + unsubSection;
}
