import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiErrorResponse } from '@/types/api';

/**
 * Primary HTTP Client for GymSlot FastAPI Gateway
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Request Interceptor: Injects Bearer JWT token if user is authenticated
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles automatic 401 refresh & standardized error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // Attempt token refresh
          const { data } = await axios.post<{ access_token: string; refresh_token?: string }>(
            '/api/v1/auth/refresh',
            { refresh_token: refreshToken }
          );

          if (data.access_token) {
            useAuthStore.getState().setToken(data.access_token);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          // Refresh token expired or revoked -> clear session & redirect to login
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?expired=1';
          }
          return Promise.reject(refreshErr);
        }
      } else {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts clean, human-readable error messages from FastAPI / Pydantic error payloads.
 */
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (!data) {
      if (error.message === 'Network Error') {
        return 'Unable to connect to SRM-AP backend services. Please check network connectivity.';
      }
      return error.message || 'An unexpected network error occurred.';
    }

    // Single message string
    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (data.message) {
      return data.message;
    }

    // Pydantic validation error array
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const firstError = data.detail[0];
      const field = firstError.loc ? firstError.loc[firstError.loc.length - 1] : 'field';
      return `${String(field)}: ${firstError.msg}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred while communicating with the server.';
}
