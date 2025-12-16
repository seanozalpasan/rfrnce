import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const GEMINI_TIMEOUT = 120000; // 2 minutes

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ProductForReport {
  name: string;
  price: string;
  brand?: string | null;
  color?: string | null;
  dimensions?: string | null;
  description?: string | null;
  reviewsJson?: any;
}

/**
 * Generate a comparison report using Gemini
 * @param products - Array of products with complete data
 * @returns HTML content for the report
 */
export async function generateReport(products: ProductForReport[]): Promise<string> {
  try {
    console.log(`[Gemini] Starting report generation for ${products.length} products`);

    // Build the prompt from template
    const prompt = buildPrompt(products);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Gemini report generation timeout (2 minutes)'));
      }, GEMINI_TIMEOUT);
    });

    // Get Gemini model from environment variable (must be set in .env)
    let modelName = process.env.GEMINI_MODEL;
    if (!modelName) {
      throw new Error('GEMINI_MODEL environment variable is not set');
    }

    // Ensure model name doesn't have 'models/' prefix
    if (modelName.startsWith('models/')) {
      modelName = modelName.replace('models/', '');
    }

    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`[Gemini] Using model: ${modelName}`);

    // Generate content
    const generationPromise = model.generateContent(prompt);

    // Race between generation and timeout
    const result = await Promise.race([generationPromise, timeoutPromise]);

    // Extract text from result
    const response = await result.response;
    const reportHtml = response.text();

    console.log(`[Gemini] Report generated successfully (${reportHtml.length} characters)`);

    return reportHtml;
  } catch (error) {
    console.error('[Gemini] Error generating report:', error);

    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('REPORT_GENERATION_TIMEOUT');
    }

    throw new Error('REPORT_GENERATION_FAILED');
  }
}

/**
 * Build the prompt from the template and product data
 */
function buildPrompt(products: ProductForReport[]): string {
  // Build product list section
  const productsList = products.map((product, index) => {
    const reviews = product.reviewsJson
      ? (Array.isArray(product.reviewsJson) ? product.reviewsJson : [])
      : [];

    const reviewSummary = reviews.length > 0
      ? `${reviews.length} reviews found from various sources`
      : 'No reviews found';

    return `
Product ${index + 1}:
- Name: ${product.name}
- Price: ${product.price}
- Brand: ${product.brand || 'Unknown'}
- Specifications: ${product.dimensions || 'N/A'}, ${product.color || 'N/A'}
- Description: ${product.description || 'No description available'}
- Reviews: ${reviewSummary}
${reviews.length > 0 ? `\nReview highlights:\n${reviews.slice(0, 5).map((r: any) => `  • ${r.title || r.snippet?.substring(0, 100)}`).join('\n')}` : ''}
    `.trim();
  }).join('\n\n');

  // Complete prompt based on spec template
  return `
You are a product comparison expert. Generate a detailed comparison report for the following products.

PRODUCTS:
${productsList}

Generate a report with these sections:

1. EXECUTIVE SUMMARY
Recommend the best value option with brief reasoning (2-3 sentences).

2. COMPARISON TABLE
Create a clean HTML table comparing price and key specifications side-by-side.

3. REVIEW ANALYSIS
For each product, summarize consumer sentiment based on the reviews provided. If no reviews were found for a product, note that user feedback was unavailable.

4. PROS AND CONS
List pros and cons for each product based on specifications and reviews (if available).

5. FINAL RECOMMENDATION
Provide a detailed recommendation with reasoning based on value, features, and user feedback.

IMPORTANT: Format the entire output as clean, semantic HTML suitable for display. Use proper HTML tags (h2, h3, p, table, ul, li, etc.). Do not use markdown. Make it visually clear and well-structured.
  `.trim();
}
