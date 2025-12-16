import { Hono } from 'hono';
import { db } from '../db/index.js';
import { carts, products, reports } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { generateReport } from '../services/gemini.js';

const app = new Hono();

/**
 * POST /api/carts/:id/report
 * Generate a new report for a cart
 */
app.post('/:id/report', async (c) => {
  const userId = c.get('userId') as number;
  const cartId = parseInt(c.req.param('id'));

  if (isNaN(cartId)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_CART_ID',
        message: 'Invalid cart ID'
      }
    }, 400);
  }

  try {
    // Step 1: Get cart and verify ownership
    const cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
      .limit(1);

    if (cart.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      }, 404);
    }

    // Step 2: Check if cart is frozen
    if (cart[0].isFrozen) {
      return c.json({
        success: false,
        error: {
          code: 'CART_FROZEN',
          message: 'This cart has reached its report limit'
        }
      }, 400);
    }

    // Step 3: Get all products in cart
    const cartProducts = await db
      .select()
      .from(products)
      .where(eq(products.cartId, cartId));

    // Step 4: Validate products
    if (cartProducts.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'NO_PRODUCTS',
          message: 'Add products to generate report'
        }
      }, 400);
    }

    const hasPending = cartProducts.some(p => p.status === 'pending');
    if (hasPending) {
      return c.json({
        success: false,
        error: {
          code: 'HAS_PENDING_PRODUCTS',
          message: 'Please wait for all products to finish loading'
        }
      }, 400);
    }

    const hasFailed = cartProducts.some(p => p.status === 'failed');
    if (hasFailed) {
      return c.json({
        success: false,
        error: {
          code: 'HAS_FAILED_PRODUCTS',
          message: 'Remove failed items to generate report'
        }
      }, 400);
    }

    const completeProducts = cartProducts.filter(p => p.status === 'complete');
    if (completeProducts.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'NO_PRODUCTS',
          message: 'Add products to generate report'
        }
      }, 400);
    }

    // Step 5: Generate report with Gemini
    console.log(`[Reports] Generating report for cart ${cartId} with ${completeProducts.length} products`);
    const reportContent = await generateReport(completeProducts);

    // Step 6: Upsert report (overwrite if exists)
    await db
      .insert(reports)
      .values({
        cartId,
        content: reportContent,
        generatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: reports.cartId,
        set: {
          content: reportContent,
          generatedAt: new Date()
        }
      });

    // Step 7: Increment report count
    const newReportCount = cart[0].reportCount + 1;
    const shouldFreeze = newReportCount >= 3;

    await db
      .update(carts)
      .set({
        reportCount: newReportCount,
        isFrozen: shouldFreeze,
        updatedAt: new Date()
      })
      .where(eq(carts.id, cartId));

    console.log(`[Reports] Report generated successfully. Count: ${newReportCount}, Frozen: ${shouldFreeze}`);

    return c.json({
      success: true,
      data: {
        content: reportContent,
        reportCount: newReportCount,
        isFrozen: shouldFreeze
      }
    });

  } catch (error) {
    console.error('[Reports] Error generating report:', error);

    // Check for specific Gemini errors
    if (error instanceof Error) {
      if (error.message.includes('REPORT_GENERATION_TIMEOUT')) {
        return c.json({
          success: false,
          error: {
            code: 'REPORT_TIMEOUT',
            message: 'Report generation took too long. Please try again.'
          }
        }, 408);
      }
      if (error.message.includes('REPORT_GENERATION_FAILED')) {
        return c.json({
          success: false,
          error: {
            code: 'REPORT_GENERATION_FAILED',
            message: 'Report generation failed. Please try again.'
          }
        }, 500);
      }
    }

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again in a few minutes.'
      }
    }, 500);
  }
});

/**
 * GET /api/carts/:id/report
 * Get existing report for a cart
 */
app.get('/:id/report', async (c) => {
  const userId = c.get('userId') as number;
  const cartId = parseInt(c.req.param('id'));

  if (isNaN(cartId)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_CART_ID',
        message: 'Invalid cart ID'
      }
    }, 400);
  }

  try {
    // Step 1: Verify cart ownership
    const cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
      .limit(1);

    if (cart.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      }, 404);
    }

    // Step 2: Get report
    const report = await db
      .select()
      .from(reports)
      .where(eq(reports.cartId, cartId))
      .limit(1);

    if (report.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'No report exists for this cart'
        }
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        content: report[0].content,
        generatedAt: report[0].generatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('[Reports] Error fetching report:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again in a few minutes.'
      }
    }, 500);
  }
});

export default app;
