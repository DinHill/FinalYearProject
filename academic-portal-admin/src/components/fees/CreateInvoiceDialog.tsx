"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    student_id: '',
    semester_id: '',
    invoice_number: '',
    issue_date: new Date(),
    due_date: new Date(),
    notes: ''
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      student_id: number;
      semester_id: number;
      invoice_number: string;
      issue_date: string;
      due_date: string;
      total_amount: number;
      lines: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        amount: number;
      }>;
    }) => {
      const result = await api.createInvoice(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    }
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      semester_id: '',
      invoice_number: '',
      issue_date: new Date(),
      due_date: new Date(),
      notes: ''
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lines = lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount
    }));

    createMutation.mutate({
      ...formData,
      student_id: parseInt(formData.student_id),
      semester_id: parseInt(formData.semester_id),
      issue_date: format(formData.issue_date, 'yyyy-MM-dd'),
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
      total_amount: totalAmount,
      lines
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Create New Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogBody className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student_id">Student ID *</Label>
              <Input
                id="student_id"
                type="number"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="semester_id">Semester ID *</Label>
              <Input
                id="semester_id"
                type="number"
                required
                value={formData.semester_id}
                onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                required
                placeholder="INV-2024-001"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>

            <div>
              <Label>Issue Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.issue_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.issue_date}
                    onSelect={(date: Date | undefined) => date && setFormData({ ...formData, issue_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.due_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date: Date | undefined) => date && setFormData({ ...formData, due_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Line Items</Label>
              <Button type="button" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <Input value={item.amount.toFixed(2)} readOnly disabled />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <div className="text-lg font-semibold">
                Total: ₫{totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto w-full">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white sm:w-auto w-full">
              {createMutation.isPending ? (
                <>
                  <Plus className="h-4 w-4 mr-2 animate-pulse" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
