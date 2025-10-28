import type { ApiError, RetryOptions, ServiceResponse } from '../types/common';

/**
 * Error handling utilities for Vite application services
 */
export class ErrorHandler {
  /**
   * Execute an operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      exponentialBackoff = true
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);

        // Don't retry on authentication errors or validation errors
        if (this.isNonRetryableError(error as Error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = exponentialBackoff 
            ? delayMs * Math.pow(2, attempt - 1)
            : delayMs;
          
          console.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Handle API errors with appropriate user-friendly messages
   */
  static handleApiError(error: unknown): never {
    const apiError = this.normalizeError(error);

    // Handle specific error types
    if (apiError.message?.includes('User not authenticated') || 
        apiError.message?.includes('Authentication required') ||
        apiError.code === '401') {
      console.warn('Authentication required, redirecting to login');
      // In a real app, you might want to use your router here
      // window.location.href = '/auth';
      throw new Error('Please sign in to continue');
    }

    if (apiError.message?.includes('Network') || 
        apiError.message?.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    if (apiError.message?.includes('Quota') || 
        apiError.message?.includes('rate limit')) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    }

    // Log the original error for debugging
    console.error('API Error:', apiError);
    
    // Return user-friendly message
    throw new Error(apiError.message || 'An unexpected error occurred. Please try again.');
  }

  /**
   * Wrap service operations with consistent error handling
   */
  static async wrapServiceCall<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await operation();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      const normalizedError = this.normalizeError(error);
      
      return {
        success: false,
        error: normalizedError.message,
        message: `Failed to ${context.toLowerCase()}`
      };
    }
  }

  /**
   * Validate required fields and throw descriptive errors
   */
  static validateRequired(
    data: Record<string, unknown>, 
    requiredFields: string[],
    context: string = 'operation'
  ): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields for ${context}: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Check if error should not be retried
   */
  private static isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const nonRetryableKeywords = [
      'authentication',
      'unauthorized',
      'forbidden',
      'validation',
      'missing required',
      'invalid',
      'malformed'
    ];

    return nonRetryableKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Normalize different error types to a consistent format
   */
  private static normalizeError(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: (error as Error & { code?: string }).code,
        status: (error as Error & { status?: number }).status
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      return {
        message: (errorObj.message as string) || 'Unknown error',
        code: errorObj.code as string,
        status: errorObj.status as number,
        details: errorObj
      };
    }

    return { message: 'An unknown error occurred' };
  }

  /**
   * Simple delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a timeout wrapper for operations
   */
  static withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  }

  /**
   * Log errors with structured format
   */
  static logError(
    error: unknown, 
    context: string, 
    additionalData?: Record<string, unknown>
  ): void {
    const normalizedError = this.normalizeError(error);
    
    console.error('Service Error:', {
      context,
      error: normalizedError,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }
}