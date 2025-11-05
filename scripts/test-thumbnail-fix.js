/**
 * Test Thumbnail Duplication Fix
 * 
 * This script creates a test property with thumbnail duplication to verify
 * that our fix works correctly.
 * 
 * Usage: node scripts/test-thumbnail-fix.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kobac2025';
const DB_NAME = process.env.MONGODB_DB || 'kobac2025';

async function testThumbnailFix() {
  let client;
  
  try {
    console.log('🧪 Testing thumbnail duplication fix...');
    console.log('📡 Connecting to MongoDB:', MONGODB_URI);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const propertiesCollection = db.collection('properties');
    
    // Create a test property with thumbnail duplication
    const testThumbnail = 'https://example.com/thumbnail.jpg';
    const testImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      testThumbnail, // This is the duplicate!
      'https://example.com/image3.jpg'
    ];
    
    const testProperty = {
      title: 'TEST: Property with Thumbnail Duplication',
      location: 'Test Location',
      district: 'Hamar‑Weyne',
      price: 100000,
      beds: 3,
      baths: 2,
      yearBuilt: 2020,
      lotSize: 1000,
      propertyType: 'villa',
      status: 'For Sale',
      listingType: 'sale',
      description: 'This is a test property to verify thumbnail duplication fix',
      thumbnailImage: testThumbnail,
      images: testImages,
      agentId: '507f1f77bcf86cd799439011', // Dummy ObjectId
      agent: {
        name: 'Test Agent',
        phone: '1234567890',
        image: 'https://example.com/agent.jpg',
        rating: 5
      },
      featured: false,
      viewCount: 0,
      uniqueViewCount: 0,
      uniqueViewers: [],
      anonymousViewers: [],
      lastViewedAt: new Date(),
      deletionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      viewHistory: [],
      suspiciousActivity: {
        excessiveViews: 0,
        ownerViewCount: 0
      },
      viewQualityScore: 0
    };
    
    console.log('📝 Creating test property with thumbnail duplication...');
    console.log('   Thumbnail:', testThumbnail);
    console.log('   Images:', testImages);
    console.log('   Duplicate found:', testImages.includes(testThumbnail));
    
    // Insert the test property
    const insertResult = await propertiesCollection.insertOne(testProperty);
    console.log('✅ Test property created with ID:', insertResult.insertedId);
    
    // Now test our fix function
    console.log('\n🔧 Testing the fix function...');
    
    // Import our fix function
    const { fixPropertyThumbnailDuplication } = require('./fix-thumbnail-duplication.js');
    
    // Test the fix
    const fixData = fixPropertyThumbnailDuplication(testProperty);
    
    if (fixData) {
      console.log('✅ Fix function detected duplication:');
      console.log('   Duplicates removed:', fixData.duplicatesRemoved);
      console.log('   Original count:', fixData.originalCount);
      console.log('   New count:', fixData.newCount);
      console.log('   Filtered images:', fixData.images);
      
      // Apply the fix to the database
      console.log('\n🔄 Applying fix to database...');
      const updateResult = await propertiesCollection.updateOne(
        { _id: insertResult.insertedId },
        { 
          $set: { 
            images: fixData.images,
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Fix applied successfully to database');
        
        // Verify the fix
        const updatedProperty = await propertiesCollection.findOne({ _id: insertResult.insertedId });
        console.log('\n📊 Verification:');
        console.log('   Updated images:', updatedProperty.images);
        console.log('   Thumbnail still present:', updatedProperty.thumbnailImage);
        console.log('   Duplicate removed:', !updatedProperty.images.includes(updatedProperty.thumbnailImage));
      } else {
        console.log('❌ Failed to apply fix to database');
      }
    } else {
      console.log('❌ Fix function did not detect duplication');
    }
    
    // Clean up - remove the test property
    console.log('\n🧹 Cleaning up test property...');
    const deleteResult = await propertiesCollection.deleteOne({ _id: insertResult.insertedId });
    if (deleteResult.deletedCount > 0) {
      console.log('✅ Test property cleaned up successfully');
    } else {
      console.log('⚠️ Failed to clean up test property');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 Disconnected from MongoDB');
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testThumbnailFix()
    .then(() => {
      console.log('🎉 Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testThumbnailFix };

