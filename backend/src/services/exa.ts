import Exa from 'exa-js';

const EXA_TIMEOUT = 180000; // 3 minutes

// Initialize Exa client
const exa = new Exa(process.env.EXA_API_KEY || '');

export interface ReviewResult {
  url: string;
  title: string;
  snippet: string;
  source: string; // 'reddit' | 'forum' | 'general'
}

/**
 * Search for product reviews using Exa
 * Runs 3 queries: reddit reviews, forum reviews, and general reviews
 * @param productName - The product name to search for
 * @returns Array of review results or empty array if search failed
 */
export async function searchReviews(productName: string): Promise<ReviewResult[]> {
  try {
    console.log(`[Exa] Starting review search for: ${productName}`);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Exa review search timeout (3 minutes)'));
      }, EXA_TIMEOUT);
    });

    // Create search promises for all three queries
    const searchPromises = Promise.all([
      // Query 1: Reddit reviews
      exa.searchAndContents(`"${productName}" review reddit`, {
        numResults: 3,
        useAutoprompt: false,
      }),
      // Query 2: Forum reviews
      exa.searchAndContents(`"${productName}" review forum`, {
        numResults: 3,
        useAutoprompt: false,
      }),
      // Query 3: General reviews
      exa.searchAndContents(`"${productName}" review`, {
        numResults: 4,
        useAutoprompt: false,
      }),
    ]);

    // Race between searches and timeout
    const results = await Promise.race([searchPromises, timeoutPromise]);

    const [redditResults, forumResults, generalResults] = results;

    // Aggregate all results
    const allReviews: ReviewResult[] = [];

    // Process Reddit results
    if (redditResults && redditResults.results) {
      redditResults.results.forEach((result: any) => {
        allReviews.push({
          url: result.url,
          title: result.title || '',
          snippet: result.text || '',
          source: 'reddit',
        });
      });
    }

    // Process Forum results
    if (forumResults && forumResults.results) {
      forumResults.results.forEach((result: any) => {
        allReviews.push({
          url: result.url,
          title: result.title || '',
          snippet: result.text || '',
          source: 'forum',
        });
      });
    }

    // Process General results
    if (generalResults && generalResults.results) {
      generalResults.results.forEach((result: any) => {
        allReviews.push({
          url: result.url,
          title: result.title || '',
          snippet: result.text || '',
          source: 'general',
        });
      });
    }

    console.log(`[Exa] Found ${allReviews.length} total reviews`);

    return allReviews;
  } catch (error) {
    // Graceful degradation: return empty array on error
    // (per spec: "If Exa times out or fails: set reviewsJson to empty array, continue with status='complete'")
    console.error('[Exa] Error during review search:', error);
    console.log('[Exa] Returning empty reviews array (graceful degradation)');
    return [];
  }
}
