'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface BadgeCounts {
  users: number;
  documents: number;
  support: number;
  announcements: number;
  fees: number;
}

interface BadgeContextType {
  badgeCounts: BadgeCounts;
  clearBadge: (module: keyof BadgeCounts) => void;
  refreshBadgeCounts: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    users: 0,
    documents: 0,
    support: 0,
    announcements: 0,
    fees: 0,
  });

  const refreshBadgeCounts = async () => {
    try {
      // Check if user is authenticated by checking localStorage
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const currentUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      
      // Skip fetching if user is not authenticated
      if (!authToken || !currentUser) {
        console.log('⏭️ Skipping badge counts refresh - user not authenticated');
        return;
      }

      // Fetch all badge counts in parallel
      const [usersResponse, documentsResponse, supportResponse, announcementsResponse, feesResponse] = await Promise.all([
        api.getUsers(1, 1, undefined, undefined, undefined, 'inactive'),
        api.getDocuments(1, 1),
        api.getSupportTickets(1, 1, 'pending'),
        api.getAnnouncements(1, 1),
        api.getPayments(1, 1),
      ]);

      const newCounts: BadgeCounts = {
        users: usersResponse.success && usersResponse.data ? (usersResponse.data.total || 0) : 0,
        documents: documentsResponse.success && documentsResponse.data ? (documentsResponse.data.total || 0) : 0,
        support: supportResponse.success && supportResponse.data ? (supportResponse.data.total || 0) : 0,
        announcements: announcementsResponse.success && announcementsResponse.data ? (announcementsResponse.data.total || 0) : 0,
        fees: feesResponse.success && feesResponse.data ? (feesResponse.data.total || 0) : 0,
      };

      setBadgeCounts(newCounts);
    } catch (error) {
      console.error('Failed to fetch badge counts:', error);
    }
  };

  const clearBadge = (module: keyof BadgeCounts) => {
    setBadgeCounts(prev => ({
      ...prev,
      [module]: 0,
    }));
  };

  useEffect(() => {
    // Initial fetch
    refreshBadgeCounts();

    // Refresh counts every 5 minutes
    const interval = setInterval(refreshBadgeCounts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BadgeContext.Provider value={{ badgeCounts, clearBadge, refreshBadgeCounts }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
}
