import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
    try {
        const { credential } = await req.json();

        if (!credential) {
            return NextResponse.json({ success: false, error: 'No credential provided' }, { status: 400 });
        }

        // Verify Google Token
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (err) {
            console.error('❌ Google Token Verification Failed:', err);
            return NextResponse.json({ success: false, error: 'Invalid Google Token' }, { status: 401 });
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, error: 'Invalid Token Payload' }, { status: 401 });
        }

        const { email, name, picture, sub: googleId } = payload;
        const normalizedEmail = email.toLowerCase().trim();

        await connectToDatabase();

        // Find or Create User
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log('✨ Creating new user from Google:', normalizedEmail);
            user = await User.create({
                email: normalizedEmail,
                fullName: name || 'Google User',
                role: 'user',
                authProvider: 'google',
                profile: {
                    avatar: picture
                },
                // Google users are automatically verified
                emailVerified: true,
                // Dummy password (since they login with Google)
                password: `google_${googleId}_${Math.random().toString(36)}`
            });
        } else {
            console.log('✅ Existing user logged in with Google:', normalizedEmail);
            // Update avatar if missing
            if (!user.profile?.avatar && picture) {
                user.profile = { ...user.profile, avatar: picture };
                await user.save();
            }
            // Update authProvider if safe (optional)
        }

        // Generate Session Token (Reusing logic from verify-otp)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');
        const token = await new SignJWT({
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // Set Cookie
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatar: user.profile?.avatar
            }
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
        console.error('❌ Google Auth Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal Server Error'
        }, { status: 500 });
    }
}
