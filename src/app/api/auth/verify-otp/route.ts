import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import OTP from '@/models/OTP';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({
                success: false,
                error: 'Email and OTP are required'
            }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        await connectToDatabase();

        // Find the most recent valid OTP for this email
        const otpRecord = await OTP.findOne({
            email: normalizedEmail,
            used: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 }); // Get most recent

        if (!otpRecord) {
            return NextResponse.json({
                success: false,
                error: 'Invalid or expired OTP. Please request a new code.'
            }, { status: 401 });
        }

        // Check if too many attempts
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return NextResponse.json({
                success: false,
                error: 'Too many failed attempts. Please request a new code.'
            }, { status: 429 });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, otpRecord.otp);

        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            const attemptsLeft = 5 - otpRecord.attempts;
            return NextResponse.json({
                success: false,
                error: `Invalid OTP. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`
            }, { status: 401 });
        }

        // Mark OTP as used
        otpRecord.used = true;
        await otpRecord.save();

        // Find or create user
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Create new user on first login
            const defaultName = normalizedEmail.split('@')[0];
            user = await User.create({
                email: normalizedEmail,
                fullName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
                role: 'user',
                emailVerified: true,
                password: await bcrypt.hash(Math.random().toString(36), 10) // Random password (not used)
            });
            console.log('✅ New user auto-created:', normalizedEmail);
        } else {
            // Update email verification status for existing user
            if (!user.emailVerified) {
                user.emailVerified = true;
                await user.save();
            }
            console.log('✅ Existing user logged in:', normalizedEmail);
        }

        // Generate JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');
        const token = await new SignJWT({
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        console.log('✅ OTP verified successfully for:', normalizedEmail);

        // Set HTTP-only cookie
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatar: user.avatar
            },
            token
        });

        response.cookies.set('session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return response;

    } catch (error: any) {
        console.error('❌ Verify OTP error:', error);
        return NextResponse.json({
            success: false,
            error: 'An error occurred while verifying OTP. Please try again.'
        }, { status: 500 });
    }
}
