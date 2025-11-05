import React from 'react';
import { getExpirationInfo, getExpirationStatusMessage, getExpirationStatusColor } from '@/lib/expirationUtils';

interface ExpirationBadgeProps {
  expiresAt: Date | string;
  createdAt?: Date | string;
  className?: string;
}

export function ExpirationBadge({ expiresAt, createdAt, className = '' }: ExpirationBadgeProps) {
  const expirationInfo = getExpirationInfo(expiresAt, createdAt);
  const statusMessage = getExpirationStatusMessage(expirationInfo);
  const statusColor = getExpirationStatusColor(expirationInfo);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor} ${className}`}>
      {statusMessage}
    </span>
  );
}

export default ExpirationBadge;
