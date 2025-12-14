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

// Run detection on page load
detectPage();

// TODO: Inject floating overlay button (Task 4.4)
// TODO: Handle button click to add product (Task 4.5)
