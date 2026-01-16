import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  // Legacy values (backward compatible)
  SUPER_ADMIN = 'super_admin',
  AGENT = 'agent',
  NORMAL_USER = 'normal_user',
  // New canonical values
  SUPERADMIN = 'superadmin',
  AGENCY = 'agency',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash?: string; // Made optional for plain password support
  password?: string; // Added for plain password support
  authProvider?: string; // e.g., 'local', 'google'
  passwordChangedAt: Date;
  role: UserRole;
  status: UserStatus;
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    company?: string;
    slug?: string;
  };
  avatarChangeRequest?: {
    requestedAvatar?: string;
    requestedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
  };
  permissions: {
    canManageUsers: boolean;
    canManageProperties: boolean;
    canManageAgents: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;
    canApproveProperties: boolean;
    canDeleteProperties: boolean;
    canManageRoles: boolean;
  };
  agentProfile?: {
    licenseNumber?: string;
    experience?: number; // years
    specializations?: string[];
    commissionRate?: number; // percentage
    totalSales?: number;
    rating?: number;
    verified: boolean;
    // New fields for blue tick system
    blueTickStatus: 'none' | 'pending' | 'verified' | 'suspended';
    blueTickVerifiedAt?: Date;
    blueTickVerifiedBy?: string;
    blueTickSuspendedAt?: Date;
    blueTickSuspendedBy?: string;
    blueTickSuspensionReason?: string;
    blueTickRequirements: {
      documentsSubmitted: boolean;
      identityVerified: boolean;
      licenseValidated: boolean;
      backgroundChecked: boolean;
      complianceVerified: boolean;
    };
    verificationHistory: Array<{
      action: 'granted' | 'suspended' | 'reinstated';
      reason: string;
      adminId: string;
      adminName: string;
      timestamp: Date;
    }>;
    // Cumulative views tracking - persists even when properties are deleted
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    };
    totalProperties: {
      type: Number,
      default: 0,
      min: 0
    };
    deletedPropertiesViews: {
      type: Number,
      default: 0,
      min: 0
    };
  };
  preferences: {
    favoriteProperties: string[];
    searchHistory: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      propertyUpdates: boolean;
      marketNews: boolean;
      promotionalOffers: boolean;
    };
    language: string;
    currency: string;
    timezone: string;
  };
  security: {
    lastLogin?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    passwordResetTokenHash?: string;
    passwordResetExpires?: Date;
    mustChangePassword?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: false, // Made optional for Google Auth users
    unique: true,
    sparse: true,
    trim: true,
    minlength: 10
  },
  authProvider: {
    type: String,
    default: 'local'
  },
  passwordHash: {
    type: String,
    required: false // Made optional for plain password support
  },
  password: {
    type: String,
    required: false // Added for plain password support
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },

  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    required: true
  },
  profile: {
    avatar: String,
    bio: { type: String, maxlength: 500 },
    location: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    occupation: String,
    company: String,
    slug: { type: String, unique: true, sparse: true } // URL-friendly slug for agent profiles
  },
  avatarChangeRequest: {
    requestedAvatar: String,
    requestedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageProperties: { type: Boolean, default: false },
    canManageAgents: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canApproveProperties: { type: Boolean, default: false },
    canDeleteProperties: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false }
  },
  agentProfile: {
    licenseNumber: String,
    experience: { type: Number, min: 0, max: 50 },
    specializations: [String],
    commissionRate: { type: Number, min: 0, max: 100 },
    totalSales: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    verified: { type: Boolean, default: false },
    // New fields for blue tick system
    blueTickStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'suspended'],
      default: 'none'
    },
    blueTickVerifiedAt: Date,
    blueTickVerifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    blueTickSuspendedAt: Date,
    blueTickSuspendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    blueTickSuspensionReason: String,
    blueTickRequirements: {
      documentsSubmitted: { type: Boolean, default: false },
      identityVerified: { type: Boolean, default: false },
      licenseValidated: { type: Boolean, default: false },
      backgroundChecked: { type: Boolean, default: false },
      complianceVerified: { type: Boolean, default: false }
    },
    verificationHistory: [
      {
        action: {
          type: String,
          enum: ['granted', 'suspended', 'reinstated']
        },
        reason: String,
        adminId: { type: Schema.Types.ObjectId, ref: 'User' },
        adminName: String,
        timestamp: Date
      }
    ],
    // Cumulative views tracking - persists even when properties are deleted
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    },
    totalProperties: {
      type: Number,
      default: 0,
      min: 0
    },
    deletedPropertiesViews: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  preferences: {
    favoriteProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    searchHistory: [String],
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      propertyUpdates: { type: Boolean, default: true },
      marketNews: { type: Boolean, default: false },
      promotionalOffers: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' }
  },
  security: {
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
    mustChangePassword: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Validate that at least one password field is provided (only for new documents)
UserSchema.pre('save', function (next) {
  // Only validate for new documents
  if (this.isNew) {
    // If authProvider is NOT google, verify password
    if (this.authProvider !== 'google' && !this.passwordHash && !this.password) {
      return next(new Error('Either passwordHash or password must be provided for new users'));
    }
  }
  next();
});

// Set permissions based on role (supporting legacy and new role strings)
UserSchema.pre('save', function (next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.SUPERADMIN:
        this.permissions = {
          canManageUsers: true,
          canManageProperties: true,
          canManageAgents: true,
          canViewAnalytics: true,
          canManageSettings: true,
          canApproveProperties: true,
          canDeleteProperties: true,
          canManageRoles: true
        };
        this.status = UserStatus.ACTIVE;
        break;

      case UserRole.AGENT:
      case UserRole.AGENCY:
        this.permissions = {
          canManageUsers: false,
          canManageProperties: true,
          canManageAgents: false,
          canViewAnalytics: true,
          canManageSettings: false,
          canApproveProperties: false,
          canDeleteProperties: false,
          canManageRoles: false
        };
        // Automatically set agent status to ACTIVE when promoted
        this.status = UserStatus.ACTIVE;
        break;

      case UserRole.NORMAL_USER:
      case UserRole.USER:
        this.permissions = {
          canManageUsers: false,
          canManageProperties: false,
          canManageAgents: false,
          canViewAnalytics: false,
          canManageSettings: false,
          canApproveProperties: false,
          canDeleteProperties: false,
          canManageRoles: false
        };
        this.status = UserStatus.ACTIVE;
        break;
    }
  }
  next();
});

// Create indexes for better query performance
// Note: phone already has unique: true which creates an index, so we don't need to add it again

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ 'agentProfile.verified': 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
