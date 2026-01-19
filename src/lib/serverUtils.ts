import { NextRequest } from "next/server"

export const getAuthenticatedUser = async (request: NextRequest) => {
    try {
        const cookie = request.cookies.get('kobac_session')?.value;
        if (!cookie) {
            return null;
        }

        const session = JSON.parse(decodeURIComponent(cookie));
        if (!session?.userId) {
            return null;
        }

        // Import User model dynamically to avoid circular dependencies
        const { default: User } = await import('@/models/User');
        const user = await User.findById(session.userId).select('_id fullName phone role status');

        return user;
    } catch (error) {
        console.error('Error getting authenticated user:', error);
        return null;
    }
};
