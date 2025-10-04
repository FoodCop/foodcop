# CRON Operations Setup for FoodCop

This document describes the CRON operations system implemented for the FoodCop project, allowing for scheduled tasks and automated operations.

## Overview

The CRON system provides:
- **Job Scheduling**: Schedule tasks using standard cron expressions
- **Job Management**: Add, remove, enable/disable jobs via API
- **Monitoring**: Real-time job status and execution history
- **Logging**: Comprehensive logging with different levels
- **Health Checks**: Automated system health monitoring
- **FoodCop Integration**: Pre-configured jobs for FoodCop features

## Architecture

```
lib/cron/
├── types.ts          # TypeScript interfaces
├── logger.ts         # Logging system
├── scheduler.ts      # Core scheduler implementation
├── config.ts         # Configuration management
├── init.ts           # Initialization and lifecycle
├── index.ts          # Public exports
└── jobs/
    └── foodcop-jobs.ts  # FoodCop-specific jobs
```

## API Endpoints

### Job Management
- `GET /api/cron/jobs` - List all jobs and stats
- `POST /api/cron/jobs` - Add new job
- `GET /api/cron/jobs/[jobId]` - Get specific job details
- `PUT /api/cron/jobs/[jobId]` - Update job
- `DELETE /api/cron/jobs/[jobId]` - Remove job
- `POST /api/cron/jobs/[jobId]/enable` - Enable job
- `POST /api/cron/jobs/[jobId]/disable` - Disable job

### Monitoring
- `GET /api/cron/stats` - Get system statistics
- `GET /api/cron/logs` - Get execution logs
- `DELETE /api/cron/logs` - Clear logs

### Initialization
- `POST /api/cron/init` - Initialize all CRON jobs

## Pre-configured FoodCop Jobs

### 1. Cleanup Expired Sessions
- **Schedule**: `0 2 * * *` (Daily at 2 AM)
- **Purpose**: Remove expired user sessions and temporary data
- **Function**: Cleans up sessions older than 30 days

### 2. Update Place Cache
- **Schedule**: `0 */6 * * *` (Every 6 hours)
- **Purpose**: Refresh cached place data from Google Places API
- **Function**: Updates stale place cache entries

### 3. Generate Daily Feed
- **Schedule**: `0 6 * * *` (Daily at 6 AM)
- **Purpose**: Generate personalized feed content for all active users
- **Function**: Creates daily feed content for each user

### 4. Cleanup Uploaded Images
- **Schedule**: `0 3 * * *` (Daily at 3 AM)
- **Purpose**: Remove orphaned and temporary uploaded images
- **Function**: Deletes images older than 7 days not associated with content

### 5. Update Master Bot Posts
- **Schedule**: `0 */4 * * *` (Every 4 hours)
- **Purpose**: Generate new content from master bot prompts
- **Function**: Creates new posts based on active prompts

### 6. Health Check
- **Schedule**: `*/15 * * * *` (Every 15 minutes)
- **Purpose**: Monitor system health and send alerts
- **Function**: Checks database connectivity and system status

## Environment Configuration

Add these variables to your `.env.local`:

```env
# CRON Configuration
CRON_TIMEZONE="UTC"
CRON_MAX_CONCURRENT_JOBS="10"
CRON_LOG_RETENTION_DAYS="30"
CRON_EXECUTION_RETENTION_DAYS="7"
CRON_ENABLE_HEALTH_CHECKS="true"
CRON_HEALTH_CHECK_INTERVAL="15"
```

## Usage

### 1. Initialize CRON Jobs

```typescript
import { initializeCronJobs } from '@/lib/cron/init';

// Initialize all CRON jobs
await initializeCronJobs();
```

### 2. Add Custom Job

```typescript
import { CronScheduler } from '@/lib/cron';

const scheduler = CronScheduler.getInstance();

const jobConfig = {
  id: 'my-custom-job',
  name: 'My Custom Job',
  description: 'Does something useful',
  schedule: '0 9 * * *', // Daily at 9 AM
  enabled: true,
  handler: async () => {
    // Your job logic here
    console.log('Custom job executed!');
  }
};

scheduler.addJob(jobConfig);
```

### 3. Monitor Jobs

```typescript
// Get all jobs
const jobs = scheduler.getAllJobs();

// Get job statistics
const stats = scheduler.getStats();

// Get specific job
const job = scheduler.getJob('my-custom-job');
```

## Debug Interface

Visit `/cron-debug` to access the CRON management interface where you can:
- View all jobs and their status
- Enable/disable jobs
- Monitor execution logs
- View system statistics
- Initialize CRON jobs

## Cron Expression Examples

- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 1 * *` - First day of every month at midnight

## Error Handling

The system includes comprehensive error handling:
- Job execution errors are logged and tracked
- Failed jobs can be retried
- System health is continuously monitored
- Graceful shutdown on process termination

## Production Considerations

1. **Memory Management**: Logs and executions are automatically pruned to prevent memory issues
2. **Concurrency**: Configurable maximum concurrent job execution
3. **Timezone Support**: Full timezone support for job scheduling
4. **Graceful Shutdown**: Proper cleanup on application termination
5. **Health Monitoring**: Built-in health checks and alerting

## Dependencies

- `node-cron`: Core scheduling functionality
- `cron-parser`: Cron expression parsing and validation
- `@types/node-cron`: TypeScript definitions

## Next Steps

1. Set up your environment variables
2. Initialize CRON jobs using the API or debug interface
3. Monitor job execution through the debug interface
4. Customize jobs based on your specific needs
5. Set up production monitoring and alerting

The CRON system is now ready to handle all your scheduled operations for FoodCop!

