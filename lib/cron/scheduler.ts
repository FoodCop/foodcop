import * as cron from 'node-cron';
import { CronJob, CronJobConfig, CronJobExecution, CronStats } from './types';
import { CronLogger } from './logger';

export class CronScheduler {
  private static instance: CronScheduler;
  private jobs: Map<string, CronJob> = new Map();
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private executions: CronJobExecution[] = [];
  private logger: CronLogger;

  private constructor() {
    this.logger = CronLogger.getInstance();
  }

  public static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  public addJob(config: CronJobConfig): boolean {
    try {
      // Validate cron expression
      if (!cron.validate(config.schedule)) {
        this.logger.error(`Invalid cron schedule: ${config.schedule}`, config.id);
        return false;
      }

      const job: CronJob = {
        id: config.id,
        name: config.name,
        description: config.description,
        schedule: config.schedule,
        enabled: config.enabled,
        status: 'idle',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.jobs.set(config.id, job);

      if (config.enabled) {
        this.scheduleJob(config);
      }

      this.logger.info(`Job added: ${config.name}`, config.id);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add job: ${error}`, config.id);
      return false;
    }
  }

  public removeJob(jobId: string): boolean {
    try {
      const task = this.scheduledTasks.get(jobId);
      if (task) {
        task.destroy();
        this.scheduledTasks.delete(jobId);
      }

      this.jobs.delete(jobId);
      this.logger.info(`Job removed: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove job: ${error}`, jobId);
      return false;
    }
  }

  public updateJob(jobId: string, updates: Partial<Omit<CronJob, 'id' | 'createdAt'>>): boolean {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        this.logger.error(`Job not found: ${jobId}`);
        return false;
      }

      // If schedule changed, reschedule
      if (updates.schedule && updates.schedule !== job.schedule) {
        if (!cron.validate(updates.schedule)) {
          this.logger.error(`Invalid cron schedule: ${updates.schedule}`, jobId);
          return false;
        }

        const task = this.scheduledTasks.get(jobId);
        if (task) {
          task.destroy();
          this.scheduledTasks.delete(jobId);
        }
      }

      // Update job
      const updatedJob = { ...job, ...updates, updatedAt: new Date() };
      this.jobs.set(jobId, updatedJob);

      // Reschedule if enabled
      if (updatedJob.enabled) {
        // We need the handler function, but we don't store it in the job
        // This is a limitation of the current design
        this.logger.warn(`Job updated but handler not available for rescheduling: ${jobId}`);
      }

      this.logger.info(`Job updated: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update job: ${error}`, jobId);
      return false;
    }
  }

  public enableJob(jobId: string): boolean {
    return this.updateJob(jobId, { enabled: true });
  }

  public disableJob(jobId: string): boolean {
    return this.updateJob(jobId, { enabled: false });
  }

  public getJob(jobId: string): CronJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  public getStats(): CronStats {
    const jobs = Array.from(this.jobs.values());
    const executions = this.executions;

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.enabled).length,
      disabledJobs: jobs.filter(job => !job.enabled).length,
      runningJobs: jobs.filter(job => job.status === 'running').length,
      lastExecution: executions.length > 0 ? executions[executions.length - 1].startTime : undefined,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(exec => exec.status === 'completed').length,
      failedExecutions: executions.filter(exec => exec.status === 'failed').length
    };
  }

  public getJobExecutions(jobId: string): CronJobExecution[] {
    return this.executions.filter(exec => exec.jobId === jobId);
  }

  private scheduleJob(config: CronJobConfig): void {
    try {
      const task = cron.schedule(config.schedule, async () => {
        await this.executeJob(config);
      }, {
        timezone: process.env.TZ || 'UTC'
      });

      this.scheduledTasks.set(config.id, task);
      task.start();

      this.logger.info(`Job scheduled: ${config.name}`, config.id);
    } catch (error) {
      this.logger.error(`Failed to schedule job: ${error}`, config.id);
    }
  }

  private async executeJob(config: CronJobConfig): Promise<void> {
    const job = this.jobs.get(config.id);
    if (!job || !job.enabled) {
      return;
    }

    const execution: CronJobExecution = {
      jobId: config.id,
      startTime: new Date(),
      status: 'running'
    };

    this.executions.push(execution);

    // Update job status
    this.updateJob(config.id, { status: 'running' });

    try {
      this.logger.info(`Starting job execution: ${config.name}`, config.id);
      await config.handler();

      execution.endTime = new Date();
      execution.status = 'completed';
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      this.updateJob(config.id, { 
        status: 'idle', 
        lastRun: execution.startTime,
        nextRun: this.getNextRunTime(job.schedule)
      });

      this.logger.info(`Job completed successfully: ${config.name}`, config.id, {
        duration: execution.duration
      });

      if (config.onSuccess) {
        config.onSuccess(job);
      }
    } catch (error) {
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      this.updateJob(config.id, { 
        status: 'error', 
        error: execution.error,
        lastRun: execution.startTime
      });

      this.logger.error(`Job failed: ${config.name}`, config.id, {
        error: execution.error,
        duration: execution.duration
      });

      if (config.onError) {
        config.onError(job, error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Keep only last 1000 executions to prevent memory issues
    if (this.executions.length > 1000) {
      this.executions = this.executions.slice(-1000);
    }
  }

  private getNextRunTime(schedule: string): Date | undefined {
    try {
      const parser = require('cron-parser');
      const interval = parser.parseExpression(schedule);
      return interval.next().toDate();
    } catch (error) {
      this.logger.error(`Failed to calculate next run time: ${error}`);
      return undefined;
    }
  }

  public start(): void {
    this.logger.info('Cron scheduler started');
  }

  public stop(): void {
    this.scheduledTasks.forEach((task, jobId) => {
      task.destroy();
      this.logger.info(`Stopped job: ${jobId}`);
    });
    this.scheduledTasks.clear();
    this.logger.info('Cron scheduler stopped');
  }
}

