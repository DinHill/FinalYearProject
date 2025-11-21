"use client";

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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: number | string;
    title?: string;
  } | null;
}

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  document,
}: DeleteDocumentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return await api.deleteDocument(id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!document?.id) return;
    deleteDocumentMutation.mutate(document.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this document?
          </p>
          {document?.title && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{document.title}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            This will permanently remove the document from the system. Students and teachers will no longer have access to it.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteDocumentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteDocumentMutation.isPending}
          >
            {deleteDocumentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
