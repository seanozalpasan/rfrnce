import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const app = new Hono();

// POST /api/users/init - Initialize or retrieve user by UUID
app.post('/init', async (c) => {
  try {
    const body = await c.req.json();
    const { uuid } = body;

    if (!uuid || typeof uuid !== 'string') {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_UUID',
            message: 'Invalid or missing user ID',
          },
        },
        400
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.uuid, uuid))
      .limit(1);

    if (existingUser.length > 0) {
      // User exists, return it
      return c.json({
        success: true,
        data: {
          id: existingUser[0].id,
          uuid: existingUser[0].uuid,
        },
      });
    }

    // User doesn't exist, create new user
    const newUser = await db
      .insert(users)
      .values({ uuid })
      .returning();

    return c.json({
      success: true,
      data: {
        id: newUser[0].id,
        uuid: newUser[0].uuid,
      },
    });
  } catch (error) {
    console.error('Error in /api/users/init:', error);
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
