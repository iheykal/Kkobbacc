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

async function restoreExpiredProperties() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define minimal Schema
        const PropertySchema = new mongoose.Schema({
            expiresAt: Date,
            isExpired: Boolean,
            deletionStatus: String,
            title: String
        }, { strict: false });

        // Explicitly point to the existing collection 'properties' (Mongoose usually pluralizes 'Property' to 'properties')
        const Property = mongoose.model('Property', PropertySchema);

        const now = new Date();
        const futureDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now

        console.log(`Current Time: ${now.toISOString()}`);
        console.log(`New Expiry Date: ${futureDate.toISOString()}`);

        // Find expired properties
        const query = {
            $or: [
                { expiresAt: { $lt: now } },
                { isExpired: true }
            ]
        };

        const count = await Property.countDocuments(query);
        console.log(`🔍 Found ${count} expired properties.`);

        if (count > 0) {
            const result = await Property.updateMany(query, {
                $set: {
                    expiresAt: futureDate,
                    isExpired: false,
                    deletionStatus: 'active'
                }
            });

            console.log(`✅ Successfully restored ${result.modifiedCount} properties.`);
            console.log(`📅 New Expiration Date: ${futureDate.toDateString()}`);
        } else {
            console.log('✨ No expired properties found to restore.');
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

restoreExpiredProperties();
