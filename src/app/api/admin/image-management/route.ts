import { NextRequest, NextResponse } from "next/server";
import { imageBackupManager } from "@/lib/imageBackup";

/**
 * Image Management API
 * Provides endpoints for image backup, restore, and cache management
 * Only accessible by admin users
 */

export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll allow access for development
    
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list-backups':
        const backups = await imageBackupManager.listBackups();
        return NextResponse.json({
          success: true,
          data: backups
        });

      case 'backup-info':
        const backupId = searchParams.get('backupId');
        if (!backupId) {
          return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
        }
        
        const backups_list = await imageBackupManager.listBackups();
        const backup = backups_list.find(b => b.id === backupId);
        
        if (!backup) {
          return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          data: backup
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Image management GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    
    const body = await req.json();
    const { action, backupId, description } = body;

    switch (action) {
      case 'create-backup':
        const backup = await imageBackupManager.createBackup(description);
        return NextResponse.json({
          success: true,
          message: 'Backup created successfully',
          data: backup
        });

      case 'restore-backup':
        if (!backupId) {
          return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
        }
        
        await imageBackupManager.restoreBackup(backupId);
        return NextResponse.json({
          success: true,
          message: 'Backup restored successfully'
        });

      case 'delete-backup':
        if (!backupId) {
          return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
        }
        
        await imageBackupManager.deleteBackup(backupId);
        return NextResponse.json({
          success: true,
          message: 'Backup deleted successfully'
        });

      case 'clear-cache':
        await imageBackupManager.clearImageCache();
        return NextResponse.json({
          success: true,
          message: 'Image cache cleared successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Image management POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
