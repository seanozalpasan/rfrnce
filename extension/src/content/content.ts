// Content script for Rfrnce extension
// Injects floating button on whitelisted retail sites

import { isWhitelistedDomain, isProductPage } from '../shared/whitelist';

console.log('Rfrnce content script loaded');

// Detection state
let isWhitelisted = false;
let isProduct = false;

/**
 * Detect if current page is on a whitelisted domain and if it's a product page
 */
function detectPage() {
  const { hostname, pathname, search } = window.location;

  // Check if domain is whitelisted
  isWhitelisted = isWhitelistedDomain(hostname);

  // Check if URL matches product page pattern (only if whitelisted)
  if (isWhitelisted) {
    isProduct = isProductPage(hostname, pathname, search);
  }

  // Log detection results
  console.log(
    `[Rfrnce] Domain whitelisted: ${isWhitelisted}, Product page: ${isProduct}`
  );

  return { isWhitelisted, isProduct };
}

/**
 * Create and inject the floating overlay button using Shadow DOM for CSS isolation
 */
function injectOverlayButton() {
  // Create host element for Shadow DOM
  const host = document.createElement('div');
  host.id = 'rfrnce-overlay';

  // Attach Shadow DOM (closed mode to prevent external access)
  const shadow = host.attachShadow({ mode: 'closed' });

  // Create style element with all button styles
  const styles = document.createElement('style');
  styles.textContent = `
    /* CSS Variables */
    :host {
      --color-overlay-button: #4a4a4a;
      --color-overlay-button-hover: #5a5a5a;
      --color-overlay-button-disabled: #3a3a3a;
      --color-text-primary: #e0e0e0;
      --color-text-disabled: #666666;
      --radius-md: 6px;
      --spacing-sm: 8px;
      --spacing-md: 12px;
      --font-size-sm: 12px;
      --font-weight-medium: 500;
    }

    /* Overlay Button Styles */
    .overlay-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: var(--color-overlay-button);
      color: var(--color-text-primary);
      border: none;
      border-radius: var(--radius-md);
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: background 0.2s ease;
    }

    .overlay-button:hover:not(:disabled) {
      background: var(--color-overlay-button-hover);
    }

    .overlay-button:disabled {
      background: var(--color-overlay-button-disabled);
      color: var(--color-text-disabled);
      cursor: not-allowed;
      opacity: 0.6;
    }
  `;

  // Create button element
  const button = document.createElement('button');
  button.className = 'overlay-button';
  button.textContent = 'Add to Rfrnce';

  // Set initial state based on product page detection
  button.disabled = !isProduct;

  // Add click handler
  button.addEventListener('click', async () => {
    if (!isProduct) return; // Safety check

    // Show loading state
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
      // Get current page URL
      const url = window.location.href;

      console.log(`[Rfrnce] Sending ADD_PRODUCT message with URL: ${url}`);

      // Send message to background worker
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_PRODUCT',
        payload: { url }
      });

      console.log('[Rfrnce] Response from background worker:', response);

      // Reset button state
      button.textContent = originalText;
      button.disabled = false;

      // Show toast notification
      if (response.success) {
        const cartName = response.data.cartName || 'your cart';
        showToast(`Added to ${cartName}`);
      } else {
        // Show error message from API
        const errorMessage = response.error?.message || 'Failed to add product';
        showToast(errorMessage, 'error');
      }

    } catch (error) {
      console.error('[Rfrnce] Error adding product:', error);
      button.textContent = 'Error';

      // Show error toast
      showToast('Something went wrong. Please try again.', 'error');

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  });

  // Append styles and button to shadow root
  shadow.appendChild(styles);
  shadow.appendChild(button);

  // Append host to page body
  document.body.appendChild(host);

  console.log(`[Rfrnce] Overlay button injected (enabled: ${isProduct})`);
}

/**
 * Show a toast notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Create host element for Shadow DOM
  const host = document.createElement('div');
  host.id = 'rfrnce-toast';

  // Attach Shadow DOM
  const shadow = host.attachShadow({ mode: 'closed' });

  // Create style element
  const styles = document.createElement('style');
  styles.textContent = `
    /* CSS Variables */
    :host {
      --color-bg-secondary: #2d2d2d;
      --color-text-primary: #e0e0e0;
      --color-status-success: #27ae60;
      --color-status-error: #c0392b;
      --color-accent-secondary: #4a90a4;
      --radius-md: 6px;
      --spacing-sm: 8px;
      --spacing-md: 12px;
      --font-size-sm: 12px;
      --font-weight-normal: 400;
    }

    /* Toast Container */
    .toast {
      position: fixed;
      bottom: 80px; /* Above the "Add to Rfrnce" button */
      right: 20px;
      z-index: 999998; /* Below button but above page content */
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      min-width: 200px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast.success {
      border-left: 3px solid var(--color-status-success);
    }

    .toast.error {
      border-left: 3px solid var(--color-status-error);
    }

    .toast-message {
      margin: 0;
    }

    .toast-link {
      color: var(--color-accent-secondary);
      text-decoration: none;
      cursor: pointer;
      margin-left: var(--spacing-sm);
    }

    .toast-link:hover {
      text-decoration: underline;
    }
  `;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const messageEl = document.createElement('p');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;

  toast.appendChild(messageEl);

  // Append styles and toast to shadow root
  shadow.appendChild(styles);
  shadow.appendChild(toast);

  // Append host to page body
  document.body.appendChild(host);

  console.log(`[Rfrnce] Toast shown: ${message}`);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    host.remove();
    console.log('[Rfrnce] Toast dismissed');
  }, 3000);
}

// Run detection on page load
detectPage();

// Inject overlay button if on whitelisted domain
if (isWhitelisted) {
  injectOverlayButton();
}
