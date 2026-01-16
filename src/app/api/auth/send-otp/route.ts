import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OTP from '@/models/OTP';
import { sendOTPEmail } from '@/lib/emailService';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        await connectToDatabase();

        // Rate Wait: 60s between requests
        const recentOTP = await OTP.findOne({
            email: normalizedEmail,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
        });

        if (recentOTP) {
            const timeLeft = 60 - Math.floor((Date.now() - recentOTP.createdAt.getTime()) / 1000);
            return NextResponse.json({
                success: false,
                error: `Please wait ${timeLeft} seconds before requesting a new code`
            }, { status: 429 });
        }

        // Cleanup old codes
        await OTP.deleteMany({ email: normalizedEmail, used: false });

        // Generate & Hash
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Store in DB
        await OTP.create({
            email: normalizedEmail,
            otp: hashedOTP,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10m
        });

        // Send Email
        const emailResult = await sendOTPEmail(normalizedEmail, otp);

        if (!emailResult.success) {
            console.error('Email send failure:', emailResult.error);
            return NextResponse.json({
                success: false,
                error: 'Failed to send email. Please try again.'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Code sent successfully',
            expiresIn: 600
        });

    } catch (error: any) {
        console.error('Send OTP Error:', error);
        return NextResponse.json({
            success: false,
            error: 'An internal error occurred'
        }, { status: 500 });
    }
}
