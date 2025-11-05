/**
 * Fix Thumbnail Duplication Script
 * 
 * This script fixes existing properties where the thumbnail image appears
 * multiple times in the property detail page gallery by removing duplicate
 * thumbnails from the images array.
 * 
 * Usage: node scripts/fix-thumbnail-duplication.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kobac2025';
const DB_NAME = process.env.MONGODB_DB || 'kobac2025';

/**
 * Resolves an image URL to ensure consistent comparison
 * @param {string} imageUrl - The image URL
 * @returns {string|null} The resolved URL or null if invalid
 */
function resolveImageUrl(imageUrl) {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }
  
  // If it's already an R2 URL, return as is
  if (imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com')) {
    return imageUrl;
  }
  
  // If it's a local upload URL, return as is
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  
  // If it's an external URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path, return as is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return null;
}

/**
 * Fixes thumbnail duplication for a single property
 * @param {Object} property - The property document
 * @returns {Object|null} The update data or null if no changes needed
 */
function fixPropertyThumbnailDuplication(property) {
  const { thumbnailImage, images } = property;
  
  // Skip if no thumbnail or no additional images
  if (!thumbnailImage || !images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  
  // Resolve the thumbnail URL for comparison
  const resolvedThumbnail = resolveImageUrl(thumbnailImage);
  if (!resolvedThumbnail) {
    return null;
  }
  
  // Filter out images that match the thumbnail
  const originalImages = [...images];
  const filteredImages = images.filter(img => {
    const resolvedImg = resolveImageUrl(img);
    return resolvedImg !== resolvedThumbnail;
  });
  
  // Check if any duplicates were found
  if (originalImages.length === filteredImages.length) {
    return null; // No duplicates found
  }
  
  const duplicatesRemoved = originalImages.length - filteredImages.length;
  
  return {
    images: filteredImages,
    duplicatesRemoved,
    originalCount: originalImages.length,
    newCount: filteredImages.length
  };
}

/**
 * Main function to fix all properties
 */
async function fixThumbnailDuplication() {
  let client;
  
  try {
    console.log('🔧 Starting thumbnail duplication fix...');
    console.log('📡 Connecting to MongoDB:', MONGODB_URI);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertiesCollection = db.collection('properties');
    
    // Get all properties with images
    console.log('🔍 Finding properties with images...');
    const properties = await propertiesCollection.find({
      $and: [
        { thumbnailImage: { $exists: true, $nin: [null, ''] } },
        { images: { $exists: true, $ne: null, $not: { $size: 0 } } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${properties.length} properties with both thumbnail and additional images`);
    
    if (properties.length === 0) {
      console.log('✅ No properties found that need fixing');
      return;
    }
    
    let totalFixed = 0;
    let totalDuplicatesRemoved = 0;
    const fixedProperties = [];
    
    // Process each property
    for (const property of properties) {
      const fixData = fixPropertyThumbnailDuplication(property);
      
      if (fixData) {
        try {
          // Update the property in the database
          const result = await propertiesCollection.updateOne(
            { _id: property._id },
            { 
              $set: { 
                images: fixData.images,
                updatedAt: new Date()
              }
            }
          );
          
          if (result.modifiedCount > 0) {
            totalFixed++;
            totalDuplicatesRemoved += fixData.duplicatesRemoved;
            
            fixedProperties.push({
              id: property._id,
              title: property.title,
              duplicatesRemoved: fixData.duplicatesRemoved,
              originalCount: fixData.originalCount,
              newCount: fixData.newCount
            });
            
            console.log(`✅ Fixed property: "${property.title}" (${fixData.duplicatesRemoved} duplicates removed)`);
          } else {
            console.log(`⚠️ Failed to update property: "${property.title}"`);
          }
        } catch (error) {
          console.error(`❌ Error updating property "${property.title}":`, error.message);
        }
      }
    }
    
    // Summary
    console.log('\n📊 Fix Summary:');
    console.log(`   Properties processed: ${properties.length}`);
    console.log(`   Properties fixed: ${totalFixed}`);
    console.log(`   Total duplicates removed: ${totalDuplicatesRemoved}`);
    
    if (fixedProperties.length > 0) {
      console.log('\n🔧 Fixed Properties:');
      fixedProperties.forEach(prop => {
        console.log(`   - "${prop.title}": ${prop.duplicatesRemoved} duplicates removed (${prop.originalCount} → ${prop.newCount} images)`);
      });
    }
    
    console.log('\n✅ Thumbnail duplication fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during thumbnail duplication fix:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 Disconnected from MongoDB');
    }
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixThumbnailDuplication()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixThumbnailDuplication, fixPropertyThumbnailDuplication };

