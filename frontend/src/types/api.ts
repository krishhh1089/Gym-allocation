/**
 * GymSlot API & Domain Types
 * Matching FastAPI Gateway & SRM-AP Identity Contracts
 */

export type UserRole = 'STUDENT' | 'STAFF' | 'TRAINER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  ap_number?: string;
  department?: string;
  batch?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  is_first_login?: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  success: false;
  detail?: string | ApiValidationErrorDetail[];
  message?: string;
  status_code?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
