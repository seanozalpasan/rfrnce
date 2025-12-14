// Background service worker for Rfrnce extension
import { getOrCreateUserUuid } from '../shared/storage';
import { initUser } from '../shared/api';

console.log('Rfrnce background service worker loaded');

// Install event - generate UUID on first install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Rfrnce extension installed');

  // Generate or retrieve UUID
  const uuid = await getOrCreateUserUuid();
  console.log('User UUID:', uuid);

  // Initialize user in backend
  const response = await initUser(uuid);

  if (response.success) {
    console.log('✅ User initialized successfully:', response.data);
  } else {
    console.error('❌ Failed to initialize user:', response.error);
  }
});

// Startup event - verify UUID exists on every startup
chrome.runtime.onStartup.addListener(async () => {
  const uuid = await getOrCreateUserUuid();
  console.log('Extension started, User UUID:', uuid);

  // Re-initialize user on startup (idempotent - returns existing user)
  const response = await initUser(uuid);

  if (response.success) {
    console.log('✅ User verified:', response.data);
  } else {
    console.error('❌ Failed to verify user:', response.error);
  }
});

// Message listener - handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message);

  // Handle ADD_PRODUCT message
  if (message.type === 'ADD_PRODUCT') {
    handleAddProduct(message.payload.url)
      .then(sendResponse)
      .catch((error) => {
        console.error('[Background] Error handling ADD_PRODUCT:', error);
        sendResponse({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Something went wrong. Please try again in a few minutes.',
          },
        });
      });
    return true; // Required for async response
  }

  // Unknown message type
  console.warn('[Background] Unknown message type:', message.type);
  sendResponse({
    success: false,
    error: {
      code: 'UNKNOWN_MESSAGE_TYPE',
      message: 'Unknown message type',
    },
  });
  return true;
});

/**
 * Handle adding a product to the active cart
 * For now, just logs the URL - full implementation in Task 4.6
 */
async function handleAddProduct(url: string) {
  console.log(`[Background] ADD_PRODUCT called with URL: ${url}`);

  // TODO (Task 4.6): Get active cart from storage
  // TODO (Task 4.6): Call POST /api/carts/:id/products
  // TODO (Task 4.6): If no carts exist, create default cart first
  // TODO (Task 4.6): Return cart name for toast notification

  // For now, just return success
  return {
    success: true,
    data: {
      message: 'Product URL received (not yet saved)',
      url,
    },
  };
}
