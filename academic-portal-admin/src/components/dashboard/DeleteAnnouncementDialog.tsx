"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api, type Announcement } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface DeleteAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
}

export function DeleteAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
}: DeleteAnnouncementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.deleteAnnouncement(id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to delete announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!announcement) return;
    deleteAnnouncementMutation.mutate(announcement.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete this announcement?
            </p>
            {announcement && (
              <div className="p-3 bg-muted rounded-md mt-2">
                <p className="font-medium text-foreground">
                  {announcement.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {announcement.content}
                </p>
              </div>
            )}
            <p className="text-destructive font-medium mt-2">
              This action cannot be undone. The announcement will be permanently
              removed from the system.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAnnouncementMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteAnnouncementMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteAnnouncementMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Announcement"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
