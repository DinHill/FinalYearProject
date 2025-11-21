"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { clearAuthToken } from '@/lib/api';

let showDialogCallback: ((show: boolean) => void) | null = null;

// Global function to trigger session expiration
export function triggerSessionExpired() {
  if (showDialogCallback) {
    showDialogCallback(true);
  }
}

export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Register the callback
    showDialogCallback = setOpen;

    return () => {
      showDialogCallback = null;
    };
  }, []);

  const handleSignIn = () => {
    // Clear auth token
    clearAuthToken();
    
    // Close dialog
    setOpen(false);
    
    // Redirect to login
    router.push('/login');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired. Please sign in again to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleSignIn}>
            Sign In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
