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
const bcrypt = requireFromRoot('bcryptjs');

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
    role: String,
    fullName: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function testLogin() {
    try {
        console.log('--- DEBUG LOGIN START ---');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const inputPhone = '610251014';
        const inputPassword = 'haykaloow';
        const normalizedPhone = '+252' + inputPhone;

        console.log(`Checking user with normalized phone: ${normalizedPhone}`);

        // 1. Find User
        let user = await User.findOne({ phone: normalizedPhone });
        if (!user) {
            console.log('❌ User not found with normalized phone.');
            user = await User.findOne({ phone: inputPhone }); // Check raw
            if (user) console.log('✅ Found with RAW phone (this might be the issue if login expects normalized)');
        } else {
            console.log('✅ User Found:', user.fullName, user.role);
        }

        if (!user) {
            console.log('❌ ABORT: User does not exist.');
            return;
        }

        // 2. Check Password Hash
        console.log('Stored Hash:', user.passwordHash ? user.passwordHash.substring(0, 10) + '...' : 'NONE');

        if (user.passwordHash) {
            console.log('Verifying bcrypt...');
            const match = await bcrypt.compare(inputPassword, user.passwordHash);
            console.log(`Bcrypt Result: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);

            if (!match) {
                console.log('Testing if hash is just plain text (legacy bug)...');
                if (user.passwordHash === inputPassword) console.log('⚠️ Hash IS plain text! (Security flaw)');
            }
        } else {
            console.log('⚠️ No passwordHash. Checking "password" field...');
            if (user.toObject().password === inputPassword) {
                console.log('✅ Matches PLAIN "password" field.');
            } else {
                console.log('❌ No match on plain password field.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        console.log('--- DEBUG LOGIN END ---');
    }
}

testLogin();
