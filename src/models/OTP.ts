import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
    email: string;
    otp: string; // Will be hashed
    expiresAt: Date;
    attempts: number;
    used: boolean;
    createdAt: Date;
}

const OTPSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        index: true
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5 // Max 5 attempts
    },
    used: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Auto-delete after 10 minutes using TTL index
        index: true
    }
});

// Compound index for faster queries
OTPSchema.index({ email: 1, used: 1, expiresAt: 1 });

// Force model refresh to ensure schema changes are applied
if (mongoose.models.OTP) {
    delete mongoose.models.OTP;
}

export default mongoose.model<IOTP>('OTP', OTPSchema);
