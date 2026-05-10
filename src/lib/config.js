import config from '../config';

export function getSiteConfig() {
  return config;
}

function normalizeBaseUrl(url) {
  if (!url) return '';
  const u = String(url).trim().replace(/\/+$/, '');
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/**
 * Canonical origin for SEO (sitemap, robots, absolute URLs).
 * Order: NEXT_PUBLIC_SITE_URL → metadata.siteUrl in site JSON → VERCEL_URL → header.logoText
 */
export function getSiteBaseUrl(cfg = config) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  const fromJson = cfg?.metadata?.siteUrl;
  if (fromJson) return normalizeBaseUrl(fromJson);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return normalizeBaseUrl(`https://${vercel}`);

  const host = cfg?.header?.logoText;
  if (host) return normalizeBaseUrl(host);

  return '';
}
