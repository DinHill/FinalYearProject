'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ViewAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: any;
}

export function ViewAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
}: ViewAnnouncementDialogProps) {
  if (!announcement) return null;

  const getPriorityBadge = (priority: string) => {
    const normalizedPriority = priority?.toLowerCase() || 'normal';
    switch (normalizedPriority) {
      case 'high':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            High Priority
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Medium Priority
          </Badge>
        );
      case 'low':
      case 'normal':
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Normal Priority
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Priority and Audience */}
          <div className="flex flex-wrap gap-2">
            {getPriorityBadge(announcement.priority)}
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {announcement.target_audience}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(announcement.created_at).toLocaleDateString()}
            </Badge>
          </div>

          {/* Content */}
          <div className="mt-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>

          {/* Author */}
          {announcement.author && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              Posted by: <span className="font-medium">{announcement.author}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
