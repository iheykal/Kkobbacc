import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/passwordUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        const phone = '610251014';
        const password = 'haykaloow';
        const hashedPassword = await hashPassword(password);

        console.log(`Checking for user with phone: ${phone}`);
        let user = await User.findOne({ phone });

        if (user) {
            console.log('User found, updating password...');
            user.passwordHash = hashedPassword;
            user.password = password; // For plain text compatibility
            await user.save();
            return NextResponse.json({
                success: true,
                message: 'Password updated successfully',
                user: { id: user._id, phone: user.phone, role: user.role }
            });
        } else {
            console.log('User not found, creating new user...');
            user = await User.create({
                fullName: 'Kobac User',
                phone,
                passwordHash: hashedPassword,
                password: password,
                role: 'agent', // Defaulting to agent as likely desired
                status: 'active',
                email: `user${Date.now()}@kobac.local`, // Generate unique dummy email
                profile: {
                    bio: 'Test account',
                    location: 'Mogadishu'
                }
            });
            return NextResponse.json({
                success: true,
                message: 'User created successfully',
                user: { id: user._id, phone: user.phone, role: user.role }
            });
        }
    } catch (error: any) {
        console.error('Error in setup-user:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
