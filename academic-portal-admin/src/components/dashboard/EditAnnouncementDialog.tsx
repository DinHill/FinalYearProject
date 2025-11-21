"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, type Announcement } from "@/lib/api";
import { Loader2, Save } from "lucide-react";

interface EditAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
}

export function EditAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
}: EditAnnouncementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("general");

  // Update form when announcement changes
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || "");
      setContent(announcement.content || "");
      setTargetAudience(announcement.target_audience || "all");
      setPriority(announcement.priority || "normal");
      setCategory(announcement.category || "general");
    }
  }, [announcement]);

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      title: string;
      content: string;
      target_audience: string;
      priority: string;
      category: string;
    }) => {
      return await api.updateAnnouncement(data.id, {
        title: data.title,
        content: data.content,
        target_audience: data.target_audience,
        priority: data.priority,
        category: data.category,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      handleClose();
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to update announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!announcement) return;

    // Validation
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an announcement title",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter announcement content",
        variant: "destructive",
      });
      return;
    }

    if (title.length > 200) {
      toast({
        title: "Validation Error",
        description: "Title must be less than 200 characters",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 5000) {
      toast({
        title: "Validation Error",
        description: "Content must be less than 5000 characters",
        variant: "destructive",
      });
      return;
    }

    updateAnnouncementMutation.mutate({
      id: announcement.id,
      title: title.trim(),
      content: content.trim(),
      target_audience: targetAudience,
      priority: priority,
      category: category,
    });
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setTargetAudience("all");
    setPriority("normal");
    setCategory("general");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update the announcement details. Changes will be visible to all users
            in the selected target audience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-6 px-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Important: Campus Closure Notice"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the full announcement content here..."
              className="min-h-[150px] resize-none"
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/5000 characters
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="edit-category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="edit-audience">
              Target Audience <span className="text-red-500">*</span>
            </Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger id="edit-audience">
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="students">Students Only</SelectItem>
                <SelectItem value="teachers">Teachers Only</SelectItem>
                <SelectItem value="admins">Admins Only</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="edit-priority">
              Priority Level <span className="text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="edit-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - General Information</SelectItem>
                <SelectItem value="normal">Normal - Standard Notice</SelectItem>
                <SelectItem value="high">High - Important</SelectItem>
                <SelectItem value="urgent">Urgent - Immediate Action Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>

          <DialogFooter className="px-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateAnnouncementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateAnnouncementMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              {updateAnnouncementMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
