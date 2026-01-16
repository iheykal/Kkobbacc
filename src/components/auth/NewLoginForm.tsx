'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface NewLoginFormProps {
    onSwitchToSignUp: () => void;
    onClose: () => void;
}

export const NewLoginForm: React.FC<NewLoginFormProps> = ({ onSwitchToSignUp, onClose }) => {
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, validateSession } = useUser();

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();

            if (data.success) {
                await validateSession();
                onClose();
            } else {
                setError(data.error || 'Google sign-in failed');
            }
        } catch (err: any) {
            setError('Google login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phone || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const success = await login(formData.phone, formData.password);
            if (success) {
                onClose();
            } else {
                setError('Invalid phone or password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative z-50">

            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-500">Sign in to access your account</p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium text-center"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Google Sign In - Prominent */}
            <div className="w-full mb-8 relative z-50">
                <div className="flex justify-center w-full min-h-[50px]">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="pill"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="w-full flex items-center gap-4 mb-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-gray-400 text-sm font-medium">OR EMAIL</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Traditional Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Phone Number</label>
                    <div className="relative">
                        <input
                            type="tel"
                            placeholder="e.g. 61xxxxxxx"
                            className="w-full h-12 pl-4 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full h-12 pl-4 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="flex justify-end">
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Forgot Password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Sign In <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <button
                    onClick={onSwitchToSignUp}
                    className="text-blue-600 font-bold hover:underline"
                >
                    Create one
                </button>
            </div>
        </div>
    );
};
