'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { api, SendMessageRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: number[];
  userCount: number;
}

export function SendMessageDialog({ 
  open, 
  onOpenChange, 
  userIds,
  userCount 
}: SendMessageDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SendMessageRequest>({
    user_ids: userIds,
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const response = await api.sendMessage(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Message sent to ${userCount} user(s)`,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        user_ids: [],
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate({
      ...formData,
      user_ids: userIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send Message to Users</DialogTitle>
            <DialogDescription>
              Send a notification message to {userCount} selected user(s).
              They will receive this as a push notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter message title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your message here..."
                rows={5}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.message.length} / 500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Message Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sendMessageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
