// Background service worker for Rfrnce extension

console.log('Rfrnce background service worker loaded');

// Install event - will be used for user initialization
chrome.runtime.onInstalled.addListener(() => {
  console.log('Rfrnce extension installed');
  // TODO: Generate UUID and initialize user
});

// Message listener - will handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  // TODO: Handle messages
  return true; // Required for async response
});
