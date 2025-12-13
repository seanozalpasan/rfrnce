import { Hono } from 'hono';
import { db } from '../db/index.js';
import { carts, products } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

const app = new Hono();

// GET /api/carts - List user's carts with product counts
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    // Get all carts for user with product counts
    const userCarts = await db
      .select({
        id: carts.id,
        name: carts.name,
        isActive: carts.isActive,
        isFrozen: carts.isFrozen,
        reportCount: carts.reportCount,
        createdAt: carts.createdAt,
        updatedAt: carts.updatedAt,
        productCount: sql<number>`cast(count(${products.id}) as int)`,
      })
      .from(carts)
      .leftJoin(products, eq(carts.id, products.cartId))
      .where(eq(carts.userId, userId))
      .groupBy(carts.id)
      .orderBy(carts.createdAt); // Oldest first

    return c.json({
      success: true,
      data: userCarts,
    });
  } catch (error) {
    console.error('Error fetching carts:', error);
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

// POST /api/carts - Create new cart
app.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name = 'Unnamed Cart' } = body;

    // Check cart limit (10 carts max)
    const cartCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(carts)
      .where(eq(carts.userId, userId));

    if (Number(cartCount[0].count) >= 10) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_LIMIT_REACHED',
            message: "You've reached the maximum of 10 carts",
          },
        },
        400
      );
    }

    // Check for duplicate cart name
    const existingCart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.name, name)))
      .limit(1);

    if (existingCart.length > 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CART_NAME_EXISTS',
            message: 'A cart with this name already exists',
          },
        },
        400
      );
    }

    // Create new cart
    const newCart = await db
      .insert(carts)
      .values({
        userId,
        name,
        isActive: false,
        reportCount: 0,
        isFrozen: false,
      })
      .returning();

    return c.json({
      success: true,
      data: {
        ...newCart[0],
        productCount: 0,
      },
    });
  } catch (error) {
    console.error('Error creating cart:', error);
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

// PATCH /api/carts/:id - Update cart (rename or set active)
app.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const cartId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { name, isActive } = body;

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

    // If renaming, check for duplicate name
    if (name && name !== cart[0].name) {
      const existingCart = await db
        .select()
        .from(carts)
        .where(and(eq(carts.userId, userId), eq(carts.name, name)))
        .limit(1);

      if (existingCart.length > 0) {
        return c.json(
          {
            success: false,
            error: {
              code: 'CART_NAME_EXISTS',
              message: 'A cart with this name already exists',
            },
          },
          400
        );
      }
    }

    // If setting active, deactivate all other carts first
    if (isActive === true) {
      await db
        .update(carts)
        .set({ isActive: false })
        .where(eq(carts.userId, userId));
    }

    // Update cart
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedCart = await db
      .update(carts)
      .set(updates)
      .where(eq(carts.id, cartId))
      .returning();

    // Get product count
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.cartId, cartId));

    return c.json({
      success: true,
      data: {
        ...updatedCart[0],
        productCount: Number(productCount[0].count),
      },
    });
  } catch (error) {
    console.error('Error updating cart:', error);
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

// DELETE /api/carts/:id - Delete cart (cascades to products and reports)
app.delete('/:id', async (c) => {
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

    // Delete cart (cascade will delete products and reports)
    await db.delete(carts).where(eq(carts.id, cartId));

    return c.json({
      success: true,
      data: { message: 'Cart deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting cart:', error);
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
