'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { EnhancedTopbar } from './EnhancedTopbar';
import { ToastContainer } from '@/components/ui/toast';
import { GlobalSearch } from '@/components/GlobalSearch';
import { AdminUser, AdminRole } from '@/lib/auth';
import { api } from '@/lib/api';

interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  role: string;
  username: string;
  campus?: {
    id: number;
    name: string;
    code: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get<UserProfile>('/api/v1/me/profile');
        const profile = response.data;
        
        // Convert to AdminUser format
        const adminUser: AdminUser = {
          uid: profile.uid,
          email: profile.email,
          name: profile.full_name,
          role: profile.role as AdminRole,
          campus: profile.campus?.code,
          status: profile.status as 'active' | 'inactive' | 'suspended',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at),
        };
        
        setUser(adminUser);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Redirect to login if not authenticated
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = () => {
    // Open global search modal
    setSearchOpen(true);
  };

  const handleQuickCreate = (type: string) => {
    // Quick create modals deferred - requires extensive modal component development
    const routes: Record<string, string> = {
      user: '/users/new',
      course: '/academics/courses/new',
      announcement: '/announcements/new',
    };
    if (routes[type]) {
      router.push(routes[type]);
    }
  };

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to revoke tokens
      await api.post('/api/v1/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('admin_token');
      // Redirect to login
      router.push('/login');
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading state while fetching user
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-brand-background">
      {/* Sidebar */}
      <AdminSidebar 
        userRole={user.role}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <div className="border-b bg-white">
          <EnhancedTopbar 
            user={user}
            onSearch={handleSearch}
            onQuickCreate={handleQuickCreate}
            onLogout={handleLogout}
            onToggleSidebar={handleToggleSidebar}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-brand-background">
          {children}
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer />

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}