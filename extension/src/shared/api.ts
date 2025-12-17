/**
 * API client for Rfrnce backend
 */

import { getUserUuid } from './storage';
import type { ApiResponse, User, Cart, Product, CreateCartPayload, UpdateCartPayload, GenerateReportResponse, GetReportResponse } from './types';

// API base URL - will be changed to Vercel URL when deployed
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Make authenticated API request
 * Automatically adds X-User-UUID header
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const uuid = await getUserUuid();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add UUID header for authenticated requests
  if (uuid) {
    headers['X-User-UUID'] = uuid;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again in a few minutes.',
      },
    };
  }
}

/**
 * Initialize user - creates user if doesn't exist, returns existing user if exists
 */
export async function initUser(uuid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>('/users/init', {
    method: 'POST',
    body: JSON.stringify({ uuid }),
  });
}

/**
 * Get all carts for the current user
 */
export async function getCarts(): Promise<ApiResponse<Cart[]>> {
  return apiRequest<Cart[]>('/carts', {
    method: 'GET',
  });
}

/**
 * Create a new cart
 */
export async function createCart(payload: CreateCartPayload): Promise<ApiResponse<Cart>> {
  return apiRequest<Cart>('/carts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update a cart (rename or set active)
 */
export async function updateCart(cartId: number, payload: UpdateCartPayload): Promise<ApiResponse<Cart>> {
  return apiRequest<Cart>(`/carts/${cartId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a cart
 */
export async function deleteCart(cartId: number): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/carts/${cartId}`, {
    method: 'DELETE',
  });
}

/**
 * Add a product to a cart
 */
export async function addProduct(cartId: number, url: string): Promise<ApiResponse<Product>> {
  return apiRequest<Product>(`/carts/${cartId}/products`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

/**
 * Get all products for a cart
 */
export async function getProducts(cartId: number): Promise<ApiResponse<Product[]>> {
  return apiRequest<Product[]>(`/carts/${cartId}/products`, {
    method: 'GET',
  });
}

/**
 * Delete a product from a cart
 */
export async function deleteProduct(cartId: number, productId: number): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/carts/${cartId}/products/${productId}`, {
    method: 'DELETE',
  });
}

/**
 * Move a product to another cart
 */
export async function moveProduct(
  cartId: number,
  productId: number,
  targetCartId: number
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/carts/${cartId}/products/${productId}/move`, {
    method: 'POST',
    body: JSON.stringify({ targetCartId }),
  });
}

/**
 * Generate a report for a cart
 */
export async function generateReport(cartId: number): Promise<ApiResponse<GenerateReportResponse>> {
  return apiRequest<GenerateReportResponse>(`/carts/${cartId}/report`, {
    method: 'POST',
  });
}

/**
 * Get an existing report for a cart
 */
export async function getReport(cartId: number): Promise<ApiResponse<GetReportResponse>> {
  return apiRequest<GetReportResponse>(`/carts/${cartId}/report`, {
    method: 'GET',
  });
}

/**
 * Export apiRequest for future use
 */
export { apiRequest };
