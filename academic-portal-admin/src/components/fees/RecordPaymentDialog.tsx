import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { api, type Invoice } from '@/lib/api';
import { toast } from 'sonner';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function RecordPaymentDialog({ open, onOpenChange, invoice }: RecordPaymentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'bank',
    payment_date: new Date(),
    reference_number: '',
    notes: ''
  });

  const outstandingAmount = invoice ? (Number(invoice.total_amount) - Number(invoice.paid_amount)) : 0;

  const paymentMutation = useMutation({
    mutationFn: async (data: {
      invoice_id: number;
      amount: number;
      payment_method: string;
      payment_date: string;
      reference_number: string;
      notes: string;
    }) => {
      const result = await api.createPayment(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    }
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_method: 'bank',
      payment_date: new Date(),
      reference_number: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    if (amount > outstandingAmount) {
      toast.error('Amount exceeds outstanding balance');
      return;
    }

    paymentMutation.mutate({
      invoice_id: invoice.id,
      amount,
      payment_method: formData.payment_method,
      payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
      reference_number: formData.reference_number,
      notes: formData.notes
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment - {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-4">
        <div className="p-3 bg-muted rounded-lg space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="font-medium">₫{Number(invoice.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Paid:</span>
            <span className="font-medium">₫{Number(invoice.paid_amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="text-sm font-semibold">Outstanding:</span>
            <span className="font-bold text-primary">₫{outstandingAmount.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              max={outstandingAmount}
              step="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max: ₫{outstandingAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <Label>Payment Method *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.payment_date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date: Date | undefined) => date && setFormData({ ...formData, payment_date: date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              placeholder="Transaction/Check number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
