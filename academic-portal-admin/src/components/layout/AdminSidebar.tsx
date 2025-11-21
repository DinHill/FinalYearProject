"use client";

import {
  DollarSign,
  GraduationCap,
  HelpCircle,
  Home,
  Megaphone,
  PieChart,
  Settings,
  ShieldAlert,
  UserCircle2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useBadges } from "@/contexts/BadgeContext";

interface AdminSidebarProps {
  userRole: string;
  isCollapsed: boolean;
}

const moduleAccess = {
  "super-admin": ["dashboard", "users", "academics", "fees", "announcements", "support", "analytics", "audit", "profile"],
  "super_admin": ["dashboard", "users", "academics", "fees", "announcements", "support", "analytics", "audit", "profile"],
  "academic-admin": ["dashboard", "academics", "announcements", "analytics", "profile"],
  "finance-admin": ["dashboard", "fees", "analytics", "profile"],
  "support-admin": ["dashboard", "support", "announcements", "profile"],
  "teacher": ["dashboard", "academics", "profile"],
  "student": ["profile"]
};
const modules = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "users", label: "Users", icon: Users, href: "/users" },
  { id: "academics", label: "Academics", icon: GraduationCap, href: "/academics" },
  { id: "fees", label: "Fees", icon: DollarSign, href: "/fees" },
  { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
  { id: "support", label: "Support", icon: HelpCircle, href: "/support" },
  { id: "analytics", label: "Analytics", icon: PieChart, href: "/analytics" },
  { id: "audit", label: "Audit Logs", icon: ShieldAlert, href: "/audit" },
  { id: "profile", label: "My Profile", icon: UserCircle2, href: "/profile" },
];

export function AdminSidebar({ userRole, isCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const allowedModules = moduleAccess[userRole as keyof typeof moduleAccess] || [];
  const { badgeCounts, clearBadge } = useBadges();

  const getCurrentPage = () => {
    const path = pathname.split('/')[1];
    return path || 'dashboard';
  };

  const currentPage = getCurrentPage();

  const handleModuleClick = (moduleId: string) => {
    // Clear the badge when clicking on the module
    if (moduleId === 'users' || moduleId === 'documents' || moduleId === 'support' || 
        moduleId === 'announcements' || moduleId === 'fees') {
      clearBadge(moduleId as 'users' | 'documents' | 'support' | 'announcements' | 'fees');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="px-3 py-5 border-b border-gray-200 h-24 flex items-center bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 w-full h-full">
          {!isCollapsed ? (
            <div className="w-full h-full flex items-center justify-center">
              <Image 
                src="/Gw_Logo.webp" 
                alt="University of Greenwich Logo"
                width={240}
                height={60}
                className="w-full h-auto max-h-full object-contain"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image 
                src="/Gw_Logo_Small.jpg" 
                alt="Greenwich Compass Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
                priority
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {modules.map((module) => {
          const isAllowed = allowedModules.includes(module.id);
          const isActive = currentPage === module.id;
          const Icon = module.icon;

          if (!isAllowed) return null;

          return (
            <div key={module.id} className="relative">
              <Link href={module.href} onClick={() => handleModuleClick(module.id)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-11 ${isCollapsed ? 'px-2' : 'px-3'} text-sm font-medium transition-all duration-200 relative group ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#007AC3]/10 to-[#007AC3]/5 text-[#007AC3] hover:from-[#007AC3]/15 hover:to-[#007AC3]/8 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#007AC3] to-[#F36C21] rounded-r-full" />
                )}
                
                <div className={`${isActive ? 'bg-white' : 'bg-gray-100 group-hover:bg-white'} ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg flex items-center justify-center transition-all duration-200 ${isCollapsed ? '' : 'mr-3'}`}>
                  <Icon className={`${isCollapsed ? 'w-4 h-4' : 'w-4.5 h-4.5'} ${isActive ? 'text-[#007AC3]' : 'text-gray-600 group-hover:text-[#007AC3]'} transition-colors flex-shrink-0`} />
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left font-semibold">{module.label}</span>
                    {(module.id === 'users' && badgeCounts.users > 0) && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto h-6 px-2 text-xs font-bold bg-gradient-to-r from-[#007AC3] to-[#0088CC] text-white border-0 shadow-sm"
                      >
                        {badgeCounts.users}
                      </Badge>
                    )}
                    {(module.id === 'documents' && badgeCounts.documents > 0) && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto h-6 px-2 text-xs font-bold bg-gradient-to-r from-[#007AC3] to-[#0088CC] text-white border-0 shadow-sm"
                      >
                        {badgeCounts.documents}
                      </Badge>
                    )}
                    {(module.id === 'support' && badgeCounts.support > 0) && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto h-6 px-2 text-xs font-bold bg-gradient-to-r from-[#007AC3] to-[#0088CC] text-white border-0 shadow-sm"
                      >
                        {badgeCounts.support}
                      </Badge>
                    )}
                    {(module.id === 'announcements' && badgeCounts.announcements > 0) && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto h-6 px-2 text-xs font-bold bg-gradient-to-r from-[#007AC3] to-[#0088CC] text-white border-0 shadow-sm"
                      >
                        {badgeCounts.announcements}
                      </Badge>
                    )}
                    {(module.id === 'fees' && badgeCounts.fees > 0) && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto h-6 px-2 text-xs font-bold bg-gradient-to-r from-[#007AC3] to-[#0088CC] text-white border-0 shadow-sm"
                      >
                        {badgeCounts.fees}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
              </Link>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {module.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}