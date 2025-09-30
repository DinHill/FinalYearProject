"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  FileText,
  GraduationCap,
  BookOpen,
  DollarSign,
  Megaphone,
  HelpCircle,
  PieChart,
  Settings,
  Plus,
  Calendar,
  Bell,
  Command,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "navigation" | "create" | "search" | "action";
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export function CommandPalette({ isOpen, onClose, userRole }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define all available commands
  const allCommands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Dashboard",
      description: "Go to dashboard",
      icon: <PieChart className="w-4 h-4" />,
      action: () => window.location.href = "/dashboard",
      category: "navigation",
      keywords: ["dashboard", "home", "overview"],
    },
    {
      id: "nav-users",
      title: "Users",
      description: "Manage users and accounts",
      icon: <Users className="w-4 h-4" />,
      action: () => window.location.href = "/users",
      category: "navigation",
      keywords: ["users", "students", "faculty", "accounts"],
    },
    {
      id: "nav-content",
      title: "Content",
      description: "Manage news and regulations",
      icon: <FileText className="w-4 h-4" />,
      action: () => window.location.href = "/content",
      category: "navigation",
      keywords: ["content", "news", "regulations", "articles"],
    },
    {
      id: "nav-academics",
      title: "Academics",
      description: "Manage programs and courses",
      icon: <GraduationCap className="w-4 h-4" />,
      action: () => window.location.href = "/academics",
      category: "navigation",
      keywords: ["academics", "programs", "courses", "curriculum"],
    },
    {
      id: "nav-documents",
      title: "Documents",
      description: "Document requests and types",
      icon: <BookOpen className="w-4 h-4" />,
      action: () => window.location.href = "/documents",
      category: "navigation",
      keywords: ["documents", "requests", "transcripts", "certificates"],
    },
    {
      id: "nav-fees",
      title: "Fees",
      description: "Fee management and invoices",
      icon: <DollarSign className="w-4 h-4" />,
      action: () => window.location.href = "/fees",
      category: "navigation",
      keywords: ["fees", "invoices", "payments", "billing"],
    },
    {
      id: "nav-announcements",
      title: "Announcements",
      description: "Send notifications",
      icon: <Megaphone className="w-4 h-4" />,
      action: () => window.location.href = "/announcements",
      category: "navigation",
      keywords: ["announcements", "notifications", "alerts"],
    },
    {
      id: "nav-support",
      title: "Support",
      description: "Help and feedback",
      icon: <HelpCircle className="w-4 h-4" />,
      action: () => window.location.href = "/support",
      category: "navigation",
      keywords: ["support", "help", "feedback", "tickets"],
    },
    {
      id: "nav-analytics",
      title: "Analytics",
      description: "Reports and insights",
      icon: <PieChart className="w-4 h-4" />,
      action: () => window.location.href = "/analytics",
      category: "navigation",
      keywords: ["analytics", "reports", "insights", "data"],
    },
    {
      id: "nav-settings",
      title: "Settings",
      description: "System configuration",
      icon: <Settings className="w-4 h-4" />,
      action: () => window.location.href = "/settings",
      category: "navigation",
      keywords: ["settings", "configuration", "preferences"],
    },

    // Quick Create Actions
    {
      id: "create-user",
      title: "Create User",
      description: "Add new student or faculty",
      icon: <Plus className="w-4 h-4" />,
      action: () => console.log("Create user"),
      category: "create",
      keywords: ["create", "user", "student", "faculty", "account"],
    },
    {
      id: "create-news",
      title: "Create News Article",
      description: "Write and publish news",
      icon: <Plus className="w-4 h-4" />,
      action: () => console.log("Create news"),
      category: "create",
      keywords: ["create", "news", "article", "publish"],
    },
    {
      id: "create-announcement",
      title: "Send Announcement",
      description: "Create notification",
      icon: <Plus className="w-4 h-4" />,
      action: () => console.log("Create announcement"),
      category: "create",
      keywords: ["create", "announcement", "notification", "alert"],
    },
    {
      id: "create-course",
      title: "Create Course",
      description: "Add new course",
      icon: <Plus className="w-4 h-4" />,
      action: () => console.log("Create course"),
      category: "create",
      keywords: ["create", "course", "class", "subject"],
    },

    // Search Actions
    {
      id: "search-users",
      title: "Search Users",
      description: "Find students and faculty",
      icon: <Search className="w-4 h-4" />,
      action: () => window.location.href = "/users?search=" + encodeURIComponent(query),
      category: "search",
      keywords: ["search", "find", "users", "students", "faculty"],
    },
    {
      id: "search-documents",
      title: "Search Documents",
      description: "Find document requests",
      icon: <Search className="w-4 h-4" />,
      action: () => window.location.href = "/documents?search=" + encodeURIComponent(query),
      category: "search",
      keywords: ["search", "find", "documents", "requests"],
    },
  ];

  // Filter commands based on role and query
  const filteredCommands = allCommands.filter(command => {
    // Basic text search
    const searchMatch = query === "" || 
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description?.toLowerCase().includes(query.toLowerCase()) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()));

    return searchMatch;
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selectedCommand = filteredCommands[selectedIndex];
      if (selectedCommand) {
        selectedCommand.action();
        onClose();
      }
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const categoryLabels = {
    navigation: "Navigation",
    create: "Create",
    search: "Search",
    action: "Actions",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4" />
            <DialogTitle>Command Palette</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Search for commands and navigate quickly
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-2 border-b">
          <Input
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus:ring-0 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-auto p-2">
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category} className="mb-4 last:mb-0">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </div>
              <div className="space-y-1">
                {commands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <Button
                      key={command.id}
                      variant="ghost"
                      className={`w-full justify-start h-auto p-2 ${
                        isSelected ? "bg-accent" : ""
                      }`}
                      onClick={() => {
                        command.action();
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="text-muted-foreground">
                          {command.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">
                            {command.title}
                          </div>
                          {command.description && (
                            <div className="text-xs text-muted-foreground">
                              {command.description}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No commands found for "{query}"
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <kbd className="px-1.5 py-0.5 bg-background border rounded">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-1.5 py-0.5 bg-background border rounded">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}