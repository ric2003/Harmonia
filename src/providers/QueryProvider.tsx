'use client';

import { QueryClient } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

function createFallbackPersister(primaryKey: string = 'WATER_WISE_QUERY_CACHE'): Persister {
  
  // In-memory fallback when nothing else works
  const memoryStorage: Record<string, unknown> = {};
  
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        // Try IndexedDB first
        await set(primaryKey, client);
      } catch (error: Error | unknown) {
        console.error('Error persisting client', error);
        try {
          // Fall back to sessionStorage if IndexedDB fails
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(primaryKey, JSON.stringify(client));
          }
        } catch (error: Error | unknown) {
          console.error('Error persisting client to sessionStorage', error);
          // If even sessionStorage fails, use memory
          memoryStorage[primaryKey] = client;
        }
      }
    },
    
    restoreClient: async () => {
      try {
        // Try IndexedDB first
        const idbData = await get<PersistedClient>(primaryKey);
        if (idbData) return idbData;
        
        // Try sessionStorage next
        if (typeof sessionStorage !== 'undefined') {
          const sessionData = sessionStorage.getItem(primaryKey);
          if (sessionData) return JSON.parse(sessionData);
        }
        
        // Finally try memory
        return memoryStorage[primaryKey] as PersistedClient | undefined;
      } catch (error: Error | unknown) {
        console.error('Error restoring client', error);
        // If IndexedDB fails, try sessionStorage
        try {
          if (typeof sessionStorage !== 'undefined') {
            const sessionData = sessionStorage.getItem(primaryKey);
            if (sessionData) return JSON.parse(sessionData);
          }
        } catch (error: Error | unknown) {
          console.error('Error restoring client from sessionStorage', error);
          // If even sessionStorage fails, use memory
          return memoryStorage[primaryKey] as PersistedClient | undefined;
        }
      }
      return undefined;
    },
    
    removeClient: async () => {
      try {
        // Try to remove from all storage methods
        await del(primaryKey);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(primaryKey);
        }
        delete memoryStorage[primaryKey];
      } catch (error) {
        // Catch errors but continue
        console.error('Error removing persisted client', error);
      }
    },
  };
}

// Configure cache time constants
const ONE_DAY = 1000 * 60 * 60 * 24;
const SEVEN_DAYS = ONE_DAY * 7; // Default cache duration

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient with appropriate gcTime
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        gcTime: SEVEN_DAYS, // Prevent data from being garbage collected for 7 days
        staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
      },
    },
  }));

  // Create persister with fallbacks for incognito mode
  const [persister] = useState(() => createFallbackPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: SEVEN_DAYS, // Cache data can be used for up to 7 days
      }}
      onSuccess={() => {
        // Optional: Log when persistence is successfully initialized
        console.log('Query cache has been successfully restored');
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
} 