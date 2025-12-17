/**
 * Shared TypeScript types for Rfrnce extension
 */

// ============================================================================
// Database Entity Types
// ============================================================================

export interface User {
  id: number;
  uuid: string;
}

export interface Cart {
  id: number;
  name: string;
  isFrozen: boolean;
  reportCount: number;
  productCount: number; // Returned from API (count from backend)
  createdAt?: string;
  updatedAt?: string;
}

export type ProductStatus = 'pending' | 'complete' | 'failed';

export interface Product {
  id: number;
  cartId: number;
  url: string;
  status: ProductStatus;
  name: string | null;
  price: string | null;
  brand: string | null;
  color: string | null;
  dimensions: string | null;
  description: string | null;
  reviewsJson: any | null; // JSON data from Exa
  scrapedAt: string | null;
  createdAt: string;
}

export interface Report {
  id: number;
  cartId: number;
  content: string; // HTML content from Gemini
  generatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// API Error Codes
// ============================================================================

export type ApiErrorCode =
  | 'DUPLICATE_PRODUCT'
  | 'CART_LIMIT_REACHED'
  | 'PRODUCT_LIMIT_REACHED'
  | 'TARGET_CART_FULL'
  | 'CART_NAME_EXISTS'
  | 'CART_FROZEN'
  | 'HAS_FAILED_PRODUCTS'
  | 'HAS_PENDING_PRODUCTS'
  | 'NO_PRODUCTS'
  | 'CART_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'REPORT_NOT_FOUND'
  | 'INVALID_UUID'
  | 'INTERNAL_ERROR';

// ============================================================================
// Message Types (Content Script <-> Background Worker)
// ============================================================================

export type Message =
  | { type: 'ADD_PRODUCT'; payload: { url: string } }
  | { type: 'GET_ACTIVE_CART' }
  | { type: 'GET_USER_CARTS' };

export interface AddProductSuccessResponse {
  success: true;
  data: {
    cartId: number;
    cartName: string;
    productId: number;
  };
}

export type MessageResponse = ApiSuccessResponse<any> | ApiErrorResponse;

// ============================================================================
// Cart Creation/Update Payloads
// ============================================================================

export interface CreateCartPayload {
  name?: string;
}

export interface UpdateCartPayload {
  name?: string;
}

export interface AddProductPayload {
  url: string;
}

export interface MoveProductPayload {
  targetCartId: number;
}

// ============================================================================
// Report Generation
// ============================================================================

export interface GenerateReportResponse {
  content: string; // HTML/Markdown content
  reportCount: number;
  isFrozen: boolean;
}

export interface GetReportResponse {
  content: string;
  generatedAt: string;
}
