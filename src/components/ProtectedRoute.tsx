'use client';

import { useUser } from "@clerk/nextjs";
import { ReactNode } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { t } = useTranslation();
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold text-primary">{t('auth.required.title')}</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {t('auth.required.message')}
        </p>
        <SignInButton mode="modal">
          <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            {t('navigation.signIn')}
          </button>
        </SignInButton>
      </div>
    );
  }

  return <>{children}</>;
} 