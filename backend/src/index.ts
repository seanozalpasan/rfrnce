import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { authMiddleware } from './middleware/auth.js';
import usersRouter from './routes/users.js';
import cartsRouter from './routes/carts.js';

const app = new Hono();

// Configure CORS for Chrome extension
app.use('/*', cors({
  origin: (origin) => {
    // Allow all chrome extensions (works for any extension ID)
    if (origin?.startsWith('chrome-extension://')) return origin;
    // Allow localhost for testing
    if (origin?.startsWith('http://localhost')) return origin;
    // Block all other origins
    return '';
  },
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

// Register protected routes
app.route('/api/carts', cartsRouter);
// app.route('/api/products', productsRouter); // TODO: Implement in Phase 4
// app.route('/api/reports', reportsRouter);   // TODO: Implement in Phase 6

// For local development with Node.js server
const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app;
