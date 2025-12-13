/**
 * API client for Rfrnce backend
 */

import { getUserUuid } from './storage';

// API base URL - will be changed to Vercel URL when deployed
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * API response types
 */
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * User types
 */
interface User {
  id: number;
  uuid: string;
}

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
 * Export apiRequest for future use
 */
export { apiRequest };
