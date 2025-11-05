import connectDB from '../lib/mongodb';
import User from '../models/User';
import { hashPassword } from '../lib/passwordUtils';

/**
 * Migration script to convert plain-text passwords to hashed passwords
 * This script should be run once to migrate existing users
 * 
 * IMPORTANT: After running this script, all users will need to reset their passwords
 * because the old 4-6 digit passwords don't meet the new security requirements
 */

async function migratePasswords() {
  try {
    console.log('🔄 Starting password migration...');
    await connectDB();
    
    // Find all users with plain-text passwords
    const usersWithPlainTextPasswords = await User.find({
      passwordHash: { $exists: false },
      password: { $exists: true }
    });
    
    console.log(`📊 Found ${usersWithPlainTextPasswords.length} users with plain-text passwords`);
    
    if (usersWithPlainTextPasswords.length === 0) {
      console.log('✅ No users need migration. All passwords are already hashed.');
      return;
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithPlainTextPasswords) {
      try {
        console.log(`🔄 Migrating user: ${user.fullName} (${user.phone})`);
        
        // Hash the existing password (even though it's weak)
        const passwordHash = await hashPassword((user as any).password);
        
        // Update user with hashed password and mark for password change
        await User.findByIdAndUpdate(user._id, {
          passwordHash,
          passwordChangedAt: new Date(),
          'security.mustChangePassword': true,
          $unset: { password: 1 } // Remove the plain-text password field
        });
        
        migratedCount++;
        console.log(`✅ Migrated user: ${user.fullName}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating user ${user.fullName}:`, error);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📝 Total processed: ${usersWithPlainTextPasswords.length} users`);
    
    if (migratedCount > 0) {
      console.log('\n⚠️  IMPORTANT NOTES:');
      console.log('1. All migrated users have been marked with mustChangePassword=true');
      console.log('2. Users will be forced to reset their passwords on next login');
      console.log('3. The old 4-6 digit passwords do not meet new security requirements');
      console.log('4. Users should use the password reset flow to set strong passwords');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback function to restore plain-text passwords (for emergency use only)
 * WARNING: This is insecure and should only be used in extreme emergencies
 */
async function rollbackMigration() {
  try {
    console.log('⚠️  WARNING: Starting password migration rollback...');
    console.log('⚠️  This will restore plain-text passwords and is INSECURE!');
    
    await connectDB();
    
    // Find users with hashed passwords
    const usersWithHashedPasswords = await User.find({
      passwordHash: { $exists: true }
    });
    
    console.log(`📊 Found ${usersWithHashedPasswords.length} users with hashed passwords`);
    
    if (usersWithHashedPasswords.length === 0) {
      console.log('✅ No users need rollback. No hashed passwords found.');
      return;
    }
    
    console.log('❌ Rollback not implemented for security reasons.');
    console.log('❌ If you need to rollback, you must restore from a database backup.');
    console.log('❌ Plain-text passwords should never be restored.');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    rollbackMigration()
      .then(() => {
        console.log('✅ Rollback completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
      });
  } else {
    migratePasswords()
      .then(() => {
        console.log('✅ Migration completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  }
}

export { migratePasswords, rollbackMigration };


