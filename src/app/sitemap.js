import { getSiteConfig } from '../lib/config';

export default function sitemap() {
  const config = getSiteConfig();
  const baseUrl = 'https://' + config.header.logoText;
  
  const pages = Object.values(config.pages)
    .filter(p => p.slug)
    .map(p => `/${p.slug}`);

  const routes = [
    '',
    ...pages
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}

