/**
 * Retailer Whitelist Configuration
 *
 * Defines which retail domains are supported and their product page URL patterns.
 * Used by content script to detect when to show the "Add to Rfrnce" button.
 */

export const RETAILER_WHITELIST: Record<string, RegExp> = {
  // Original retailers
  'www.amazon.com': /\/(dp|gp\/product)\//,
  'www.walmart.com': /\/ip\//,
  'www.bestbuy.com': /\.p\?/,
  'www.target.com': /\/-\/A-/,
  'www.ebay.com': /\/itm\//,
  'www.newegg.com': /\/p\//,

  // Home improvement
  'www.homedepot.com': /\/p\//,
  'www.lowes.com': /\/pd\//,

  // Specialty retailers
  'www.etsy.com': /\/listing\//,
  'www.wayfair.com': /\/pdp\//,
  'www.costco.com': /\/p\/-\//,
  'www.aliexpress.us': /\/item\//,
  'www.bhphotovideo.com': /\/c\/product\//,

  // Apparel & sporting goods
  'www.nike.com': /\/t\//,
  'www.adidas.com': /\.html/,
  'www.dickssportinggoods.com': /\/p\//,
  'www.urbanoutfitters.com': /\/shop\/[^\/]+/,  // /shop/ followed by product slug
  'www.depop.com': /\/products\//,
  'www.forever21.com': /\/products\//,
  'www.hollisterco.com': /\/shop\/us\/p\//,

  // Beauty & cosmetics
  'www.sephora.com': /\/product\//,
  'www.ulta.com': /\/p\//,

  // Fashion
  'www.aritzia.com': /\/product\//,
  'www.glossier.com': /\/products\/[^\/]+\?variant=/,
  'www.uniqlo.com': /\/products\//,
  'www.fashionnova.com': /\/products\//,
  'www.elfcosmetics.com': /\/[0-9]+\.html/,
  'shop.lululemon.com': /\/p\//,
  'www2.hm.com': /\/productpage\.[0-9]+\.html/,
  'us.brandymelville.com': /\/products\//,
  'www.gap.com': /\/product\.do\?pid=/,
  'oldnavy.gap.com': /\/product\.do\?pid=/,
  'www.zalando.co.uk': /\.html$/,
  'www.vinted.com': /\/items\/[0-9]+/,

  // Outdoor & sporting
  'www.osprey.com': /\?size=/,
  'www.deuter.com': /\/p[0-9]+-/,
  'www.thenorthface.com': /\/p\//,
  'www.carhartt.com': /\/product\/[0-9]+\//,
  'www.levi.com': /\/p\//,
  'www.pacsun.com': /[0-9]+\.html/,
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
