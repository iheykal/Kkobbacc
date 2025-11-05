# Property Expiration Implementation

## Overview
This implementation adds automatic expiration dates to all properties in the system:
- **Rental properties**: Expire after 30 days
- **Sale properties**: Expire after 90 days

## Features Implemented

### 1. Database Schema Updates
- Added `expiresAt` field to Property model
- Added `isExpired` boolean field for quick queries
- Automatic expiration date calculation based on listing type
- Pre-save middleware to set expiration dates

### 2. API Endpoints

#### `/api/admin/migrate-expiration-dates`
- **POST**: Migrates existing properties to have expiration dates
- **GET**: Shows which properties need migration

#### `/api/admin/cleanup-expired-properties`
- **POST**: Marks expired properties as expired and changes status to "Off Market"
- **GET**: Shows expired properties without processing them

#### `/api/admin/scheduled-cleanup`
- **POST**: Comprehensive cleanup job for scheduled runs
- **GET**: Shows cleanup status and statistics

### 3. Updated Property Queries
- All property queries now exclude expired properties by default
- Agent dashboard queries can optionally include expired properties
- Added expiration status to property responses

### 4. Utility Functions (`src/lib/expirationUtils.ts`)
- `calculateExpirationDate()`: Calculate expiration based on listing type
- `getExpirationInfo()`: Get comprehensive expiration information
- `formatExpirationDate()`: Format dates for display
- `getExpirationStatusMessage()`: Get user-friendly status messages
- `getExpirationStatusColor()`: Get UI colors for status badges

### 5. UI Components
- `ExpirationBadge`: React component to display expiration status
- Color-coded status indicators (green/orange/red)

## Usage Instructions

### 1. Migrate Existing Properties
```bash
# Check which properties need migration
curl -X GET /api/admin/migrate-expiration-dates

# Run migration
curl -X POST /api/admin/migrate-expiration-dates
```

### 2. Clean Up Expired Properties
```bash
# Check expired properties
curl -X GET /api/admin/cleanup-expired-properties

# Process expired properties
curl -X POST /api/admin/cleanup-expired-properties
```

### 3. Scheduled Cleanup
```bash
# Check cleanup status
curl -X GET /api/admin/scheduled-cleanup

# Run scheduled cleanup
curl -X POST /api/admin/scheduled-cleanup
```

## Database Indexes Added
- `expiresAt`: For expiration date queries
- `isExpired`: For expired property filtering
- `isExpired + deletionStatus`: Compound index for active non-expired properties
- `expiresAt + deletionStatus`: Compound index for cleanup queries

## Automatic Behavior
1. **New Properties**: Automatically get expiration dates set based on listing type
2. **Expired Properties**: Automatically excluded from public queries
3. **Status Updates**: Expired properties automatically get "Off Market" status
4. **Agent Dashboard**: Can optionally show expired properties for agents

## Monitoring
- Expiration status is logged in all property queries
- Statistics include counts of expired, active, and expiring soon properties
- Detailed logging for cleanup operations

## Security
- All admin endpoints require superadmin authentication
- Scheduled cleanup can use token-based authentication for automated jobs
- No sensitive data exposed in expiration information

## Future Enhancements
- Email notifications for agents when properties are about to expire
- Automatic renewal options for agents
- Configurable expiration periods per property type
- Bulk renewal operations for agents
