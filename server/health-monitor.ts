import { db } from './db';
import { config } from './config';
import fs from 'fs/promises';
import path from 'path';

export interface HealthStatus {
  database: {
    connected: boolean;
    responseTime: number;
    error?: string;
  };
  storage: {
    uploadsWritable: boolean;
    backupsWritable: boolean;
    diskSpace: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  lastCheck: Date;
}

export class HealthMonitor {
  private lastHealthCheck: HealthStatus | null = null;

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    const health: HealthStatus = {
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
      system: this.checkSystem(),
      lastCheck: new Date(),
    };

    this.lastHealthCheck = health;
    return health;
  }

  private async checkDatabase(): Promise<HealthStatus['database']> {
    try {
      const startTime = Date.now();
      await db.execute('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        responseTime,
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private async checkStorage(): Promise<HealthStatus['storage']> {
    const uploadsWritable = await this.checkDirectoryWritable(config.uploads.directory);
    const backupsWritable = await this.checkDirectoryWritable(config.backup.directory);
    const diskSpace = await this.getDiskSpace();

    return {
      uploadsWritable,
      backupsWritable,
      diskSpace,
    };
  }

  private async checkDirectoryWritable(directory: string): Promise<boolean> {
    try {
      await fs.access(directory, fs.constants.W_OK);
      const testFile = path.join(directory, '.health-check');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private async getDiskSpace(): Promise<HealthStatus['storage']['diskSpace']> {
    try {
      const stats = await fs.statfs('.');
      const blockSize = stats.bavail || stats.bsize || 4096;
      const total = stats.blocks * blockSize;
      const free = stats.bavail * blockSize;
      const used = total - free;
      const percentage = Math.round((used / total) * 100);

      return {
        total: Math.round(total / (1024 * 1024 * 1024)), // GB
        free: Math.round(free / (1024 * 1024 * 1024)), // GB
        used: Math.round(used / (1024 * 1024 * 1024)), // GB
        percentage,
      };
    } catch {
      return {
        total: 0,
        free: 0,
        used: 0,
        percentage: 0,
      };
    }
  }

  private checkSystem(): HealthStatus['system'] {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    return {
      uptime,
      memory: {
        used: Math.round(usedMemory / (1024 * 1024)), // MB
        total: Math.round(totalMemory / (1024 * 1024)), // MB
        percentage: memoryPercentage,
      },
    };
  }

  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }

  isHealthy(): boolean {
    if (!this.lastHealthCheck) return false;

    const { database, storage } = this.lastHealthCheck;

    return (
      database.connected &&
      storage.uploadsWritable &&
      storage.backupsWritable &&
      storage.diskSpace.percentage < 90 // Alert if disk usage > 90%
    );
  }
}

export const healthMonitor = new HealthMonitor();