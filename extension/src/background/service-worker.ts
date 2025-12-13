// Background service worker for Rfrnce extension
import { getOrCreateUserUuid } from '../shared/storage';

console.log('Rfrnce background service worker loaded');

// Install event - generate UUID on first install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Rfrnce extension installed');

  // Generate or retrieve UUID
  const uuid = await getOrCreateUserUuid();
  console.log('User UUID:', uuid);

  // TODO: Call backend API to initialize user
});

// Startup event - verify UUID exists on every startup
chrome.runtime.onStartup.addListener(async () => {
  const uuid = await getOrCreateUserUuid();
  console.log('Extension started, User UUID:', uuid);
});

// Message listener - will handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  // TODO: Handle messages
  return true; // Required for async response
});
