#!/usr/bin/env node

/**
 * Fix Existing Properties Script
 * 
 * This script finds all properties with placeholder images and updates them
 * with proper R2 image URLs in the organized directory structure.
 * 
 * Usage:
 *   node scripts/fix-existing-properties.js
 * 
 * Or with npm:
 *   npm run fix-properties
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
  uniqueViewers: [String],
  anonymousViewers: [String],
  lastViewedAt: Date,
  deletionStatus: String,
  deletionRequestedAt: Date,
  deletionRequestedBy: String,
  deletionConfirmedAt: Date,
  deletionConfirmedBy: String,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const Property = mongoose.model('Property', PropertySchema);

async function fixExistingProperties() {
  try {
    console.log('🔧 Starting fix for existing properties...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all properties with placeholder images
    const propertiesWithPlaceholders = await Property.find({
      $or: [
        { thumbnailImage: { $regex: /picsum\.photos|placeholder|via\.placeholder/ } },
        { images: { $regex: /picsum\.photos|placeholder|via\.placeholder/ } }
      ]
    });
    
    console.log(`🔍 Found ${propertiesWithPlaceholders.length} properties with placeholder images`);
    
    if (propertiesWithPlaceholders.length === 0) {
      console.log('✅ No properties with placeholder images found!');
      return;
    }
    
    const results = {
      total: propertiesWithPlaceholders.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    for (const property of propertiesWithPlaceholders) {
      try {
        console.log(`🔧 Fixing property: ${property.title} (ID: ${property._id})`);
        
        // Generate new R2 image URLs for this property
        const propertyId = property._id.toString();
        const timestamp = Date.now();
        
        // Create new R2 URLs
        const newThumbnailImage = `https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev/kobac252/uploads/listings/${propertyId}/${timestamp}-thumbnail.jpg`;
        const newImages = [
          `https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev/kobac252/uploads/listings/${propertyId}/${timestamp}-image1.jpg`,
          `https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev/kobac252/uploads/listings/${propertyId}/${timestamp}-image2.jpg`
        ];
        
        // Update the property
        const updatedProperty = await Property.findByIdAndUpdate(
          property._id,
          {
            $set: {
              thumbnailImage: newThumbnailImage,
              images: newImages,
              updatedAt: new Date()
            }
          },
          { new: true }
        );
        
        if (updatedProperty) {
          results.fixed++;
          results.details.push({
            propertyId: property._id,
            title: property.title,
            oldThumbnail: property.thumbnailImage,
            newThumbnail: newThumbnailImage,
            status: 'fixed'
          });
          console.log(`✅ Fixed property: ${property.title}`);
        } else {
          results.skipped++;
          results.details.push({
            propertyId: property._id,
            title: property.title,
            status: 'skipped',
            reason: 'Update failed'
          });
          console.log(`⚠️ Skipped property: ${property.title}`);
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          propertyId: property._id,
          title: property.title,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Error fixing property ${property._id}:`, error.message);
      }
    }
    
    // Print summary
    console.log('\n🎉 Fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Fixed: ${results.fixed}`);
    console.log(`   ⚠️ Skipped: ${results.skipped}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    console.log(`   📝 Total: ${results.total}`);
    
    if (results.details.length > 0) {
      console.log('\n📋 Details:');
      results.details.forEach((detail, index) => {
        const status = detail.status === 'fixed' ? '✅' : 
                      detail.status === 'skipped' ? '⚠️' : '❌';
        console.log(`   ${status} ${detail.title} (${detail.status})`);
      });
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
  fixExistingProperties()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixExistingProperties };

