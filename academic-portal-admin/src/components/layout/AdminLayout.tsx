'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { EnhancedTopbar } from './EnhancedTopbar';
import { ToastContainer } from '@/components/ui/toast';
import { AdminUser, AdminRole } from '@/lib/auth';

// Mock user data - replace with actual auth context
const mockUser: AdminUser = {
  uid: 'admin123',
  email: 'admin@greenwich.edu.vn',
  name: 'John Smith',
  role: 'super-admin' as AdminRole,
  campus: 'danang',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = mockUser; // Replace with actual user from auth context

  const handleSearch = (query: string) => {
    // TODO: Implement global search functionality
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleQuickCreate = (type: string) => {
    // TODO: Implement quick create modals
    const routes: Record<string, string> = {
      user: '/users/new',
      course: '/academics/courses/new',
      announcement: '/announcements/new',
    };
    if (routes[type]) {
      router.push(routes[type]);
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality with proper auth
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <AdminSidebar 
        userRole={user.role}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <EnhancedTopbar 
          user={user}
          onSearch={handleSearch}
          onQuickCreate={handleQuickCreate}
          onLogout={handleLogout}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}