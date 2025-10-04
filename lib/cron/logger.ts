import { CronJob, CronJobExecution } from './types';

export class CronLogger {
  private static instance: CronLogger;
  private logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    jobId?: string;
    data?: any;
  }> = [];

  private constructor() {}

  public static getInstance(): CronLogger {
    if (!CronLogger.instance) {
      CronLogger.instance = new CronLogger();
    }
    return CronLogger.instance;
  }

  public info(message: string, jobId?: string, data?: any): void {
    this.log('info', message, jobId, data);
  }

  public warn(message: string, jobId?: string, data?: any): void {
    this.log('warn', message, jobId, data);
  }

  public error(message: string, jobId?: string, data?: any): void {
    this.log('error', message, jobId, data);
  }

  public debug(message: string, jobId?: string, data?: any): void {
    this.log('debug', message, jobId, data);
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, jobId?: string, data?: any): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      jobId,
      data
    };

    this.logs.push(logEntry);

    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const prefix = jobId ? `[CRON:${jobId}]` : '[CRON]';
      console[level](`${prefix} ${message}`, data || '');
    }
  }

  public getLogs(jobId?: string, limit: number = 100): Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    jobId?: string;
    data?: any;
  }> {
    let filteredLogs = this.logs;
    
    if (jobId) {
      filteredLogs = this.logs.filter(log => log.jobId === jobId);
    }

    return filteredLogs.slice(-limit);
  }

  public getJobExecutionLogs(jobId: string): CronJobExecution[] {
    // This would typically be stored in a database
    // For now, we'll return a mock implementation
    return [];
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

