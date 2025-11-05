# Cloudflare R2 Setup Guide

## Environment Variables Required

You need to set up the following environment variables in your `.env.local` file:

```env
# Cloudflare R2 Configuration
# Option 1: Standard endpoint (try this first)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
# Option 2: Alternative endpoint format (if Option 1 fails)
# R2_ENDPOINT=https://pub-your-account-id.r2.dev

R2_ENDPOINT=https://744f24f8a5918e0d996c5ff4009a7adb.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=ff0ae7f1eaa23b1a23f89e412a4db34e
R2_SECRET_ACCESS_KEY=b1ab6937c465ad0dff721a0d08782831c4fe713890db87f86e0727aed2d57fe0
R2_BUCKET=kobac252
R2_PUBLIC_BASE=https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev


## How to Get These Values

1. **Go to Cloudflare Dashboard**
   - Log in to your Cloudflare account
   - Navigate to "R2 Object Storage"

2. **Create a Bucket**
   - Click "Create bucket"
   - Give it a name (e.g., `kobac-properties`)
   - This becomes your `R2_BUCKET` value

3. **Get Your Account ID**
   - In the R2 dashboard, look for your Account ID
   - This is used in the endpoint URLs

4. **Create API Tokens**
   - Go to "Manage R2 API tokens"
   - Click "Create API token"
   - Choose "Custom token"
   - Set permissions:
     - Object Read & Write
     - Bucket Read & Write
   - This gives you `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`

5. **Set Up Public Access (Optional)**
   - In your bucket settings, enable public access
   - This allows direct URL access to uploaded files

## Testing the Setup

1. **Test R2 Connection**
   - Go to `/agent-debug` page
   - Click "Test R2 Connection" button
   - This will verify your environment variables and connection

2. **Test File Upload**
   - Try uploading a property with images
   - Check the browser console for upload logs
   - Verify images are accessible via their URLs

## Troubleshooting

### Common Issues:

1. **"R2_ENDPOINT environment variable is missing"**
   - Make sure your `.env.local` file exists
   - Check that the variable name is exactly `R2_ENDPOINT`

2. **"Access Denied" errors**
   - Verify your API token has the correct permissions
   - Check that your bucket name is correct

3. **"Bucket not found" errors**
   - Ensure the bucket exists in your R2 dashboard
   - Verify the bucket name in your environment variable

4. **Images not loading**
   - Check if public access is enabled on your bucket
   - Verify the `R2_PUBLIC_BASE` URL is correct

        5. **SSL/TLS errors (SSL alert number 40)**
            - Try the alternative endpoint format: `https://pub-your-account-id.r2.dev`
            - Make sure your account ID is correct in the endpoint URL
            - Check that your API tokens have the correct permissions
         
         6. **"All R2 endpoint configurations failed"**
            - Check your account ID in the endpoint URL
            - Verify your API tokens have the correct permissions
            - Try different endpoint formats:
              - `https://your-account-id.r2.cloudflarestorage.com`
              - `https://pub-your-account-id.r2.dev`
              - `https://your-account-id.r2.dev`
            - Ensure your bucket exists and is accessible
            - Check if your Cloudflare account has R2 enabled

### Debug Steps:

1. Check the browser console for detailed error messages
2. Use the "Test R2 Connection" button to verify setup
3. Check your Cloudflare R2 dashboard for uploaded files
4. Verify environment variables are loaded (check the test response)

## Alternative: Local Storage Fallback

If R2 is not working, the system will automatically fall back to local storage. However, this is not recommended for production as files will be stored on your server.

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment-specific API tokens
- Consider setting up CORS policies for your R2 bucket
- Regularly rotate your API tokens
