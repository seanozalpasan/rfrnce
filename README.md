# rfrnce

rfrnce is a lightweight Chrome extension and companion backend that lets users collect product pages from supported retailers into curated "carts" and generate AI-powered comparison reports. The extension injects a lightweight floating overlay on whitelisted retailer pages so items can be saved while browsing; the backend performs structured extraction and review aggregation and uses an LLM to synthesize a single HTML report for a cart.

---

## Key features

* One-click product capture via a floating overlay injected into retailer pages.
* Structured scraping of product details and aggregation of external reviews.
* LLM-powered report generation (summary, side-by-side table, review analysis, pros/cons, final recommendation) rendered as sanitized HTML.
* Business rules to keep behavior predictable: maximum carts per user, maximum products per cart, and limited report generation per cart.
* Manifest V3 extension architecture with a React + TypeScript popup and a service worker background script.

---

## High-level workflow

1. When a user visits a whitelisted product page, the extension's content script injects a floating overlay (rendered inside a Shadow DOM) that enables the user to save the product to an active cart.
2. Clicking the overlay informs the extension's service worker to call the backend and add the product URL to the user's cart (user identity is represented by `X-User-UUID`). The backend returns a product record with an initial `pending` status.
3. The backend orchestrates extraction tasks:

   * A structured crawler extracts product fields (name, price, brand, specs).
   * A review aggregator collects review snippets and organizes them as `reviewsJson`.
   * Products end in `complete` or `failed` depending on extraction success.
4. Once all products in a cart are `complete`, the user can generate a single comparison report. The backend calls an LLM to synthesize the report HTML, sanitizes the result, stores it, and increments the cart's report counter. After a configured number of reports a cart can be marked as frozen.

---

## Tech stack

* Extension UI: React + TypeScript, built with Vite and CRXJS for Chrome extension development.
* Content script & service worker: TypeScript (Manifest V3 architecture).
* Backend: Hono (TypeScript), designed to be deployed on Vercel or similar serverless platforms.
* Database: Postgres (managed provider), accessed with Drizzle ORM.
* External services and integrations:

  * Structured product extraction (crawler)
  * Review aggregation service
  * LLM for report synthesis

---