# Automatic Company Logo Attachment Feature

## Overview

This feature automatically attaches the company logo to all property posts created by agents. When an agent uploads a property, the company logo is automatically appended to the property's images array without requiring manual intervention.

## How It Works

1. **Automatic Attachment**: When an agent creates a property through the API (`/api/properties`), the system automatically appends the company logo URL to the property's `images` array.

2. **Logo File**: The company logo uses the existing `/public/icons/kobac.webp` file from the icons folder.

3. **Configuration**: The feature can be easily configured through environment variables or by modifying the utility function.

## Configuration Options

### Environment Variables

You can control the company logo attachment using these environment variables:

```bash
# Disable automatic logo attachment (default: enabled)
ENABLE_COMPANY_LOGO=false

# Use a custom logo URL (default: '/icons/kobac.webp')
COMPANY_LOGO_URL=/path/to/custom/logo.png
```

### Code Configuration

The logo URL is managed through the `getCompanyLogoUrl()` function in `src/lib/utils.ts`:

```typescript
export function getCompanyLogoUrl(): string | null {
  // Check if company logo attachment is disabled
  if (process.env.ENABLE_COMPANY_LOGO === 'false') {
    return null;
  }
  
  // Use custom logo URL if provided, otherwise use default
  return process.env.COMPANY_LOGO_URL || '/icons/kobac.webp';
}
```

## Implementation Details

### Files Modified

1. **`src/app/api/properties/route.ts`**: Modified the POST endpoint to automatically append the company logo to property images.

2. **`src/lib/utils.ts`**: Added `getCompanyLogoUrl()` utility function for centralized logo URL management.

3. **`public/icons/kobac.webp`**: Uses the existing KOBAC company logo from the icons folder.

### Code Changes

The property creation process now includes:

```typescript
// Company logo URL - this will be automatically attached to all agent posts
const companyLogoUrl = getCompanyLogoUrl();

// Prepare images array with company logo automatically attached
let imagesArray = body.additionalImages && Array.isArray(body.additionalImages) ? body.additionalImages : [];

// Automatically append company logo to the images array if it's not already included
if (companyLogoUrl && !imagesArray.includes(companyLogoUrl)) {
  imagesArray.push(companyLogoUrl);
  console.log('🏢 Company logo automatically attached to property images:', companyLogoUrl);
} else if (!companyLogoUrl) {
  console.log('ℹ️ Company logo attachment is disabled');
}
```

## Benefits

1. **Brand Consistency**: Ensures all agent posts include the company logo for consistent branding.

2. **Automatic Process**: No manual intervention required from agents or administrators.

3. **Flexible Configuration**: Easy to enable/disable or change the logo through environment variables.

4. **Professional Appearance**: All property listings will have a consistent, professional look with the company branding.

## Testing

To test the feature:

1. Create a property as an agent through the dashboard
2. Check the property details to confirm the company logo appears in the images array
3. Verify the logo displays correctly in the property listing

## Future Enhancements

Potential improvements for this feature:

1. **Logo Positioning**: Allow configuration of logo position (beginning, end, or specific position in the array)
2. **Multiple Logos**: Support for different logos based on property type or agent
3. **Logo Overlay**: Add option to overlay the logo on property images instead of adding as separate images
4. **Logo Watermark**: Implement logo as a watermark on property images

## Troubleshooting

### Logo Not Appearing

1. Check if `ENABLE_COMPANY_LOGO` is set to `false`
2. Verify the logo file exists at the specified path
3. Check browser console for any loading errors
4. Ensure the logo URL is accessible from the frontend

### Changing the Logo

1. Replace the file at `/public/icons/kobac.webp` with your new logo
2. Or set the `COMPANY_LOGO_URL` environment variable to point to your custom logo
3. Restart the application to apply changes
