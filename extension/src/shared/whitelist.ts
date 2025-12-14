/**
 * Retailer Whitelist Configuration
 *
 * Defines which retail domains are supported and their product page URL patterns.
 * Used by content script to detect when to show the "Add to Rfrnce" button.
 */

export const RETAILER_WHITELIST: Record<string, RegExp> = {
  'www.amazon.com': /\/(dp|gp\/product)\//,
  'www.walmart.com': /\/ip\//,
  'www.bestbuy.com': /\.p\?/,
  'www.target.com': /\/-\/A-/,
  'www.ebay.com': /\/itm\//,
  'www.newegg.com': /\/p\//,
};

/**
 * Check if a domain is in the retailer whitelist
 *
 * @param hostname - The hostname from window.location.hostname
 * @returns true if domain is whitelisted, false otherwise
 *
 * @example
 * isWhitelistedDomain('www.amazon.com') // true
 * isWhitelistedDomain('www.google.com') // false
 */
export function isWhitelistedDomain(hostname: string): boolean {
  return hostname in RETAILER_WHITELIST;
}

/**
 * Check if the current URL is a product page on a whitelisted domain
 *
 * @param hostname - The hostname from window.location.hostname
 * @param pathname - The pathname from window.location.pathname
 * @param search - The search params from window.location.search
 * @returns true if URL matches product page pattern for the domain, false otherwise
 *
 * @example
 * // Amazon product page
 * isProductPage('www.amazon.com', '/dp/B08N5WRWNW', '') // true
 *
 * // Amazon homepage
 * isProductPage('www.amazon.com', '/', '') // false
 *
 * // Best Buy product page
 * isProductPage('www.bestbuy.com', '/site/product/12345', '.p?skuId=12345') // true
 */
export function isProductPage(hostname: string, pathname: string, search: string): boolean {
  const pattern = RETAILER_WHITELIST[hostname];
  if (!pattern) return false;

  const fullPath = pathname + search;
  return pattern.test(fullPath);
}
