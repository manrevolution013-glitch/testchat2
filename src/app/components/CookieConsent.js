"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent({ config }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    } else if (consent === 'accepted') {
      // Re-apply consent on page load if already accepted
      if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    
    // Grant consent to Google Analytics
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    
    // Deny consent (it's denied by default, but good to be explicit)
    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-content">
        <p>
          {config.message}{' '}
          <Link href={config.privacyLink} className="cookie-link">
            {config.privacyText}
          </Link>
          {config.impressumLink && config.impressumText ? (
            <>
              {' & '}
              <Link href={config.impressumLink} className="cookie-link">
                {config.impressumText}
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <div className="cookie-actions">
        <button onClick={handleDecline} className="cookie-btn decline">
          {config.declineText}
        </button>
        <button onClick={handleAccept} className="cookie-btn accept">
          {config.acceptText}
        </button>
      </div>
    </div>
  );
}
