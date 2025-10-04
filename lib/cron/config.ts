export interface CronConfig {
  timezone: string;
  maxConcurrentJobs: number;
  logRetentionDays: number;
  executionRetentionDays: number;
  enableHealthChecks: boolean;
  healthCheckInterval: number; // in minutes
}

export const defaultCronConfig: CronConfig = {
  timezone: process.env.TZ || 'UTC',
  maxConcurrentJobs: 10,
  logRetentionDays: 30,
  executionRetentionDays: 7,
  enableHealthChecks: true,
  healthCheckInterval: 15
};

export function getCronConfig(): CronConfig {
  return {
    timezone: process.env.CRON_TIMEZONE || defaultCronConfig.timezone,
    maxConcurrentJobs: parseInt(process.env.CRON_MAX_CONCURRENT_JOBS || '10'),
    logRetentionDays: parseInt(process.env.CRON_LOG_RETENTION_DAYS || '30'),
    executionRetentionDays: parseInt(process.env.CRON_EXECUTION_RETENTION_DAYS || '7'),
    enableHealthChecks: process.env.CRON_ENABLE_HEALTH_CHECKS === 'true',
    healthCheckInterval: parseInt(process.env.CRON_HEALTH_CHECK_INTERVAL || '15')
  };
}

