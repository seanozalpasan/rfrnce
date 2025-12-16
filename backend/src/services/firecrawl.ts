import FirecrawlApp from '@mendable/firecrawl-js';
import 'dotenv/config';

const FIRECRAWL_TIMEOUT = 180000; // 3 minutes

// Initialize Firecrawl client
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

// Extraction schema as defined in spec
const extractionSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Product name/title" },
    price: { type: "string", description: "Current price including currency symbol" },
    brand: { type: "string", description: "Brand or manufacturer name" },
    color: { type: "string", description: "Product color if applicable" },
    dimensions: { type: "string", description: "Size or dimensions" },
    description: { type: "string", description: "Product description, max 500 chars" }
  },
  required: ["name", "price"]
};

export interface ProductData {
  name: string;
  price: string;
  brand?: string;
  color?: string;
  dimensions?: string;
  description?: string;
}

/**
 * Extract product data from a URL using Firecrawl
 * @param url - The product page URL
 * @returns Product data or null if extraction failed
 * @throws Error if timeout or API error
 */
export async function extractProductData(url: string): Promise<ProductData | null> {
  try {
    console.log(`[Firecrawl] Starting extraction for URL: ${url}`);

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Firecrawl extraction timeout (3 minutes)'));
      }, FIRECRAWL_TIMEOUT);
    });

    // Create extraction promise
    const extractionPromise = firecrawl.scrape(url, {
      formats: [
        {
          type: 'json',
          schema: extractionSchema,
        }
      ],
    });

    // Race between extraction and timeout
    const result = await Promise.race([extractionPromise, timeoutPromise]);

    // Extract data from result (using json field for structured extraction)
    const data = result.json;

    if (!data) {
      console.error('[Firecrawl] No data extracted');
      return null;
    }

    // Validate required fields (name and price)
    // Also check for error responses (like 404 pages)
    if (!data.name || !data.price || data.price === 'N/A' || result.metadata?.statusCode === 404) {
      console.error('[Firecrawl] Missing required fields or error page:', {
        name: data.name,
        price: data.price,
        statusCode: result.metadata?.statusCode
      });
      return null;
    }

    console.log('[Firecrawl] Extraction successful:', {
      name: data.name,
      price: data.price,
      brand: data.brand || 'N/A',
    });

    // Return extracted data
    return {
      name: data.name,
      price: data.price,
      brand: data.brand || undefined,
      color: data.color || undefined,
      dimensions: data.dimensions || undefined,
      description: data.description || undefined,
    };
  } catch (error) {
    console.error('[Firecrawl] Error during extraction:', error);

    // If it's a timeout error, throw it
    if (error instanceof Error && error.message.includes('timeout')) {
      throw error;
    }

    // For other errors, return null (will mark product as failed)
    return null;
  }
}
