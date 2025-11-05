# SuperAdmin Security Setup Guide

## 🔒 Security Requirements

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/kobac2025

# Cloudflare R2 Configuration
R2_ENDPOINT=https://744f24f8a5918e0d996c5ff4009a7adb.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=ff0ae7f1eaa23b1a23f89e412a4db34e
R2_SECRET_ACCESS_KEY=b1ab6937c465ad0dff721a0d08782831c4fe713890db87f86e0727aed2d57fe0
R2_BUCKET=kobac252
R2_PUBLIC_BASE=https://pub-36a660b428c343399354263f0c318585.r2.dev

# Security Configuration
ADMIN_TOKEN=kobac2025-secure-admin-token
ALLOWED_IPS=127.0.0.1,::1,localhost

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
## 🛡️ Security Features

### 1. **Admin Token Authentication**
- Required for all SuperAdmin creation attempts
- Must match the `ADMIN_TOKEN` environment variable
- Provides an additional layer of security

### 2. **IP Address Restrictions**
- Only allows SuperAdmin creation from specified IP addresses
- Default allows: `127.0.0.1`, `::1`, `localhost`
- Add your server IP to `ALLOWED_IPS` for production

### 3. **Dual Protection**
- Requests must have either:
  - Valid admin token, OR
  - Come from an allowed IP address

## 🔧 Setup Instructions

### Step 1: Generate a Secure Admin Token
```bash
# Generate a random 32-character token
openssl rand -hex 16
# Or use a secure password generator
```

### Step 2: Add to Environment Variables
```env
# In your .env.local file
ADMIN_TOKEN=your-generated-token-here
ALLOWED_IPS=127.0.0.1,::1,localhost
```

### Step 3: Test the Setup
1. Go to `/create-superadmin` page
2. Fill in the form with your admin token
3. Verify SuperAdmin creation works
4. Test with wrong token to ensure it's blocked

## 🚨 Security Best Practices

1. **Use a Strong Token**: At least 32 characters, mix of letters, numbers, symbols
2. **Keep Token Secret**: Never commit to version control
3. **Rotate Regularly**: Change the token periodically
4. **Limit IP Access**: Only allow necessary IP addresses
5. **Monitor Logs**: Check server logs for unauthorized attempts

## 🔍 Troubleshooting

### "Unauthorized access" Error
- Check that `ADMIN_TOKEN` is set correctly
- Verify the token matches what you're entering
- Ensure your IP is in `ALLOWED_IPS` (if using IP restrictions)

### Token Not Working
- Restart your development server after changing `.env.local`
- Check for typos in the token
- Ensure no extra spaces in the environment variable

## 🏗️ Production Deployment

For production, consider additional security measures:

1. **HTTPS Only**: Ensure all requests use HTTPS
2. **Rate Limiting**: Add rate limiting to the endpoint
3. **Logging**: Implement detailed logging of all attempts
4. **IP Whitelisting**: Restrict to specific server IPs only
5. **Token Rotation**: Implement automatic token rotation

## 📝 Example .env.local
```env
# Database
MONGODB_URI=your-mongodb-connection-string

# Cloudflare R2
R2_ENDPOINT=your-r2-endpoint
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE=your-public-base-url

# Security
ADMIN_TOKEN=your-secure-admin-token-here
ALLOWED_IPS=127.0.0.1,::1,localhost,your-production-ip
```
