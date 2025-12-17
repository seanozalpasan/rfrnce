import React, { useState, useEffect } from 'react';

function ReportPage() {
  const [mode, setMode] = useState<'generate' | 'view' | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read mode and cartId from URL parameters
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const cartIdParam = params.get('cartId');

    if (!modeParam || !cartIdParam) {
      setError('Invalid report URL. Missing mode or cartId parameter.');
      setLoading(false);
      return;
    }

    if (modeParam !== 'generate' && modeParam !== 'view') {
      setError('Invalid mode. Expected "generate" or "view".');
      setLoading(false);
      return;
    }

    setMode(modeParam as 'generate' | 'view');
    setCartId(cartIdParam);
    setLoading(false);
  }, []);

  // Close the tab and return to extension
  const handleClose = () => {
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id) {
        chrome.tabs.remove(tab.id);
      }
    });
  };

  if (loading) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>Rfrnce</h1>
        </div>
        <div className="report-content">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>Rfrnce</h1>
        </div>
        <div className="report-content">
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="btn btn-primary" onClick={handleClose}>
              Close Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Rfrnce</h1>
        <button className="btn-close" onClick={handleClose}>
          Close Tab
        </button>
      </div>
      <div className="report-content">
        {mode === 'generate' ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating your report, please wait...</p>
            <p className="loading-subtext">This may take up to 30 seconds</p>
          </div>
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading report...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportPage;
