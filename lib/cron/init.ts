import { CronScheduler } from './scheduler';
import { foodCopJobs } from './jobs/foodcop-jobs';
import { CronLogger } from './logger';

let isInitialized = false;

export async function initializeCronJobs(): Promise<void> {
  if (isInitialized) {
    console.log('CRON jobs already initialized');
    return;
  }

  const scheduler = CronScheduler.getInstance();
  const logger = CronLogger.getInstance();

  try {
    logger.info('Initializing CRON jobs...');

    // Add all FoodCop jobs
    for (const jobConfig of foodCopJobs) {
      const success = scheduler.addJob(jobConfig);
      if (success) {
        logger.info(`Added job: ${jobConfig.name}`, jobConfig.id);
      } else {
        logger.error(`Failed to add job: ${jobConfig.name}`, jobConfig.id);
      }
    }

    // Start the scheduler
    scheduler.start();

    isInitialized = true;
    logger.info('CRON jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize CRON jobs', undefined, error);
    throw error;
  }
}

export function getCronScheduler(): CronScheduler {
  return CronScheduler.getInstance();
}

export function getCronLogger(): CronLogger {
  return CronLogger.getInstance();
}

// Graceful shutdown
export function shutdownCronJobs(): void {
  if (isInitialized) {
    const scheduler = CronScheduler.getInstance();
    const logger = CronLogger.getInstance();
    
    logger.info('Shutting down CRON jobs...');
    scheduler.stop();
    logger.info('CRON jobs shut down successfully');
    
    isInitialized = false;
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down CRON jobs...');
    shutdownCronJobs();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down CRON jobs...');
    shutdownCronJobs();
    process.exit(0);
  });
}

