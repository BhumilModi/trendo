// Story photos come from the source article's preview image. Only these hosts are
// allowed, so the Next.js image optimizer can't be used as an open proxy.
export const IMAGE_HOSTS = ["techcrunch.com", "platform.theverge.com", "cdn.arstechnica.net"];

export function allowedImage(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && IMAGE_HOSTS.includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}
