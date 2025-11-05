# MongoDB Setup Guide

Your web app has been successfully connected to MongoDB! Here's what has been set up and how to use it.

## What's Been Created

### 1. Database Connection
- **File**: `src/lib/mongodb.ts`
- **Connection String**: Your MongoDB Atlas connection string has been configured
- **Features**: Connection pooling, error handling, and caching

### 2. Property Model
- **File**: `src/models/Property.ts`
- **Features**: Complete property schema with validation, indexes, and TypeScript types

### 3. API Routes
- **Properties**: `/api/properties` - GET (list) and POST (create)
- **Individual Property**: `/api/properties/[id]` - GET, PUT, DELETE
- **Seed Data**: `/api/seed` - POST to populate database with sample data
- **Test Connection**: `/api/test` - GET to test MongoDB connection

### 4. Custom Hook
- **File**: `src/hooks/useProperties.ts`
- **Features**: React hook for managing property data with CRUD operations

### 5. Updated Components
- **SampleHomes**: Now fetches data from MongoDB instead of hardcoded data
- **PropertyDetail**: Compatible with database data structure

## How to Use

### 1. Test the Connection
Visit `/api/test` in your browser or use a tool like Postman to verify the MongoDB connection.

### 2. Seed the Database
Send a POST request to `/api/seed` to populate your database with sample properties.

### 3. View Properties
The SampleHomes component will automatically fetch properties from the database. If no properties exist, it will fall back to the sample data.

### 4. Add New Properties
Use the `useProperties` hook in your components:
```typescript
const { properties, loading, error, addProperty } = useProperties();

// Add a new property
const newProperty = {
  title: "New Luxury Home",
  location: "Beverly Hills, CA",
  price: 5000000,
  beds: 4,
  baths: 5,
  sqft: 6000,
  // ... other required fields
};

await addProperty(newProperty);
```

## Database Schema

The Property model includes:
- Basic info: title, location, price, beds, baths, sqft
- Details: yearBuilt, lotSize, propertyType, status
- Rich content: description, features, amenities, images
- Agent information: name, phone, image, rating
- Metadata: featured flag, timestamps

## Security Notes

- The connection string is currently hardcoded in the mongodb.ts file
- For production, consider moving it to environment variables
- Ensure your MongoDB Atlas cluster has proper network access controls

## Troubleshooting

### Connection Issues
1. Check if your MongoDB Atlas cluster is running
2. Verify the connection string is correct
3. Ensure your IP address is whitelisted in MongoDB Atlas
4. Check the browser console for error messages

### Data Not Loading
1. Check if the database has been seeded
2. Verify the API endpoints are working
3. Check browser network tab for failed requests

## Next Steps

1. **Test the connection** by visiting `/api/test`
2. **Seed the database** by sending a POST to `/api/seed`
3. **Customize the Property model** if you need additional fields
4. **Add authentication** to protect your API endpoints
5. **Implement search and filtering** using MongoDB queries

Your MongoDB connection is now ready to use! 🎉
