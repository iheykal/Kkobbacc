'use client';

import { Suspense } from 'react';
import EmailOTPLogin from '@/components/auth/EmailOTPLogin';

export default function OTPLoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Suspense fallback={
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading login form...</p>
                        </div>
                    </div>
                }>
                    <EmailOTPLogin />
                </Suspense>
            </div>
        </div>
    );
}
