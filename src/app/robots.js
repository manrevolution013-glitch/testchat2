import { getSiteBaseUrl, getSiteConfig } from '../lib/config';

export default function robots() {
  const config = getSiteConfig();
  const baseUrl = getSiteBaseUrl(config);

  const out = {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/private/', '/admin/'],
      },
    ],
  };
  if (baseUrl) {
    out.sitemap = `${baseUrl}/sitemap.xml`;
  }
  return out;
}
