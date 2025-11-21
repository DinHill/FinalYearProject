'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type SupportTicket, type User as UserType } from '@/lib/api';
import { toast } from 'sonner';
import { UserCog, Loader2, User } from 'lucide-react';

interface AssignTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
}

export function AssignTicketDialog({ open, onOpenChange, ticket }: AssignTicketDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch staff/admin users for assignment
  const { data: adminsData, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const result = await api.getUsers(1, 100, 'staff');
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch staff users');
    },
    enabled: open,
  });

  const admins = adminsData?.items || [];

  const mutation = useMutation({
    mutationFn: async (data: { ticketId: number; userId: number }) => {
      const result = await api.assignTicket(data.ticketId, data.userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign ticket');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Ticket assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      onOpenChange(false);
      setSelectedUserId('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign ticket');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket) {
      toast.error('No ticket selected');
      return;
    }

    if (!selectedUserId) {
      toast.error('Please select an admin user');
      return;
    }

    mutation.mutate({
      ticketId: ticket.id,
      userId: parseInt(selectedUserId),
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
      setSelectedUserId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            Assign Ticket #{ticket?.id}
          </DialogTitle>
          <DialogDescription>
            Assign this support ticket to an admin user for handling.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticket Info */}
          {ticket && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">
                {ticket.subject}
              </p>
              <p className="text-xs text-muted-foreground">
                Category: <span className="capitalize">{ticket.category || 'general'}</span> • 
                Priority: <span className="capitalize font-medium">{ticket.priority}</span>
              </p>
              {ticket.assigned_to && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Currently assigned to user ID: {ticket.assigned_to}
                </p>
              )}
            </div>
          )}

          {/* Admin User Selection */}
          <div className="space-y-2">
            <Label htmlFor="admin">
              Assign To <span className="text-destructive">*</span>
            </Label>
            {isLoadingAdmins ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading admin users...
              </div>
            ) : admins.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
                No admin users available
              </div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="admin">
                  <SelectValue placeholder="Select an admin user" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin: UserType) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{admin.full_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({admin.role.replace('_', ' ')})
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              The assigned admin will be responsible for handling this ticket
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedUserId || isLoadingAdmins}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCog className="w-4 h-4 mr-2" />
                  Assign Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
