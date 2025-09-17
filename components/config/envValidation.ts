/**
 * Environment Variable Validation
 * 
 * This file validates critical environment variables at application startup
 * and provides helpful error messages for missing configuration.
 */

import { getEnvVar, hasEnvVar } from '../utils/envUtils.basic';

export interface EnvironmentStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    googleMapsConfigured: boolean;
    streamChatConfigured: boolean;
    hasBasicConfig: boolean;
  };
}

/**
 * Validate the current environment configuration
 * @param strict - If true, throws on missing required variables
 * @returns EnvironmentStatus object with validation results
 */
export const validateEnvironment = (strict: boolean = false): EnvironmentStatus => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for Google Maps API configuration
  const googleMapsConfigured = hasEnvVar('VITE_GOOGLE_MAPS_API_KEY');
  if (!googleMapsConfigured) {
    warnings.push(
      'Google Maps API key not configured. Location features will use mock data. ' +
      'Set VITE_GOOGLE_MAPS_API_KEY in your .env file to enable real Google Maps integration.'
    );
  }

  // Check for Stream Chat API configuration
  const streamChatConfigured = hasEnvVar('VITE_STREAM_CHAT_API_KEY');
  if (!streamChatConfigured) {
    warnings.push(
      'Stream Chat API key not configured. Chat features will use mock data. ' +
      'Set VITE_STREAM_CHAT_API_KEY in your .env file to enable real-time messaging.'
    );
  }

  // Check for basic app configuration
  const hasBasicConfig = true; // All basic config has defaults

  // Validate API key formats if they exist
  if (googleMapsConfigured) {
    const googleKey = getEnvVar('VITE_GOOGLE_MAPS_API_KEY');
    if (!googleKey.startsWith('AIza') && googleKey !== 'YOUR_GOOGLE_API_KEY_HERE') {
      errors.push(
        'Invalid Google Maps API key format. Google API keys should start with "AIza".'
      );
    }
    if (googleKey === 'YOUR_GOOGLE_API_KEY_HERE') {
      warnings.push(
        'Google Maps API key is set to placeholder value. Please replace with your actual API key.'
      );
    }
  }

  if (streamChatConfigured) {
    const streamKey = getEnvVar('VITE_STREAM_CHAT_API_KEY');
    if (streamKey === 'YOUR_STREAM_CHAT_API_KEY_HERE') {
      warnings.push(
        'Stream Chat API key is set to placeholder value. Please replace with your actual API key.'
      );
    }
  }

  // Check for development environment - simplified logging
  const isDevelopment = getEnvVar('NODE_ENV', 'development') === 'development';

  const status: EnvironmentStatus = {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      googleMapsConfigured,
      streamChatConfigured,
      hasBasicConfig
    }
  };

  // Handle strict mode
  if (strict && !status.isValid) {
    throw new Error(
      `Environment validation failed:\n${errors.join('\n')}`
    );
  }

  return status;
};

/**
 * Log environment status to console
 * @param status - Environment status object
 */
export const logEnvironmentStatus = (status: EnvironmentStatus): void => {
  console.group('🚀 FUZO Environment Status');
  
  // Log summary
  console.log('📊 Configuration Summary:');
  console.log(`  Google Maps: ${status.summary.googleMapsConfigured ? '✅' : '⚠️'} ${status.summary.googleMapsConfigured ? 'Configured' : 'Not configured'}`);
  console.log(`  Stream Chat: ${status.summary.streamChatConfigured ? '✅' : '⚠️'} ${status.summary.streamChatConfigured ? 'Configured' : 'Not configured'}`);
  console.log(`  Basic Config: ${status.summary.hasBasicConfig ? '✅' : '❌'} ${status.summary.hasBasicConfig ? 'Valid' : 'Invalid'}`);
  
  // Log errors
  if (status.errors.length > 0) {
    console.group('❌ Errors:');
    status.errors.forEach(error => console.error(error));
    console.groupEnd();
  }
  
  // Log warnings
  if (status.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    status.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  // Overall status
  console.log(`\n🎯 Overall Status: ${status.isValid ? '✅ Valid' : '❌ Issues detected'}`);
  
  if (!status.summary.googleMapsConfigured || !status.summary.streamChatConfigured) {
    console.log('\n💡 To set up missing services:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Follow ENVIRONMENT_SETUP.md for detailed instructions');
    console.log('   3. Use the Environment Setup page in the app for guided setup');
  }
  
  console.groupEnd();
};

/**
 * Initialize environment validation (call this at app startup)
 * @param options - Configuration options
 */
export const initializeEnvironment = (options: {
  logStatus?: boolean;
  strict?: boolean;
} = {}): EnvironmentStatus => {
  const { logStatus = true, strict = false } = options;
  
  try {
    const status = validateEnvironment(strict);
    
    if (logStatus) {
      logEnvironmentStatus(status);
    }
    
    return status;
  } catch (error) {
    console.error('🚨 Environment initialization failed:', error);
    throw error;
  }
};

/**
 * Get helpful setup guidance based on current configuration
 * @returns Array of setup steps
 */
export const getSetupGuidance = (): string[] => {
  const guidance: string[] = [];
  
  if (!hasEnvVar('VITE_GOOGLE_MAPS_API_KEY')) {
    guidance.push(
      '🗺️ Set up Google Maps API:',
      '   • Go to Google Cloud Console',
      '   • Enable Maps JavaScript API and Places API',
      '   • Create an API key with proper restrictions',
      '   • Add VITE_GOOGLE_MAPS_API_KEY to your .env file'
    );
  }
  
  if (!hasEnvVar('VITE_STREAM_CHAT_API_KEY')) {
    guidance.push(
      '💬 Set up Stream Chat API:',
      '   • Go to GetStream.io',
      '   • Create a free chat application',
      '   • Get your API key',
      '   • Add VITE_STREAM_CHAT_API_KEY to your .env file'
    );
  }
  
  if (guidance.length === 0) {
    guidance.push('✅ All main services are configured!');
  }
  
  return guidance;
};