# Agent Images Setup Guide

## 📁 **Cloudflare R2 Folder Structure**

Your agent images are now organized in a specific folder structure within your Cloudflare R2 bucket:

```
kobac252/
├── agents/
│   ├── [agent-id-1]/
│   │   ├── [timestamp]-[uuid]-avatar.jpg
│   │   └── [timestamp]-[uuid]-profile.png
│   ├── [agent-id-2]/
│   │   └── [timestamp]-[uuid]-avatar.jpg
│   └── ...
├── listings/
│   ├── [listing-id-1]/
│   │   ├── [timestamp]-[uuid]-property1.jpg
│   │   └── [timestamp]-[uuid]-property2.jpg
│   └── ...
└── uploads/
    └── [general-uploads]
```

## 🔧 **How It Works**

### **1. SuperAdmin Agent Management**
- **URL**: `/admin/agents`
- **Function**: Update agent profile images
- **Storage**: `agents/[agent-id]/[filename]`
- **API**: `/api/admin/agents/[id]/avatar`

### **2. Agent Profile Management**
- **URL**: `/agent/profile`
- **Function**: Set/update agent profile picture once
- **Storage**: `agents/[agent-id]/[filename]`

### **3. Agent Dashboard Uploads**
- **URL**: `/agent`
- **Function**: Upload property images (uses existing agent profile)
- **Storage**: 
  - Properties: `listings/[listing-id]/[filename]`
  - Agent Images: Uses existing profile from `/agent/profile`

### **4. File Naming Convention**
```
[timestamp]-[uuid]-[original-filename]
Example: 1703123456789-abc123-def456-avatar.jpg
```

## 🚀 **Features**

### **✅ Organized Storage**
- **Agent images** → `agents/[agent-id]/`
- **Property images** → `listings/[listing-id]/`
- **General uploads** → `uploads/`

### **✅ Unique File Names**
- **Timestamp** prevents conflicts
- **UUID** ensures uniqueness
- **Original filename** preserved for reference

### **✅ Fallback System**
- **R2 upload** (primary)
- **Local storage** (fallback)
- **Default images** (if all fails)

### **✅ Security**
- **SuperAdmin authentication** required
- **File type validation** (images only)
- **File size limits** (5MB max)
- **Role-based access control**

## 📋 **API Endpoints**

### **SuperAdmin Agent Management**
```typescript
// Update agent avatar
PUT /api/admin/agents/[id]/avatar
Body: FormData with 'avatar' file
Headers: SuperAdmin authentication required
```

### **Agent Profile Management**
```typescript
// Update agent profile picture
PUT /api/admin/agents/[id]/avatar
Body: FormData with 'avatar' file OR JSON with avatar URL
```

### **Agent Dashboard**
```typescript
// Upload property (uses existing agent profile)
POST /api/properties
Body: JSON with property data (agent image from profile)
```

### **R2 Upload**
```typescript
// Upload to specific folder
POST /api/r2/upload
Body: FormData with 'files', 'folder', 'agentId'
```

## 🔍 **Testing**

### **1. Test R2 Connection**
- Visit `/agent-debug`
- Click "Test R2 Connection"
- Verify environment variables

### **2. Test Agent Images**
- Visit `/agent-debug`
- Click "Test R2 Images"
- Check public accessibility

### **3. Test Agent Profile Management**
- Login as Agent
- Visit `/agent/profile`
- Update profile picture

### **4. Test SuperAdmin Dashboard**
- Login as SuperAdmin
- Visit `/admin/agents`
- Update agent avatars

## 🛠 **Troubleshooting**

### **Images Not Displaying**
1. Check `R2_PUBLIC_BASE` in `.env.local`
2. Verify bucket public access is enabled
3. Restart development server after env changes

### **Upload Failures**
1. Check R2 credentials in `.env.local`
2. Verify file size (max 5MB)
3. Check file type (images only)

### **Permission Errors**
1. Ensure SuperAdmin role
2. Check authentication status
3. Verify API endpoint access

## 📝 **Environment Variables**

```env
# Required for R2
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=[your-access-key]
R2_SECRET_ACCESS_KEY=[your-secret-key]
R2_BUCKET=kobac252
R2_PUBLIC_BASE=https://pub-[hash].r2.dev

# Required for SuperAdmin
ADMIN_TOKEN=[your-admin-token]
ALLOWED_IPS=[your-ip-addresses]
```

## 🎯 **Benefits**

1. **Organized Storage**: Easy to find and manage agent images
2. **Scalable Structure**: Supports multiple agents and properties
3. **Unique Files**: No filename conflicts
4. **Security**: Role-based access control
5. **Reliability**: Multiple fallback systems
6. **Performance**: CDN-optimized delivery

Your agent images are now properly organized in Cloudflare R2! 🎉
