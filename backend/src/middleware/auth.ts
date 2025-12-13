import { Context, Next } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Extend Hono's context to include user
declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
    userUuid: string;
  }
}

/**
 * Auth middleware - validates X-User-UUID header and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  const uuid = c.req.header('X-User-UUID');

  if (!uuid) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: 'Invalid or missing user ID',
        },
      },
      401
    );
  }

  // Look up user by UUID
  const user = await db
    .select()
    .from(users)
    .where(eq(users.uuid, uuid))
    .limit(1);

  if (user.length === 0) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_UUID',
          message: 'Invalid or missing user ID',
        },
      },
      401
    );
  }

  // Attach user to context
  c.set('userId', user[0].id);
  c.set('userUuid', user[0].uuid);

  await next();
}
