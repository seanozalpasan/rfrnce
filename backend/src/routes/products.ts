import { Hono } from 'hono';
import { db } from '../db/index.js';
import { carts, products } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

const app = new Hono();

// GET /api/carts/:id/products - Get all products for a cart
app.get('/carts/:id/products', async (c) => {
  try {
    const userId = c.get('userId');
    const cartId = parseInt(c.req.param('id'));

    // Verify cart belongs to user
    const cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
      .limit(1);

    if (cart.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found',
          },
        },
        404
      );
    }

    // Get all products for this cart, ordered by createdAt ASC (oldest first)
    const cartProducts = await db
      .select()
      .from(products)
      .where(eq(products.cartId, cartId))
      .orderBy(products.createdAt);

    return c.json({
      success: true,
      data: cartProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again in a few minutes.',
        },
      },
      500
    );
  }
});

// POST /api/carts/:id/products - Add product to cart
app.post('/carts/:id/products', async (c) => {
  try {
    const userId = c.get('userId');
    const cartId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { url } = body;

    if (!url) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Product URL is required',
          },
        },
        400
      );
    }

    // Verify cart belongs to user
    const cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
      .limit(1);

    if (cart.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found',
          },
        },
        404
      );
    }

    // Check if cart is frozen
    if (cart[0].isFrozen) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_FROZEN',
            message: 'This cart has reached its report limit',
          },
        },
        400
      );
    }

    // Check product limit (15 products max per cart)
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.cartId, cartId));

    if (Number(productCount[0].count) >= 15) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_LIMIT_REACHED',
            message: 'This cart is full (15 items maximum)',
          },
        },
        400
      );
    }

    // Check for duplicate URL in this cart
    const existingProduct = await db
      .select()
      .from(products)
      .where(and(eq(products.cartId, cartId), eq(products.url, url)))
      .limit(1);

    if (existingProduct.length > 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_PRODUCT',
            message: 'This product is already in your cart',
          },
        },
        400
      );
    }

    // Create product with status="pending"
    const newProduct = await db
      .insert(products)
      .values({
        cartId,
        url,
        status: 'pending',
      })
      .returning();

    // TODO: Spawn async scraping task here (Phase 5)
    // For now, just return the product with pending status

    return c.json({
      success: true,
      data: newProduct[0],
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again in a few minutes.',
        },
      },
      500
    );
  }
});

// DELETE /api/carts/:cartId/products/:productId - Delete product
app.delete('/carts/:cartId/products/:productId', async (c) => {
  try {
    const userId = c.get('userId');
    const cartId = parseInt(c.req.param('cartId'));
    const productId = parseInt(c.req.param('productId'));

    // Verify cart belongs to user
    const cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
      .limit(1);

    if (cart.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found',
          },
        },
        404
      );
    }

    // Verify product exists and belongs to this cart
    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.cartId, cartId)))
      .limit(1);

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        404
      );
    }

    // Delete product
    await db.delete(products).where(eq(products.id, productId));

    return c.json({
      success: true,
      data: { message: 'Product deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again in a few minutes.',
        },
      },
      500
    );
  }
});

// POST /api/carts/:cartId/products/:productId/move - Move product to another cart
app.post('/carts/:cartId/products/:productId/move', async (c) => {
  try {
    const userId = c.get('userId');
    const cartId = parseInt(c.req.param('cartId'));
    const productId = parseInt(c.req.param('productId'));
    const body = await c.req.json();
    const { targetCartId } = body;

    if (!targetCartId) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_TARGET_CART',
            message: 'Target cart ID is required',
          },
        },
        400
      );
    }

    // Verify source cart belongs to user
    const sourceCart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, cartId), eq(carts.userId, userId)))
      .limit(1);

    if (sourceCart.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found',
          },
        },
        404
      );
    }

    // Verify target cart exists and belongs to user
    const targetCart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.id, targetCartId), eq(carts.userId, userId)))
      .limit(1);

    if (targetCart.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Target cart not found',
          },
        },
        404
      );
    }

    // Check if target cart is frozen
    if (targetCart[0].isFrozen) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_FROZEN',
            message: 'The target cart has reached its report limit',
          },
        },
        400
      );
    }

    // Verify product exists and belongs to source cart
    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.cartId, cartId)))
      .limit(1);

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        404
      );
    }

    // Check if target cart already has this URL
    const existingProduct = await db
      .select()
      .from(products)
      .where(and(eq(products.cartId, targetCartId), eq(products.url, product[0].url)))
      .limit(1);

    if (existingProduct.length > 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_PRODUCT',
            message: 'This product is already in the target cart',
          },
        },
        400
      );
    }

    // Check target cart product limit (15 max)
    const targetProductCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.cartId, targetCartId));

    if (Number(targetProductCount[0].count) >= 15) {
      return c.json(
        {
          success: false,
          error: {
            code: 'TARGET_CART_FULL',
            message: 'The target cart is full (15 items maximum)',
          },
        },
        400
      );
    }

    // Move product to target cart
    await db
      .update(products)
      .set({ cartId: targetCartId })
      .where(eq(products.id, productId));

    return c.json({
      success: true,
      data: { message: 'Product moved successfully' },
    });
  } catch (error) {
    console.error('Error moving product:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again in a few minutes.',
        },
      },
      500
    );
  }
});

export default app;
