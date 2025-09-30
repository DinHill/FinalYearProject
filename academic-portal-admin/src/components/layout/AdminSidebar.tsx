"use client";

import {
  BookOpen,
  Building2,
  DollarSign,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Megaphone,
  PieChart,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";

interface AdminSidebarProps {
  userRole: string;
  isCollapsed: boolean;
}

const moduleAccess = {
  "super-admin": ["dashboard", "users", "content", "academics", "documents", "fees", "announcements", "support", "analytics", "settings"],
  "academic-admin": ["dashboard", "academics", "announcements", "analytics"],
  "content-admin": ["dashboard", "content", "announcements"],
  "finance-admin": ["dashboard", "fees", "analytics"],
  "support-admin": ["dashboard", "documents", "support", "announcements"]
};

const modules = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "users", label: "Users", icon: Users, href: "/users" },
  { id: "content", label: "Content", icon: FileText, href: "/content" },
  { id: "academics", label: "Academics", icon: GraduationCap, href: "/academics" },
  { id: "documents", label: "Documents", icon: BookOpen, href: "/documents", badge: "12" },
  { id: "fees", label: "Fees", icon: DollarSign, href: "/fees" },
  { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
  { id: "support", label: "Support", icon: HelpCircle, href: "/support", badge: "3" },
  { id: "analytics", label: "Analytics", icon: PieChart, href: "/analytics" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function AdminSidebar({ userRole, isCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const allowedModules = moduleAccess[userRole as keyof typeof moduleAccess] || [];

  const getCurrentPage = () => {
    const path = pathname.split('/')[1];
    return path || 'dashboard';
  };

  const currentPage = getCurrentPage();

  return (
    <div className={`flex flex-col h-full sidebar-background border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-semibold text-sidebar-foreground">Academic Portal</div>
              <div className="text-xs text-muted-foreground">Admin Dashboard</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1">
        {modules.map((module) => {
          const isAllowed = allowedModules.includes(module.id);
          const isActive = currentPage === module.id;
          const Icon = module.icon;

          if (!isAllowed) return null;

          return (
            <Button
              key={module.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${isCollapsed ? 'px-2' : 'px-3'} text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
              onClick={() => router.push(module.href)}
            >
              <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{module.label}</span>
                  {module.badge && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto h-5 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    >
                      {module.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </div>

      {/* Role indicator */}
      {!isCollapsed && (
        <>
          <Separator className="mx-3" />
          <div className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Current Role</div>
            <Badge 
              variant="outline" 
              className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700"
            >
              {userRole.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}