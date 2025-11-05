const mongoose = require('mongoose');
require('dotenv').config();

async function checkProperties() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
    
    console.log('🔍 Finding all properties...');
    const properties = await Property.find({});
    console.log('📊 Total properties found:', properties.length);
    
    if (properties.length > 0) {
      console.log('\n📋 Property details:');
      properties.forEach((prop, index) => {
        console.log('\n--- Property', index + 1, '---');
        console.log('ID:', prop._id || prop.propertyId || 'N/A');
        console.log('Title:', prop.title || 'N/A');
        console.log('Thumbnail Image:', prop.thumbnailImage ? 'YES' : 'NO');
        console.log('Additional Images:', prop.images ? prop.images.length : 0);
        
        if (prop.thumbnailImage && prop.images && prop.images.length > 0) {
          console.log('Thumbnail URL:', prop.thumbnailImage);
          console.log('First Additional URL:', prop.images[0]);
          console.log('Are they the same?', prop.thumbnailImage === prop.images[0] ? 'YES (DUPLICATE!)' : 'NO');
          
          // Check if any additional images match the thumbnail
          const duplicates = prop.images.filter(img => img === prop.thumbnailImage);
          if (duplicates.length > 0) {
            console.log('🚨 DUPLICATE FOUND! Thumbnail appears', duplicates.length, 'times in additional images');
          }
        }
      });
    } else {
      console.log('❌ No properties found in database');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProperties();

