#!/usr/bin/env node

/**
 * Restore All Properties Script
 * 
 * This script removes the expired status from all properties that have been
 * marked as expired, making them visible again to users.
 * 
 * Usage:
 *   node scripts/restore-all-properties.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Property Schema (simplified for this script)
const PropertySchema = new mongoose.Schema({
  propertyId: Number,
  title: String,
  location: String,
  district: String,
  price: Number,
  beds: Number,
  baths: Number,
  sqft: Number,
  yearBuilt: Number,
  lotSize: Number,
  propertyType: String,
  status: String,
  listingType: String,
  measurement: String,
  description: String,
  features: [String],
  amenities: [String],
  thumbnailImage: String,
  images: [String],
  agentId: String,
  agent: {
    name: String,
    phone: String,
    image: String,
    rating: Number
  },
  featured: Boolean,
  viewCount: Number,
  uniqueViewCount: Number,
  deletionStatus: String,
  isExpired: Boolean,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const Property = mongoose.model('Property', PropertySchema);

async function restoreAllProperties() {
  try {
    console.log('🔧 Starting restoration of all properties...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all properties
    const allProperties = await Property.find({});
    console.log(`🔍 Found ${allProperties.length} total properties in database`);
    
    // Find all properties that are expired
    const expiredProperties = await Property.find({
      $or: [
        { isExpired: true },
        { expirationStatus: 'expired' }
      ]
    });
    console.log(`🔍 Found ${expiredProperties.length} expired properties`);
    
    if (expiredProperties.length === 0) {
      console.log('✅ No expired properties found to restore!');
      console.log('🔍 Checking all properties to ensure they are active...');
      
      // Still ensure all properties are not marked as expired
      const result = await Property.updateMany(
        {},
        {
          $set: {
            isExpired: false
          }
        }
      );
      
      console.log(`✅ Ensured ${result.modifiedCount} properties are marked as active`);
    } else {
      // Restore expired properties
      const result = await Property.updateMany(
        {
          $or: [
            { isExpired: true },
            { expirationStatus: 'expired' }
          ]
        },
        {
          $set: {
            isExpired: false,
            expirationStatus: 'active'
          }
        }
      );
      
      console.log(`✅ Restored ${result.modifiedCount} expired properties`);
    }
    
    // Also ensure all non-deleted properties are active
    const activeResult = await Property.updateMany(
      {
        deletionStatus: { $ne: 'deleted' }
      },
      {
        $set: {
          isExpired: false
        }
      }
    );
    
    console.log(`✅ Ensured ${activeResult.modifiedCount} active properties are not marked as expired`);
    
    // Get final counts
    const totalProperties = await Property.countDocuments({});
    const activeProperties = await Property.countDocuments({ deletionStatus: { $ne: 'deleted' } });
    const expiredPropertiesAfter = await Property.countDocuments({ isExpired: true });
    
    console.log('\n🎉 Restoration completed!');
    console.log(`📊 Final Summary:`);
    console.log(`   🏠 Total Properties: ${totalProperties}`);
    console.log(`   ✅ Active Properties: ${activeProperties}`);
    console.log(`   ⏰ Expired Properties: ${expiredPropertiesAfter}`);
    
    if (expiredPropertiesAfter === 0) {
      console.log('\n✅ All properties are now visible!');
    } else {
      console.log(`\n⚠️ Still have ${expiredPropertiesAfter} expired properties (may need manual review)`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  restoreAllProperties()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreAllProperties };





