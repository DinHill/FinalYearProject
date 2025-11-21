"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
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
import api from "@/lib/api";
import { Loader2, Megaphone } from "lucide-react";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
}: CreateAnnouncementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [priority, setPriority] = useState("normal");

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      target_audience: string;
      priority: string;
    }) => {
      return await api.createAnnouncement(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully",
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
          "Failed to create announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an announcement title",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an announcement message",
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

    if (message.length > 5000) {
      toast({
        title: "Validation Error",
        description: "Message must be less than 5000 characters",
        variant: "destructive",
      });
      return;
    }

    createAnnouncementMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      target_audience: targetAudience,
      priority: priority,
    });
  };

  const handleClose = () => {
    setTitle("");
    setMessage("");
    setTargetAudience("all");
    setPriority("normal");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-600" />
            Create Announcement
          </DialogTitle>
          <DialogDescription>
            Create a new announcement to notify users. Choose the target audience
            and priority level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogBody className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
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

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the full announcement message here..."
              className="min-h-[150px] resize-none"
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/5000 characters
            </p>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="audience">
              Target Audience <span className="text-red-500">*</span>
            </Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger id="audience">
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
            <p className="text-xs text-muted-foreground">
              Who should see this announcement
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              Priority Level <span className="text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - General Information</SelectItem>
                <SelectItem value="normal">Normal - Standard Notice</SelectItem>
                <SelectItem value="high">High - Important</SelectItem>
                <SelectItem value="urgent">Urgent - Immediate Action Required</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher priority announcements appear at the top
            </p>
          </div>

          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createAnnouncementMutation.isPending}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAnnouncementMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white sm:w-auto w-full"
            >
              {createAnnouncementMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Megaphone className="mr-2 h-4 w-4" />
                  Create Announcement
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
