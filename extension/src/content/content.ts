// Content script for Rfrnce extension
// Injects floating button on whitelisted retail sites

import { isWhitelistedDomain, isProductPage } from '../shared/whitelist';
import type { Cart } from '../shared/types';

console.log('Rfrnce content script loaded');

// Detection state
let isWhitelisted = false;
let isProduct = false;

// Store button reference so we can update it when URL changes
let overlayButton: HTMLButtonElement | null = null;

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

  // Create button element (or reuse existing if already injected)
  let button: HTMLButtonElement;

  if (overlayButton) {
    // Button already exists, just update its state
    button = overlayButton;
    button.disabled = !isProduct;
    console.log(`[Rfrnce] Overlay button state updated (enabled: ${isProduct})`);
    return; // Don't re-inject
  }

  // Create new button
  button = document.createElement('button');
  button.className = 'overlay-button';
  button.textContent = 'Add to Rfrnce';

  // Set initial state based on product page detection
  button.disabled = !isProduct;

  // Store button reference
  overlayButton = button;

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
        showToast(`Added to ${cartName}`, 'success', {
          cartId: response.data.cartId,
          productId: response.data.productId,
        });
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
function showToast(
  message: string,
  type: 'success' | 'error' = 'success',
  options?: { cartId?: number; productId?: number }
) {
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
      --radius-sm: 4px;
      --radius-md: 6px;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 12px;
      --font-size-sm: 12px;
      --font-weight-normal: 400;
      --font-weight-medium: 500;
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

    .toast-dropdown {
      margin-top: var(--spacing-sm);
      background: #1a1a1a;
      border-radius: var(--radius-md);
      padding: var(--spacing-sm);
      max-height: 200px;
      overflow-y: auto;
    }

    .cart-option {
      padding: var(--spacing-sm);
      cursor: pointer;
      border-radius: var(--radius-sm);
    }

    .cart-option:hover {
      background: #3d3d3d;
    }

    .cart-option-name {
      font-weight: var(--font-weight-medium);
    }

    .cart-option-count {
      font-size: 11px;
      color: #a0a0a0;
      margin-left: var(--spacing-xs);
    }
  `;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const messageEl = document.createElement('p');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;

  toast.appendChild(messageEl);

  // Track change link for timeout cancellation
  let changeLink: HTMLAnchorElement | null = null;
  let dismissTimeout: number | null = null;

  // Add "Change" link for success toasts with cart data
  if (type === 'success' && options?.cartId && options?.productId) {
    changeLink = document.createElement('a');
    changeLink.className = 'toast-link';
    changeLink.textContent = 'Change';
    changeLink.href = '#';

    // Container for dropdown
    const dropdownContainer = document.createElement('div');
    let dropdownVisible = false;

    changeLink.addEventListener('click', async (e) => {
      e.preventDefault();

      if (dropdownVisible) {
        // Hide dropdown
        dropdownContainer.innerHTML = '';
        dropdownContainer.style.display = 'none';
        dropdownVisible = false;
        return;
      }

      // Cancel auto-dismiss when dropdown is opened
      if (dismissTimeout) {
        clearTimeout(dismissTimeout);
        dismissTimeout = null;
        console.log('[Rfrnce] Auto-dismiss cancelled - dropdown open');
      }

      // Show loading
      dropdownContainer.innerHTML = '<div style="padding: 8px; color: #a0a0a0;">Loading carts...</div>';
      dropdownContainer.style.display = 'block';
      dropdownVisible = true;

      // Fetch all carts via background worker
      const cartsResponse = await chrome.runtime.sendMessage({ type: 'GET_CARTS' });

      if (!cartsResponse.success || cartsResponse.data.length === 0) {
        dropdownContainer.innerHTML = '<div style="padding: 8px; color: #c0392b;">No other carts available</div>';
        return;
      }

      // Filter out current cart
      const otherCarts = cartsResponse.data.filter((c: Cart) => c.id !== options.cartId);

      if (otherCarts.length === 0) {
        dropdownContainer.innerHTML = '<div style="padding: 8px; color: #a0a0a0;">No other carts available</div>';
        return;
      }

      // Build dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'toast-dropdown';

      otherCarts.forEach((cart: Cart) => {
        const option = document.createElement('div');
        option.className = 'cart-option';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cart-option-name';
        nameSpan.textContent = cart.name;

        const countSpan = document.createElement('span');
        countSpan.className = 'cart-option-count';
        countSpan.textContent = `(${cart.productCount} items)`;

        option.appendChild(nameSpan);
        option.appendChild(countSpan);

        // Click handler to move product
        option.addEventListener('click', async () => {
          // Show moving state
          messageEl.textContent = 'Moving...';
          dropdownContainer.innerHTML = '';
          dropdownContainer.style.display = 'none';
          dropdownVisible = false;

          // Call move API via background worker
          const moveResponse = await chrome.runtime.sendMessage({
            type: 'MOVE_PRODUCT',
            payload: {
              cartId: options.cartId,
              productId: options.productId,
              targetCartId: cart.id,
            },
          });

          if (moveResponse.success) {
            messageEl.textContent = `✓ Moved to ${cart.name}`;
            console.log(`[Rfrnce] Product moved to cart: ${cart.name}`);

            // Dismiss after showing success message for 2 seconds
            setTimeout(() => {
              host.remove();
              document.removeEventListener('click', handleClickOutside);
              console.log('[Rfrnce] Toast dismissed after successful move');
            }, 2000);
          } else {
            messageEl.textContent = moveResponse.error?.message || 'Failed to move product';
            toast.className = 'toast error';
            console.error('[Rfrnce] Failed to move product:', moveResponse.error);

            // Dismiss error after 3 seconds
            setTimeout(() => {
              host.remove();
              document.removeEventListener('click', handleClickOutside);
            }, 3000);
          }
        });

        dropdown.appendChild(option);
      });

      dropdownContainer.innerHTML = '';
      dropdownContainer.appendChild(dropdown);
    });

    messageEl.appendChild(changeLink);
    toast.appendChild(dropdownContainer);
  }

  // Append styles and toast to shadow root
  shadow.appendChild(styles);
  shadow.appendChild(toast);

  // Append host to page body
  document.body.appendChild(host);

  console.log(`[Rfrnce] Toast shown: ${message}`);

  // Dismiss when clicking outside the toast
  const handleClickOutside = (e: MouseEvent) => {
    if (!host.contains(e.target as Node)) {
      host.remove();
      document.removeEventListener('click', handleClickOutside);
      if (dismissTimeout) clearTimeout(dismissTimeout);
      console.log('[Rfrnce] Toast dismissed - clicked outside');
    }
  };

  // Add listener after a brief delay to avoid immediate dismissal
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 100);

  // Auto-dismiss after 3 seconds (will be cancelled if Change link is clicked)
  dismissTimeout = setTimeout(() => {
    host.remove();
    document.removeEventListener('click', handleClickOutside);
    console.log('[Rfrnce] Toast dismissed - auto timeout');
  }, 3000);
}

/**
 * Initialize the extension on the page
 */
function initExtension() {
  detectPage();

  // Inject overlay button if on whitelisted domain
  if (isWhitelisted) {
    injectOverlayButton();
  }
}

/**
 * Listen for URL changes (for single-page applications)
 * This handles both pushState/replaceState and popstate events
 */
function observeUrlChanges() {
  let lastUrl = window.location.href;

  // Detect URL changes via pushState/replaceState (client-side navigation)
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('[Rfrnce] URL changed via client-side navigation:', currentUrl);

      // Re-run detection and update button state
      detectPage();
      if (isWhitelisted && overlayButton) {
        // Update existing button state
        overlayButton.disabled = !isProduct;
        console.log(`[Rfrnce] Button state updated after URL change (enabled: ${isProduct})`);
      } else if (isWhitelisted && !overlayButton) {
        // Inject button if not already present
        injectOverlayButton();
      }
    }
  });

  // Observe changes to the page (URL bar changes are reflected in document)
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
  });

  // Also listen for popstate (browser back/forward)
  window.addEventListener('popstate', () => {
    console.log('[Rfrnce] URL changed via popstate (back/forward)');
    detectPage();
    if (isWhitelisted && overlayButton) {
      overlayButton.disabled = !isProduct;
      console.log(`[Rfrnce] Button state updated after popstate (enabled: ${isProduct})`);
    }
  });
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initExtension();
    observeUrlChanges();
  });
} else {
  // DOM already loaded
  initExtension();
  observeUrlChanges();
}
