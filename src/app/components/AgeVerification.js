'use client';

import { useState, useEffect } from 'react';
import config from '../../config';

export default function AgeVerification() {
  const [isVisible, setIsVisible] = useState(false);
  const { ageVerification } = config;

  useEffect(() => {
    // Check if user has already verified their age in this session
    const isVerified = sessionStorage.getItem('ageVerified');
    if (!isVerified) {
      setIsVisible(true);
      // Prevent scrolling while modal is open
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleYes = () => {
    sessionStorage.setItem('ageVerified', 'true');
    setIsVisible(false);
    document.body.style.overflow = 'unset';
  };

  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="age-verification-overlay">
      <div className="age-verification-box">
        <div className="age-icon">🔞</div>
        <h2>{ageVerification.title}</h2>
        <p>
          {ageVerification.text}
        </p>
        <div className="age-actions">
          <button onClick={handleNo} className="age-btn no">
            {ageVerification.noButton}
          </button>
          <button onClick={handleYes} className="age-btn yes">
            {ageVerification.yesButton}
          </button>
        </div>
      </div>
    </div>
  );
}
