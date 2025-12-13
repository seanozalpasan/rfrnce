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

// Message listener - will handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  // TODO: Handle messages
  return true; // Required for async response
});
