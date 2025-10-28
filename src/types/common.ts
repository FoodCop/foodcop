// Service response and error handling types
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IdempotencyKey {
  key: string;
  tenant_id: string;
  result: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export type ServiceResult<T> = Promise<ServiceResponse<T>>;

// Common database entity fields
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Tenant context for multi-tenancy
export interface TenantContext {
  tenant_id: string;
  user_id: string;
}