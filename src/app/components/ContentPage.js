import Header from './Header';
import { getSiteConfig } from '../../lib/config';

export default function ContentPage({ pageKey, children, lang }) {
  const config = getSiteConfig();
  // Here we could implement language switching logic if config had multi-lang support
  // e.g. const pageData = config.pages[lang]?.[pageKey] || config.pages[pageKey];
  const pageData = config.pages[pageKey];

  if (!pageData) {
    return (
        <div className="homepage">
            <Header />
            <div className="container" style={{padding: '4rem 2rem', textAlign: 'center'}}>
                <h1>404 - Page Not Found</h1>
            </div>
        </div>
    );
  }

  return (
    <div className="homepage">
      <Header />
      
      <main className="content-section" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            {pageData.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '800px' }}>
            {pageData.description}
          </p>

          {children && (
            <div style={{ marginBottom: '3rem' }}>
              {children}
            </div>
          )}

          <div className="page-content">
            {pageData.content.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>
                  {section.heading}
                </h2>
                <p style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
                  {section.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-links">
              {config.footer.links.map((link, idx) => (
                <a href={link.href} key={idx}>{link.label}</a>
              ))}
            </div>
            <div className="footer-copy">
              &copy; {new Date().getFullYear()} {config.footer.copyright}
            </div>
            <div className="footer-disclaimer">
              {config.footer.disclaimer}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

