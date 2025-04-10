import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');
  return (
    <div className="flex items-center justify-center p-10 h-64">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-darkGray font-medium">{displayMessage}</p>
      </div>
    </div>
  );
}