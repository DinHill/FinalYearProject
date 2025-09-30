"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Menu,
  Building2,
  Settings,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/ui/command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminUser } from "@/lib/auth";

interface EnhancedTopbarProps {
  user: AdminUser;
  onSearch: (query: string) => void;
  onQuickCreate: (type: string) => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const campuses = [
  { id: "main", name: "Main Campus" },
  { id: "danang", name: "Da Nang Campus" },
  { id: "cantho", name: "Can Tho Campus" },
  { id: "hanoi", name: "Ha Noi Campus" },
  { id: "hcm", name: "Ho Chi Minh Campus" },
];

const quickCreateOptions = [
  { id: "user", label: "New User", roles: ["super-admin", "academic-admin"] },
  { id: "news", label: "News Article", roles: ["super-admin", "content-admin"] },
  { id: "announcement", label: "Announcement", roles: ["super-admin", "academic-admin", "support-admin"] },
  { id: "document-type", label: "Document Type", roles: ["super-admin", "support-admin"] },
  { id: "invoice", label: "Invoice", roles: ["super-admin", "finance-admin"] },
];

export function EnhancedTopbar({ user, onSearch, onQuickCreate, onLogout, onToggleSidebar }: EnhancedTopbarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentCampus, setCurrentCampus] = useState(user.campus || "main");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [notifications] = useState([
    { id: 1, type: "urgent", message: "5 document requests overdue", time: "2h" },
    { id: 2, type: "info", message: "New user registration pending", time: "4h" },
    { id: 3, type: "warning", message: "Payment gateway maintenance scheduled", time: "1d" },
  ]);

  const allowedQuickCreate = quickCreateOptions.filter(option => 
    option.roles.includes(user.role)
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Forward slash for search focus
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== "INPUT" && activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          const searchInput = document.getElementById("global-search");
          searchInput?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-500";
      case "warning": return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            title="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </Button>

          {/* Global Search */}
          <div className="relative w-80 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <form onSubmit={handleSearch}>
              <input
                id="global-search"
                type="text"
                placeholder="Search users, documents, courses... (⌘K or /)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-9 pr-16 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCommandPalette(true)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Open command palette (⌘K)"
              >
                <Command className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Campus Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 border-border">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {campuses.find(c => c.id === currentCampus)?.name || "Main Campus"}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Select Campus</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {campuses.map((campus) => (
                <DropdownMenuItem
                  key={campus.id}
                  onClick={() => setCurrentCampus(campus.id)}
                  className={currentCampus === campus.id ? "bg-accent" : ""}
                >
                  {campus.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Create */}
          {allowedQuickCreate.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create</span>
                  <kbd className="hidden lg:inline ml-1 px-1 py-0.5 text-xs bg-primary-foreground/20 rounded">
                    N
                  </kbd>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allowedQuickCreate.map((option) => (
                  <DropdownMenuItem 
                    key={option.id}
                    onClick={() => onQuickCreate(option.id)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  Mark all read
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <div className="max-h-64 overflow-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)}`} />
                        <span className="text-sm flex-1">{notification.message}</span>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCommandPalette(true)}>
                <Command className="w-4 h-4 mr-2" />
                Command Palette
                <kbd className="ml-auto px-1 py-0.5 text-xs bg-muted rounded">⌘K</kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        userRole={user.role}
      />
    </>
  );
}