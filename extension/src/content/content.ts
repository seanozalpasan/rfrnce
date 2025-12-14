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

  // Append styles and button to shadow root
  shadow.appendChild(styles);
  shadow.appendChild(button);

  // Append host to page body
  document.body.appendChild(host);

  console.log(`[Rfrnce] Overlay button injected (enabled: ${isProduct})`);

  // TODO: Add click handler (Task 4.5)
}

// Run detection on page load
detectPage();

// Inject overlay button if on whitelisted domain
if (isWhitelisted) {
  injectOverlayButton();
}
