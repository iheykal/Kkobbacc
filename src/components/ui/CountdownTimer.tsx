import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
  showSeconds?: boolean;
  compact?: boolean;
}

export function CountdownTimer({ 
  expiresAt, 
  className = '', 
  showSeconds = true,
  compact = false 
}: CountdownTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getCountdownTime = () => {
    const expirationDate = new Date(expiresAt);
    const now = currentTime;
    const diff = expirationDate.getTime() - now.getTime();

    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { expired: false, days, hours, minutes, seconds };
  };

  const getCountdownColor = () => {
    const countdown = getCountdownTime();
    
    if (countdown.expired) return 'text-red-600 bg-red-100';
    if (countdown.days <= 1) return 'text-red-500 bg-red-50';
    if (countdown.days <= 3) return 'text-orange-600 bg-orange-100';
    if (countdown.days <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatCountdown = () => {
    const countdown = getCountdownTime();
    
    if (countdown.expired) {
      return 'Expired';
    }

    if (compact) {
      const parts = [];
      if (countdown.days > 0) parts.push(`${countdown.days}d`);
      if (countdown.hours > 0) parts.push(`${countdown.hours}h`);
      if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`);
      if (showSeconds && countdown.seconds > 0) parts.push(`${countdown.seconds}s`);
      
      return parts.length > 0 ? parts.join(' ') : 'Expiring now';
    }

    const parts = [];
    if (countdown.days > 0) parts.push(`${countdown.days}d`);
    if (countdown.hours > 0) parts.push(`${countdown.hours}h`);
    if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`);
    if (showSeconds && countdown.seconds > 0) parts.push(`${countdown.seconds}s`);

    return parts.length > 0 ? parts.join(' ') : 'Expiring now';
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCountdownColor()} ${className}`}>
      {formatCountdown()}
    </span>
  );
}

export default CountdownTimer;
