import Header from './components/Header';
import LoginForm from './components/LoginForm';
import * as Icons from 'lucide-react';
import { getSiteConfig } from '../lib/config';

// Helper to dynamically render Lucide icons based on string name
const DynamicIcon = ({ name, ...props }) => {
  const Icon = Icons[name];
  return Icon ? <Icon {...props} /> : null;
};

export default function Home() {
  const config = getSiteConfig();

  return (
    <div className="homepage">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>{config.hero.title}</h1>
            <p className="hero-subtitle">
              {config.hero.subtitle}
            </p>
            <div className="hero-features">
              {config.hero.features.map((feature, idx) => (
                <div className="feature-item" key={idx}>
                  <DynamicIcon name={feature.icon} size={20} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-login">
            <LoginForm />
          </div>
        </section>

        {/* Stories / Content Section */}
        <section className="content-section">
          <div className="container">
            <h2>{config.stories.title}</h2>
            <div className="stories-grid">
              {config.stories.items.map((story, idx) => (
                <article className="story-card" key={idx}>
                  <h3>{story.title}</h3>
                  <p>{story.content}</p>
                  <span className="story-author">{story.author}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Safety & EEAT Section */}
        <section className="safety-section">
          <div className="container">
            <h2>{config.safety.title}</h2>
            <div className="safety-grid">
              {config.safety.items.map((item, idx) => (
                <div className="safety-item" key={idx}>
                  <DynamicIcon name={item.icon} size={32} className="safety-icon" />
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
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
