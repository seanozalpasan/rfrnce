import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { authMiddleware } from './middleware/auth.js';
import usersRouter from './routes/users.js';

const app = new Hono();

// Configure CORS for Chrome extension
app.use('/*', cors({
  origin: ['chrome-extension://*'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'X-User-UUID'],
}));

// Root endpoint
app.get('/', (c) => {
  return c.text('Rfrnce API');
});

// Public API Routes (no auth required)
app.route('/api/users', usersRouter);

// Protected API Routes (auth middleware applied)
// Apply auth middleware to all other /api routes
app.use('/api/carts/*', authMiddleware);
app.use('/api/products/*', authMiddleware);
app.use('/api/reports/*', authMiddleware);

// Future protected routes will be registered here:
// app.route('/api/carts', cartsRouter);
// app.route('/api/products', productsRouter);
// app.route('/api/reports', reportsRouter);

// Test endpoint to verify auth middleware (can be removed later)
app.get('/api/carts/test', (c) => {
  const userId = c.get('userId');
  const userUuid = c.get('userUuid');
  return c.json({
    success: true,
    message: 'Auth middleware working!',
    userId,
    userUuid
  });
});

// For local development with Node.js server
const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app;
