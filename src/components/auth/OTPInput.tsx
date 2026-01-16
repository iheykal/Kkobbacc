'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

export default function OTPInput({
    length = 6,
    onComplete,
    disabled = false,
    autoFocus = true
}: OTPInputProps) {
    const [otp, setOTP] = useState<string[]>(Array(length).fill(''));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (autoFocus && inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, [autoFocus]);

    const handleChange = (index: number, value: string) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;

        const newOTP = [...otp];
        newOTP[index] = value.slice(-1); // Only take the last digit
        setOTP(newOTP);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }

        // Check if complete
        if (newOTP.every(digit => digit !== '')) {
            onComplete(newOTP.join(''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Move to previous input when backspace on empty field
                inputs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newOTP = [...otp];
                newOTP[index] = '';
                setOTP(newOTP);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim().slice(0, length);

        // Only accept if all characters are digits
        if (!/^\d+$/.test(pastedData)) return;

        const newOTP = pastedData.split('');
        const fullOTP = [...newOTP, ...Array(length - newOTP.length).fill('')];
        setOTP(fullOTP);

        // Focus the next empty input or the last one
        const nextEmptyIndex = newOTP.length < length ? newOTP.length : length - 1;
        inputs.current[nextEmptyIndex]?.focus();

        // Auto-submit if complete
        if (newOTP.length === length) {
            onComplete(pastedData);
        }
    };

    const handleFocus = (index: number) => {
        // Select the text when focusing
        inputs.current[index]?.select();
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={el => { inputs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    onFocus={() => handleFocus(index)}
                    disabled={disabled}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold border-2 border-gray-300 rounded-lg transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-400"
                    aria-label={`Digit ${index + 1} of ${length}`}
                />
            ))}
        </div>
    );
}
