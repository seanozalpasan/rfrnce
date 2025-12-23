import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';
import { generateReport, getReport } from '../shared/api';
import FrozenCartDialog from './FrozenCartDialog';

function ReportPage() {
  const [mode, setMode] = useState<'generate' | 'view' | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showFrozenDialog, setShowFrozenDialog] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

    // Fetch the report
    fetchReport(modeParam as 'generate' | 'view', cartIdParam);
  }, []);

  const fetchReport = async (fetchMode: 'generate' | 'view', fetchCartId: string) => {
    setLoading(true);
    setError(null);

    try {
      const cartIdNum = parseInt(fetchCartId, 10);

      if (isNaN(cartIdNum)) {
        setError('Invalid cart ID.');
        setLoading(false);
        return;
      }

      let response;

      if (fetchMode === 'generate') {
        // Generate a new report
        response = await generateReport(cartIdNum);
      } else {
        // Fetch existing report
        response = await getReport(cartIdNum);
      }

      if (response.success) {
        // Sanitize the HTML content before rendering
        const sanitizedContent = DOMPurify.sanitize(response.data.content, {
          ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
          ALLOWED_ATTR: ['class', 'id'],
        });

        setReportContent(sanitizedContent);

        // Set timestamp if available (only for view mode)
        if ('generatedAt' in response.data) {
          setReportGeneratedAt(response.data.generatedAt);
        }

        // Check if cart is now frozen (only for generate mode)
        if (fetchMode === 'generate' && 'isFrozen' in response.data && response.data.isFrozen) {
          setShowFrozenDialog(true);
        }
      } else {
        // Handle API errors with user-friendly messages
        setError(response.error.message);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close the tab and return to extension
  const handleClose = () => {
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id) {
        chrome.tabs.remove(tab.id);
      }
    });
  };

  // Retry generating the report
  const handleRetry = () => {
    if (mode && cartId) {
      fetchReport(mode, cartId);
    }
  };

  // Download report as PDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setDownloadingPdf(true);

    try {
      const options = {
        margin: 0.5,
        filename: `rfrnce-report-${cartId}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      await html2pdf().set(options).from(reportRef.current).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle keeping frozen cart
  const handleKeepFrozenCart = () => {
    setShowFrozenDialog(false);
  };

  // Handle deleting frozen cart
  const handleDeleteFrozenCart = () => {
    // Close the report tab
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id) {
        chrome.tabs.remove(tab.id);
      }
    });
  };

  // Show initial loading while parsing URL
  if (loading && !mode) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>rfrnce</h1>
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

  // Show error state
  if (error && !loading) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>rfrnce</h1>
          <button className="btn-close" onClick={handleClose}>
            Close Tab
          </button>
        </div>
        <div className="report-content">
          <div className="error-state">
            <p className="error-message">{error}</p>
            <div className="error-actions">
              {mode && cartId && (
                <button className="btn btn-primary" onClick={handleRetry}>
                  Retry
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleClose}>
                Close Tab
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching report
  if (loading) {
    return (
      <div className="report-container">
        <div className="report-header">
          <h1>rfrnce</h1>
        </div>
        <div className="report-content">
          <div className="loading-state">
            <div className="spinner"></div>
            {mode === 'generate' ? (
              <>
                <p>Generating your report, please wait...</p>
                <p className="loading-subtext">This may take up to 30 seconds</p>
              </>
            ) : (
              <p>Loading report...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show report content
  return (
    <>
      <div className="report-container">
        <div className="report-header">
          <h1>rfrnce</h1>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button className="btn-close" onClick={handleClose}>
              Close Tab
            </button>
          </div>
        </div>
        <div className="report-content">
          {reportGeneratedAt && (
            <p className="report-timestamp">
              Generated on {new Date(reportGeneratedAt).toLocaleString()}
            </p>
          )}
          <div
            ref={reportRef}
            className="report-display"
            dangerouslySetInnerHTML={{ __html: reportContent || '' }}
          />
        </div>
      </div>

      {/* Frozen Cart Dialog */}
      {showFrozenDialog && cartId && (
        <FrozenCartDialog
          cartId={parseInt(cartId, 10)}
          onKeep={handleKeepFrozenCart}
          onDeleted={handleDeleteFrozenCart}
        />
      )}
    </>
  );
}

export default ReportPage;
