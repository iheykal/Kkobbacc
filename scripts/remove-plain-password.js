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
            console.error(`❌ Could not find module '${moduleName}'.`);
            process.exit(1);
        }
    }
}

const mongoose = requireFromRoot('mongoose');

// Manually parse .env
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('❌ Could not read .env file');
        process.exit(1);
    }
}

const env = loadEnv();
const MONGODB_URI = env.MONGODB_URI;

// User Schema
const userSchema = new mongoose.Schema({
    phone: String,
    passwordHash: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function removePlainPassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const normalizedPhone = '+252610251014';

        // Find user
        const user = await User.findOne({ phone: normalizedPhone });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        const doc = user.toObject();

        if (doc.password !== undefined && doc.password !== null) {
            console.log('⚠️ Found PLAIN PASSWORD field:', doc.password);
            console.log('Removing it to force usage of passwordHash...');

            await User.updateOne(
                { _id: user._id },
                { $unset: { password: "" } }
            );
            console.log('✅ Successfully removed plain password field.');
        } else {
            console.log('✅ No plain password field found. (This is good)');
        }

        // Double check
        const refreshed = await User.findOne({ phone: normalizedPhone });
        const refreshedDoc = refreshed.toObject();
        if (refreshedDoc.password) {
            console.error('❌ Failed to remove password field? Still exists:', refreshedDoc.password);
        } else {
            console.log('🎉 Verified: Plain password is GONE.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        console.log('👋 Done');
    }
}

removePlainPassword();
