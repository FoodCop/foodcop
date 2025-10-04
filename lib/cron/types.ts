export interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error' | 'disabled';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CronJobConfig {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  handler: () => Promise<void>;
  onSuccess?: (job: CronJob) => void;
  onError?: (job: CronJob, error: Error) => void;
}

export interface CronJobExecution {
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  duration?: number;
}

export interface CronStats {
  totalJobs: number;
  activeJobs: number;
  disabledJobs: number;
  runningJobs: number;
  lastExecution?: Date;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}

