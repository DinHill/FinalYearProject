'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Bell, 
  User, 
  ChevronDown,
  LogOut,
  Menu,
  Building2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminUser } from '@/lib/auth';

interface TopbarProps {
  user: AdminUser;
  onSearch: (query: string) => void;
  onQuickCreate: (type: string) => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const campuses = [
  { id: 'main', name: 'Main Campus' },
  { id: 'danang', name: 'Da Nang Campus' },
  { id: 'cantho', name: 'Can Tho Campus' },
  { id: 'hanoi', name: 'Ha Noi Campus' },
  { id: 'hcm', name: 'Ho Chi Minh Campus' },
];

const quickCreateOptions = [
  { id: 'user', label: 'New User', roles: ['super-admin', 'academic-admin'] },
  { id: 'news', label: 'News Article', roles: ['super-admin', 'content-admin'] },
  { id: 'announcement', label: 'Announcement', roles: ['super-admin', 'academic-admin', 'support-admin'] },
  { id: 'document-type', label: 'Document Type', roles: ['super-admin', 'support-admin'] },
  { id: 'invoice', label: 'Invoice', roles: ['super-admin', 'finance-admin'] },
];

export function Topbar({ user, onSearch, onQuickCreate, onLogout, onToggleSidebar }: TopbarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [currentCampus, setCurrentCampus] = useState(user.campus || 'main');
  const [notifications] = useState([
    { id: 1, type: "urgent", message: "5 document requests overdue" },
    { id: 2, type: "info", message: "New user registration pending" },
    { id: 3, type: "warning", message: "Payment gateway maintenance scheduled" },
  ]);

  const allowedQuickCreate = quickCreateOptions.filter(option => 
    option.roles.includes(user.role)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Global Search */}
        <div className="relative w-80 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search users, documents, courses... (⌘K)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
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
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'urgent' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-sm">{notification.message}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="w-4 h-4 mr-2" />
              Profile
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
  );
}