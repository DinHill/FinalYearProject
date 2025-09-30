'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  FolderOpen,
  DollarSign,
  Megaphone,
  HeadphonesIcon,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminRole, hasPermission } from '@/lib/auth';

interface SidebarProps {
  userRole: AdminRole;
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    module: 'dashboard' as const,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    module: 'users' as const,
  },
  {
    name: 'Content',
    href: '/content',
    icon: FileText,
    module: 'content' as const,
  },
  {
    name: 'Academics',
    href: '/academics',
    icon: GraduationCap,
    module: 'academics' as const,
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FolderOpen,
    module: 'documents' as const,
  },
  {
    name: 'Fees',
    href: '/fees',
    icon: DollarSign,
    module: 'fees' as const,
  },
  {
    name: 'Announcements',
    href: '/announcements',
    icon: Megaphone,
    module: 'announcements' as const,
  },
  {
    name: 'Support',
    href: '/support',
    icon: HeadphonesIcon,
    module: 'support' as const,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    module: 'analytics' as const,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    module: 'settings' as const,
  },
];

export function Sidebar({ userRole, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Filter navigation items based on user role permissions
  const allowedNavigation = navigation.filter(item => 
    hasPermission(userRole, item.module, 'read')
  );

  return (
    <div className={cn(
      "bg-gray-900 text-white transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            <span className="text-lg font-semibold">Admin Portal</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {allowedNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    isCollapsed ? "h-6 w-6" : "h-5 w-5 mr-3"
                  )} />
                  {!isCollapsed && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Role Badge */}
      {!isCollapsed && (
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400">Logged in as</div>
            <div className="text-sm font-medium capitalize">
              {userRole.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}