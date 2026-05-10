import "./globals.css";
import { getSiteConfig } from "../lib/config";
import CookieConsent from "./components/CookieConsent";
import GoogleAnalytics from "./components/GoogleAnalytics";
import AgeVerification from "./components/AgeVerification";

export async function generateMetadata() {
  const config = getSiteConfig();
  const faviconPath = config.assets?.faviconPath || '/favicons/cuckoldchat';
  
  return {
    title: config.metadata.title,
    description: config.metadata.description,
    keywords: config.metadata.keywords,
    openGraph: config.metadata.openGraph,
    icons: {
      icon: `${faviconPath}/favicon.ico`,
    },
  };
}

export default function RootLayout({ children, params }) {
  const config = getSiteConfig();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Derive lang from config locale or default
  const lang = config.metadata.openGraph.locale ? config.metadata.openGraph.locale.split('_')[0] : 'en';

  const heroBg = config.assets?.heroBackground ? `url('${config.assets.heroBackground}')` : 'none';
  const chatBg = config.assets?.chatBackground ? `url('${config.assets.chatBackground}')` : 'none';
  const chatBgRepeat = config.assets?.chatBackgroundRepeat || 'repeat';
  const chatBgSize = config.assets?.chatBackgroundSize || '400px';

  return (
    <html lang={lang}>
      <body style={{ 
        '--hero-bg-image': heroBg, 
        '--chat-bg-image': chatBg,
        '--chat-bg-repeat': chatBgRepeat,
        '--chat-bg-size': chatBgSize
      }}>
        {gaId && <GoogleAnalytics GA_MEASUREMENT_ID={gaId} />}
        <AgeVerification />
        {children}
        <CookieConsent config={config.cookieConsent} />
      </body>
    </html>
  );
}
