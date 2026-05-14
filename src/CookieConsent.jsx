import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptConsent = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowBanner(false);
  };

  const declineConsent = () => {
    localStorage.setItem("cookieConsent", "declined");
    // Clear any existing chat history if they decline
    localStorage.removeItem("chatHistory");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <span className="cookie-icon">🍪</span>
        <div className="cookie-text">
          <strong>Privacy & Chat History</strong>
          <p>We use local storage to save your AI Chat history so you can pick up right where you left off. Do you accept?</p>
        </div>
      </div>
      <div className="cookie-actions">
        <button className="button secondary" onClick={declineConsent}>Decline</button>
        <button className="button primary" onClick={acceptConsent}>Accept</button>
      </div>
    </div>
  );
}
