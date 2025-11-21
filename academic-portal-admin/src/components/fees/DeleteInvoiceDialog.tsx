import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { api, type Invoice } from '@/lib/api';
import { toast } from 'sonner';

interface DeleteInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function DeleteInvoiceDialog({ open, onOpenChange, invoice }: DeleteInvoiceDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await api.deleteInvoice(invoice.id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Invoice cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invoice');
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!invoice) return null;

  const hasPaidAmount = Number(invoice.paid_amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Invoice
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this invoice? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Invoice Number:</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Student ID:</span>
              <span className="font-medium">{invoice.student_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="font-medium">₫{Number(invoice.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid Amount:</span>
              <span className="font-medium">₫{Number(invoice.paid_amount).toLocaleString()}</span>
            </div>
          </div>

          {hasPaidAmount && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> This invoice has received payments. Cancelling will mark it as cancelled but payments will remain recorded.
              </p>
            </div>
          )}

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              The invoice status will be set to &ldquo;Cancelled&rdquo;. This action is permanent.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Cancelling...' : 'Cancel Invoice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
