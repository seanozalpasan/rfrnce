import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
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

// API Routes
app.route('/api/users', usersRouter);

// For local development with Node.js server
const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app;
