// Background service worker for Rfrnce extension
import { getOrCreateUserUuid, getActiveCartId, setActiveCartId } from '../shared/storage';
import { initUser, getCarts, createCart, addProduct, moveProduct } from '../shared/api';

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

  // Handle GET_CARTS message
  if (message.type === 'GET_CARTS') {
    getCarts()
      .then(sendResponse)
      .catch((error) => {
        console.error('[Background] Error handling GET_CARTS:', error);
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

  // Handle MOVE_PRODUCT message
  if (message.type === 'MOVE_PRODUCT') {
    const { cartId, productId, targetCartId } = message.payload;
    moveProduct(cartId, productId, targetCartId)
      .then(sendResponse)
      .catch((error) => {
        console.error('[Background] Error handling MOVE_PRODUCT:', error);
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
 */
async function handleAddProduct(url: string) {
  console.log(`[Background] ADD_PRODUCT called with URL: ${url}`);

  try {
    // Get active cart ID from storage
    let activeCartId = await getActiveCartId();
    console.log(`[Background] Active cart ID: ${activeCartId}`);

    // If no active cart, create a default cart
    if (!activeCartId) {
      console.log('[Background] No active cart found, checking for existing carts...');

      // Check if any carts exist
      const cartsResponse = await getCarts();

      if (cartsResponse.success && cartsResponse.data.length > 0) {
        // Use first cart as active
        activeCartId = cartsResponse.data[0].id;
        await setActiveCartId(activeCartId);
        console.log(`[Background] Set first cart as active: ${activeCartId}`);
      } else {
        // Create a default cart
        console.log('[Background] No carts exist, creating default cart...');
        const createResponse = await createCart({ name: 'Unnamed Cart' });

        if (!createResponse.success) {
          return createResponse; // Return error from cart creation
        }

        activeCartId = createResponse.data.id;
        await setActiveCartId(activeCartId);
        console.log(`[Background] Created and set default cart: ${activeCartId}`);
      }
    }

    // Add product to active cart
    console.log(`[Background] Adding product to cart ${activeCartId}...`);
    const productResponse = await addProduct(activeCartId, url);

    if (!productResponse.success) {
      return productResponse; // Return error from product creation
    }

    // Get cart name for toast notification
    const cartsResponse = await getCarts();
    let cartName = 'your cart';

    if (cartsResponse.success) {
      const cart = cartsResponse.data.find((c) => c.id === activeCartId);
      if (cart) {
        cartName = cart.name;
      }
    }

    console.log(`[Background] Product added successfully to "${cartName}"`);

    return {
      success: true,
      data: {
        cartId: activeCartId,
        cartName,
        productId: productResponse.data.id,
      },
    };
  } catch (error) {
    console.error('[Background] Error in handleAddProduct:', error);
    throw error; // Will be caught by message listener
  }
}
