import { pgTable, serial, text, varchar, integer, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: varchar('uuid', { length: 36 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull().default('Unnamed Cart'),
  isActive: boolean('is_active').notNull().default(false),
  reportCount: integer('report_count').notNull().default(0),
  isFrozen: boolean('is_frozen').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'complete' | 'failed'
  name: varchar('name', { length: 500 }),
  price: varchar('price', { length: 50 }),
  brand: varchar('brand', { length: 200 }),
  color: varchar('color', { length: 100 }),
  dimensions: varchar('dimensions', { length: 200 }),
  description: text('description'),
  reviewsJson: jsonb('reviews_json'),
  scrapedAt: timestamp('scraped_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUrlPerCart: uniqueIndex('unique_url_per_cart').on(table.cartId, table.url),
}));

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }).unique(),
  content: text('content').notNull(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
});
