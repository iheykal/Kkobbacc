'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleAuthProviderWrapperProps {
    children: React.ReactNode;
}

export function GoogleAuthProviderWrapper({ children }: GoogleAuthProviderWrapperProps) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
        console.warn('Google Client ID is missing in environment variables');
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
