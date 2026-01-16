'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import OTPInput from './OTPInput';
import { useUser } from '@/contexts/UserContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

export default function EmailOTPLogin() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);
    const router = useRouter();
    const { checkAuth } = useUser();

    // Countdown timer
    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        setLoading(true);
        setError('');
        try {
            console.log('Google credential received');

            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();

            if (data.success) {
                console.log('Google login valid, checking auth...');
                await checkAuth(); // Update global context
                router.push('/dashboard');
            } else {
                setError(data.error || 'Google sign-in failed');
            }
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(`Google login failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (data.success) {
                setStep('otp');
                setCountdown(60);
                setSuccess('Code sent! Check your email.');
            } else {
                setError(data.error || 'Failed to send code');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(`Request failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (otpValue: string) => {
        setOtp(otpValue);
        // Only submit if full length (assuming 6 digits)
        if (otpValue.length !== 6) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpValue })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Success! Redirecting...');
                await checkAuth();
                router.push('/dashboard');
            } else {
                setError(data.error || 'Invalid code');
                setLoading(false); // Stop loading on error
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;
        await handleSendOTP({ preventDefault: () => { } } as React.FormEvent);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {step === 'email' ? 'Welcome Back' : 'Check Your Email'}
                    </h2>
                    <p className="text-gray-600">
                        {step === 'email'
                            ? 'Sign in with Google or Email'
                            : `Enter the 6-digit code we sent to ${email}`}
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        {success}
                    </div>
                )}

                {step === 'email' ? (
                    <div className="space-y-6">
                        {/* Google Sign-In Button */}
                        <div className="flex justify-center w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Login Failed')}
                                theme="filled_blue"
                                size="large"
                                width="100%"
                                shape="rectangular"
                                text="continue_with"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        placeholder="name@example.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Continue with Email
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <OTPInput
                                length={6}
                                onComplete={handleVerifyOTP}
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="text-center space-y-3">
                            <button
                                onClick={handleResendOTP}
                                disabled={countdown > 0 || loading}
                                className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                            >
                                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                            </button>

                            <button
                                onClick={() => {
                                    setStep('email');
                                    setOtp('');
                                    setError('');
                                }}
                                disabled={loading}
                                className="block w-full text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                            >
                                ← Change Email
                            </button>
                        </div>

                        {loading && (
                            <div className="flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
