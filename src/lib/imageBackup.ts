/**
 * Image Backup and Recovery System
 * Provides safe backup and recovery for images to prevent data loss during updates
 */

import { writeFile, readFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export interface BackupOptions {
  backupDir?: string;
  maxBackups?: number;
  compressBackups?: boolean;
}

export interface BackupInfo {
  id: string;
  timestamp: Date;
  fileCount: number;
  totalSize: number;
  description?: string;
}

export class ImageBackupManager {
  private backupDir: string;
  private maxBackups: number;
  private compressBackups: boolean;

  constructor(options: BackupOptions = {}) {
    this.backupDir = options.backupDir || join(process.cwd(), 'backups', 'images');
    this.maxBackups = options.maxBackups || 5;
    this.compressBackups = options.compressBackups || false;
  }

  /**
   * Create a backup of all images in the public directory
   */
  async createBackup(description?: string): Promise<BackupInfo> {
    const backupId = `backup-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
    const backupPath = join(this.backupDir, backupId);
    
    try {
      // Create backup directory
      await mkdir(backupPath, { recursive: true });

      let fileCount = 0;
      let totalSize = 0;

      // Backup public/icons directory
      const iconsPath = join(process.cwd(), 'public', 'icons');
      if (await this.directoryExists(iconsPath)) {
        const iconsBackupPath = join(backupPath, 'icons');
        await mkdir(iconsBackupPath, { recursive: true });
        
        const { count, size } = await this.copyDirectory(iconsPath, iconsBackupPath);
        fileCount += count;
        totalSize += size;
      }

      // Backup public/uploads directory
      const uploadsPath = join(process.cwd(), 'public', 'uploads');
      if (await this.directoryExists(uploadsPath)) {
        const uploadsBackupPath = join(backupPath, 'uploads');
        await mkdir(uploadsBackupPath, { recursive: true });
        
        const { count, size } = await this.copyDirectory(uploadsPath, uploadsBackupPath);
        fileCount += count;
        totalSize += size;
      }

      // Create backup metadata
      const backupInfo: BackupInfo = {
        id: backupId,
        timestamp: new Date(),
        fileCount,
        totalSize,
        description
      };

      await writeFile(
        join(backupPath, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );

      console.log(`✅ Backup created: ${backupId} (${fileCount} files, ${this.formatBytes(totalSize)})`);
      
      // Clean up old backups
      await this.cleanupOldBackups();

      return backupInfo;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore images from a backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backupPath = join(this.backupDir, backupId);
    
    try {
      // Check if backup exists
      if (!(await this.directoryExists(backupPath))) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Read backup info
      const backupInfoPath = join(backupPath, 'backup-info.json');
      const backupInfoData = await readFile(backupInfoPath, 'utf-8');
      const backupInfo: BackupInfo = JSON.parse(backupInfoData);

      console.log(`🔄 Restoring backup: ${backupId} (${backupInfo.fileCount} files)`);

      // Create a safety backup before restoring
      await this.createBackup(`Pre-restore backup for ${backupId}`);

      // Restore icons
      const iconsBackupPath = join(backupPath, 'icons');
      if (await this.directoryExists(iconsBackupPath)) {
        const iconsPath = join(process.cwd(), 'public', 'icons');
        await mkdir(iconsPath, { recursive: true });
        await this.copyDirectory(iconsBackupPath, iconsPath);
      }

      // Restore uploads
      const uploadsBackupPath = join(backupPath, 'uploads');
      if (await this.directoryExists(uploadsBackupPath)) {
        const uploadsPath = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsPath, { recursive: true });
        await this.copyDirectory(uploadsBackupPath, uploadsPath);
      }

      console.log(`✅ Backup restored successfully: ${backupId}`);
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw new Error(`Backup restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      if (!(await this.directoryExists(this.backupDir))) {
        return [];
      }

      const entries = await readdir(this.backupDir, { withFileTypes: true });
      const backupDirs = entries.filter(entry => entry.isDirectory() && entry.name.startsWith('backup-'));
      
      const backups: BackupInfo[] = [];

      for (const dir of backupDirs) {
        const backupPath = join(this.backupDir, dir.name);
        const backupInfoPath = join(backupPath, 'backup-info.json');
        
        try {
          const backupInfoData = await readFile(backupInfoPath, 'utf-8');
          const backupInfo: BackupInfo = JSON.parse(backupInfoData);
          backups.push(backupInfo);
        } catch (error) {
          console.warn(`⚠️  Could not read backup info for ${dir.name}`);
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = join(this.backupDir, backupId);
    
    try {
      if (!(await this.directoryExists(backupPath))) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Remove the backup directory
      const { rm } = await import('fs/promises');
      await rm(backupPath, { recursive: true, force: true });
      
      console.log(`✅ Backup deleted: ${backupId}`);
    } catch (error) {
      console.error('❌ Delete backup failed:', error);
      throw new Error(`Backup deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear Next.js image cache
   */
  async clearImageCache(): Promise<void> {
    try {
      const nextDir = join(process.cwd(), '.next');
      if (await this.directoryExists(nextDir)) {
        const { rm } = await import('fs/promises');
        await rm(nextDir, { recursive: true, force: true });
        console.log('✅ Next.js cache cleared');
      } else {
        console.log('ℹ️  No Next.js cache found to clear');
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw new Error(`Cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<{ count: number; size: number }> {
    let count = 0;
    let size = 0;

    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await mkdir(destPath, { recursive: true });
        const result = await this.copyDirectory(srcPath, destPath);
        count += result.count;
        size += result.size;
      } else {
        const fileContent = await readFile(srcPath);
        await writeFile(destPath, fileContent);
        count++;
        size += fileContent.length;
      }
    }

    return { count, size };
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
        
        console.log(`🧹 Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to cleanup old backups:', error);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const imageBackupManager = new ImageBackupManager();
