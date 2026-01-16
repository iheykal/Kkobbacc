const path = require('path');
const fs = require('fs');

// Helper to load modules from root node_modules
function requireFromRoot(moduleName) {
    try {
        return require(moduleName);
    } catch (e) {
        try {
            const rootPath = path.join(process.cwd(), 'node_modules', moduleName);
            return require(rootPath);
        } catch (e2) {
            console.error(`❌ Could not find module '${moduleName}'. Please run 'npm install' in the root directory.`);
            process.exit(1);
        }
    }
}

const mongoose = requireFromRoot('mongoose');
const bcrypt = requireFromRoot('bcryptjs');

// Manually parse .env
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env file not found at:', envPath);
            process.exit(1);
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('❌ Could not read .env file:', e.message);
        process.exit(1);
    }
}

const env = loadEnv();
const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Minimal User Schema
const userSchema = new mongoose.Schema({
    phone: String,
    passwordHash: String,
    role: String,
    fullName: String,
    status: String,
    permissions: Object,
    authProvider: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const rawPhone = '610251014';
        // Normalize phone to +252 format as per app logic
        const normalizedPhone = '+252' + rawPhone;
        const plainPassword = 'haykaloow';

        // Hash the password with bcryptjs (matches app logic)
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(plainPassword, salt);

        // Try finding by normalized phone first, then other formats to clean up if needed
        let user = await User.findOne({ phone: normalizedPhone });

        // Check if user exists with raw phone and update them
        if (!user) {
            const rawUser = await User.findOne({ phone: rawPhone });
            if (rawUser) {
                console.log('Found user with raw phone, upgrading to normalized format...');
                user = rawUser;
                user.phone = normalizedPhone;
            }
        }

        const updates = {
            passwordHash: passwordHash,
            role: 'superadmin',
            status: 'active',
            authProvider: 'local', // Ensure local auth is set so password login works
            permissions: {
                canManageUsers: true,
                canManageProperties: true,
                canManageAgents: true,
                canViewAnalytics: true,
                canManageSettings: true,
                canApproveProperties: true,
                canDeleteProperties: true,
                canManageRoles: true
            }
        };

        if (user) {
            console.log(`👤 Found existing user: ${user.fullName} (${user.phone})`);
            Object.assign(user, updates);
            await user.save();
            console.log('✅ Updated user to SUPERADMIN');
        } else {
            console.log(`👤 User not found. Creating new SUPERADMIN account...`);

            const newUser = new User({
                fullName: 'Super Admin',
                phone: normalizedPhone,
                ...updates
            });
            await newUser.save();
            console.log('✅ Created new SUPERADMIN user');
        }

        console.log(`
🎉 ACCOUNT READY
------------------
Phone:    ${rawPhone} (Stored as ${normalizedPhone})
Password: ${plainPassword}
Role:     superadmin
------------------
You can now log in!
`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        console.log('👋 Done');
    }
}

createSuperAdmin();
