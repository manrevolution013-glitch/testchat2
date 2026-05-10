import config from '../config';

function normalizeBaseUrl(url) {
  if (!url) return '';
  const u = String(url).trim().replace(/\/+$/, '');
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/**
 * Canonical origin for SEO (sitemap, robots). Never uses VERCEL_URL — use each site JSON `domain`.
 * Order: domain → NEXT_PUBLIC_SITE_URL → metadata.siteUrl → header.logoText
 */
export function getSiteBaseUrl(cfg = config) {
  const fromDomain = cfg?.domain;
  if (fromDomain) return normalizeBaseUrl(fromDomain);

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  const fromJson = cfg?.metadata?.siteUrl;
  if (fromJson) return normalizeBaseUrl(fromJson);

  const host = cfg?.header?.logoText;
  if (host) return normalizeBaseUrl(host);

  return '';
}

/** URL paths that are German-style Impressum / Imprint (not used outside .de). */
const IMPRINT_PATHS = new Set(['/impressum', '/imprint', '/impresum']);

/** Slugs for pages.impressum that should only exist on .de sites. */
const IMPRINT_SLUGS = new Set(['impressum', 'imprint', 'impresum']);

function cloneConfig(raw) {
  return typeof structuredClone === 'function'
    ? structuredClone(raw)
    : JSON.parse(JSON.stringify(raw));
}

function siteHostIsDe(cfg) {
  const base = getSiteBaseUrl(cfg);
  let host = '';
  try {
    if (base) host = new URL(base).hostname.toLowerCase();
  } catch {
    /* ignore */
  }
  if (!host && cfg?.header?.logoText) {
    host = String(cfg.header.logoText)
      .toLowerCase()
      .replace(/^www\./, '');
  }
  return host.endsWith('.de');
}

function stripImpressumOutsideDe(raw) {
  if (siteHostIsDe(raw)) {
    return raw;
  }
  const out = cloneConfig(raw);

  const imp = out.pages?.impressum;
  if (imp?.slug && IMPRINT_SLUGS.has(String(imp.slug).toLowerCase())) {
    delete out.pages.impressum;
  }

  if (Array.isArray(out.footer?.links)) {
    out.footer.links = out.footer.links.filter((l) => {
      const path = String(l.href || '')
        .toLowerCase()
        .split('?')[0];
      return !IMPRINT_PATHS.has(path);
    });
  }

  const cc = out.cookieConsent;
  if (cc) {
    const path = String(cc.impressumLink || '')
      .toLowerCase()
      .split('?')[0];
    if (IMPRINT_PATHS.has(path)) {
      delete cc.impressumText;
      delete cc.impressumLink;
    }
  }

  return out;
}

/**
 * Site JSON with runtime rules: Impressum/Imprint pages and links exist only for .de hosts.
 */
export function getSiteConfig() {
  return stripImpressumOutsideDe(config);
}
