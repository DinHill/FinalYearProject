'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type DocumentRequest } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface UpdateDocumentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DocumentRequest | null;
}

export function UpdateDocumentRequestDialog({
  open,
  onOpenChange,
  request,
}: UpdateDocumentRequestDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');

  // Reset form when dialog opens with new request
  useState(() => {
    if (request && open) {
      setStatus(request.status);
      setAdminNotes('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error('No request selected');
      
      const result = await api.updateDocumentRequest(request.id, {
        status,
        admin_notes: adminNotes || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document request');
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success('Document request updated successfully');
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      onOpenChange(false);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Document Request</DialogTitle>
          <DialogDescription>
            Update the status of document request #{request.id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready for Pickup</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current status: <span className="font-medium capitalize">{request.status}</span>
            </p>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin_notes">Admin Notes</Label>
            <Textarea
              id="admin_notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this status update..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {adminNotes.length}/1000 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !status}
            >
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
