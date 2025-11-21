'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type SupportTicket } from '@/lib/api';
import { toast } from 'sonner';
import { MessageCircle, Loader2, Lock } from 'lucide-react';

interface ReplyToTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
}

export function ReplyToTicketDialog({ open, onOpenChange, ticket }: ReplyToTicketDialogProps) {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { ticketId: number; message: string; isInternal: boolean }) => {
      const result = await api.replyToTicket(data.ticketId, data.message, data.isInternal);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send reply');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Reply sent successfully');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      onOpenChange(false);
      setMessage('');
      setIsInternal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket) {
      toast.error('No ticket selected');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (message.length > 5000) {
      toast.error('Message must be less than 5000 characters');
      return;
    }

    mutation.mutate({
      ticketId: ticket.id,
      message: message.trim(),
      isInternal,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
      setMessage('');
      setIsInternal(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Reply to Ticket #{ticket?.id}
          </DialogTitle>
          <DialogDescription>
            Send a reply to this support ticket. The user will be notified via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-4">
          {/* Ticket Info */}
          {ticket && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">
                {ticket.subject}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Your Reply <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply here..."
              rows={8}
              maxLength={5000}
              required
              disabled={mutation.isPending}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {message.length}/5000 characters
              </p>
              {message.length > 4900 && (
                <p className="text-xs text-destructive">
                  {5000 - message.length} characters remaining
                </p>
              )}
            </div>
          </div>

          {/* Internal Note Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
            <Checkbox
              id="internal"
              checked={isInternal}
              onCheckedChange={(checked) => setIsInternal(checked === true)}
              disabled={mutation.isPending}
            />
            <div className="flex items-start gap-2 flex-1">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <Label
                  htmlFor="internal"
                  className="text-sm font-medium cursor-pointer text-amber-900 dark:text-amber-100"
                >
                  Internal Note
                </Label>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Only visible to staff members. Student will not receive this message.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !message.trim()}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
