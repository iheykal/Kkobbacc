require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
}

// User schema (simplified version)
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    fullName: String,
    role: String,
});

const User = mongoose.model('User', userSchema);

async function resetSuperadminPassword() {
    try {
        console.log('🔐 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Prompt for email
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question('Enter superadmin email: ', async (email) => {
            readline.question('Enter new password: ', async (newPassword) => {
                try {
                    // Find the superadmin user
                    const user = await User.findOne({ email: email.trim(), role: 'superadmin' });

                    if (!user) {
                        console.error('\n❌ Superadmin user not found with email:', email);
                        console.log('\n📋 Available superadmin accounts:');
                        const superadmins = await User.find({ role: 'superadmin' }, 'email fullName');
                        if (superadmins.length > 0) {
                            superadmins.forEach(admin => {
                                console.log(`  - ${admin.email} (${admin.fullName})`);
                            });
                        } else {
                            console.log('  No superadmin accounts found!');
                        }
                        process.exit(1);
                    }

                    console.log('\n✅ Found superadmin:', user.fullName);

                    // Hash the new password
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = await bcrypt.hash(newPassword, 10);

                    // Update the password
                    user.password = hashedPassword;
                    await user.save();

                    console.log('\n🎉 Password reset successfully!');
                    console.log('✅ You can now login with:');
                    console.log(`   Email: ${email}`);
                    console.log(`   Password: ${newPassword}`);

                    process.exit(0);
                } catch (error) {
                    console.error('\n❌ Error:', error.message);
                    process.exit(1);
                } finally {
                    readline.close();
                }
            });
        });

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
}

resetSuperadminPassword();
