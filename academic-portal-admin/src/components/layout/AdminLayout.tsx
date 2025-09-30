'use client';

import React, { useState } from 'react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = mockUser; // Replace with actual user from auth context

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // Implement global search functionality
  };

  const handleQuickCreate = (type: string) => {
    console.log('Quick create:', type);
    // Implement quick create modals
  };

  const handleLogout = () => {
    console.log('Logout');
    // Implement logout functionality
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