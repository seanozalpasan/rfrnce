/**
 * Chrome storage helpers for Rfrnce extension
 * Uses chrome.storage.local for persistence
 */

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create user UUID
 * Generates UUID v4 on first call, returns cached UUID on subsequent calls
 */
export async function getOrCreateUserUuid(): Promise<string> {
  const result = await chrome.storage.local.get('user_uuid');

  if (result.user_uuid) {
    return result.user_uuid;
  }

  // Generate new UUID
  const newUuid = generateUUID();
  await chrome.storage.local.set({ user_uuid: newUuid });

  return newUuid;
}

/**
 * Get user UUID (returns null if not set)
 */
export async function getUserUuid(): Promise<string | null> {
  const result = await chrome.storage.local.get('user_uuid');
  return result.user_uuid ?? null;
}

/**
 * Set active cart ID
 */
export async function setActiveCartId(cartId: number): Promise<void> {
  await chrome.storage.local.set({ active_cart_id: cartId });
}

/**
 * Get active cart ID
 */
export async function getActiveCartId(): Promise<number | null> {
  const result = await chrome.storage.local.get('active_cart_id');
  return result.active_cart_id ?? null;
}

/**
 * Clear active cart ID
 */
export async function clearActiveCartId(): Promise<void> {
  await chrome.storage.local.remove('active_cart_id');
}
