import ContentPage from '../components/ContentPage';
import ContactForm from '../components/ContactForm';
import { getSiteConfig } from '../../lib/config';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const config = getSiteConfig();
  const slug = params.slug;
  
  // Find page key by slug
  const pageKey = Object.keys(config.pages).find(key => config.pages[key].slug === slug);
  const pageData = config.pages[pageKey];

  if (!pageData) {
      return {};
  }

  return {
    title: `${pageData.title} - ${config.metadata.title}`,
    description: pageData.description,
    alternates: {
        canonical: `/${slug}`,
    }
  };
}

export default function DynamicPage({ params }) {
  const config = getSiteConfig();
  const slug = params.slug;
  
  // Find page key by slug (e.g., 'ueber-uns' -> 'about')
  const pageKey = Object.keys(config.pages).find(key => config.pages[key].slug === slug);
  
  if (!pageKey) {
      notFound();
  }

  let children = null;
  if (pageKey === 'contact') {
      children = <ContactForm />;
  }

  return <ContentPage pageKey={pageKey}>{children}</ContentPage>;
}

export async function generateStaticParams() {
    const config = getSiteConfig();
    return Object.values(config.pages)
        .filter(p => p.slug)
        .map(p => ({ slug: p.slug }));
}

