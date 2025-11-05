import connectDB from './mongodb';
import Counter from '@/models/Counter';

export async function getNextPropertyId(): Promise<number> {
  await connectDB();
  
  const counter = await Counter.findOneAndUpdate(
    { name: 'propertyId' },
    { $inc: { sequence: 1 } },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true 
    }
  );
  
  return counter.sequence;
}

export async function initializePropertyCounter(): Promise<void> {
  await connectDB();
  
  // Check if counter exists, if not create it with the current highest property ID + 1
  const existingCounter = await Counter.findOne({ name: 'propertyId' });
  
  if (!existingCounter) {
    const Property = (await import('@/models/Property')).default;
    const highestProperty = await Property.findOne().sort({ propertyId: -1 });
    const nextId = highestProperty?.propertyId ? highestProperty.propertyId + 1 : 1;
    
    await Counter.create({
      name: 'propertyId',
      sequence: nextId - 1 // Start from the next available ID
    });
    
    console.log(`Initialized property counter starting from ID: ${nextId}`);
  }
}
