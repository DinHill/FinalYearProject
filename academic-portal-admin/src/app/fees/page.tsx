'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Filter,
  MoreHorizontal,
  Receipt,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, type Invoice, type Payment as ApiPayment, type FeeStructure } from '@/lib/api';
import { useState } from 'react';
import { CreateInvoiceDialog } from '@/components/fees/CreateInvoiceDialog';
import { EditInvoiceDialog } from '@/components/fees/EditInvoiceDialog';
import { RecordPaymentDialog } from '@/components/fees/RecordPaymentDialog';
import { DeleteInvoiceDialog } from '@/components/fees/DeleteInvoiceDialog';
import { toast } from 'sonner';

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Download PDF handler
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.info(`Generating PDF for invoice ${invoice.invoice_number}...`);
      const response = await api.get(`/api/v1/finance/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      
      if (response.success && response.data) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Invoice PDF downloaded successfully');
      } else {
        toast.error('Failed to download PDF');
      }
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const result = await api.getInvoices(1, 100); // Fetch more invoices
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch invoices');
    },
  });

  const allInvoices: Invoice[] = invoicesData?.items || [];

  // Fetch payments from API
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const result = await api.getPayments(1, 100);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch payments');
    },
  });

  const payments: ApiPayment[] = paymentsData?.items || [];

  // Fetch fee structures from API
  const { data: feeStructuresData, isLoading: isLoadingFeeStructures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const result = await api.getFeeStructures(1, 100, true); // Only active fee structures
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch fee structures');
    },
  });

  const feeStructures: FeeStructure[] = feeStructuresData?.items || [];

  // Apply filters and search
  const filteredInvoices = allInvoices.filter(invoice => {
    // Status filter
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        invoice.invoice_number.toLowerCase().includes(search) ||
        invoice.student_id.toString().includes(search) ||
        String(invoice.student_id).padStart(4, '0').includes(search)
      );
    }

    return true;
  });

  // Calculate stats safely (use all invoices, not filtered)
  const totalPaid = allInvoices.reduce((sum, invoice) => {
    const paid = Number(invoice.paid_amount) || 0;
    return sum + paid;
  }, 0);

  const totalOutstanding = allInvoices
    .filter(i => i.status === 'pending' || i.status === 'partial')
    .reduce((sum, invoice) => {
      const balance = Number(invoice.balance) || 0;
      return sum + balance;
    }, 0);

  const totalOverdue = allInvoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, invoice) => {
      const balance = Number(invoice.balance) || 0;
      return sum + balance;
    }, 0);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Paid
        </Badge>;
      case 'pending':
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {status}
        </Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      card: 'bg-blue-100 text-blue-800',
      bank: 'bg-green-100 text-green-800',
      cash: 'bg-yellow-100 text-yellow-800',
      check: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge variant="outline" className={`capitalize ${colors[method] || ''}`}>
        {method}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Fees & Invoices' }]}
        subtitle="Manage student fees, invoices, and payment records"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              size="sm" 
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="fee-tables">Fee Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Invoices</p>
                      <p className="text-xl font-semibold">{allInvoices.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-xl font-semibold font-mono">
                        ₫{(totalPaid / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-xl font-semibold font-mono">
                        ₫{(totalOutstanding / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <p className="text-xl font-semibold font-mono">
                        ₫{(totalOverdue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                      Manage student invoices and payment status
                      {(searchTerm || statusFilter !== 'all') && (
                        <span className="ml-2 text-brand-orange font-medium">
                          • Showing {filteredInvoices.length} of {allInvoices.length} invoices
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {(searchTerm || statusFilter !== 'all') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Search invoices..." 
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No invoices match your search criteria' 
                      : 'No invoices found'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Student ID: {invoice.student_id}</div>
                              <div className="text-sm text-muted-foreground">STU{String(invoice.student_id).padStart(4, '0')}</div>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.semester_id}</TableCell>
                          <TableCell className="font-mono">₫{invoice.total_amount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono">
                            <div>
                              <span>₫{invoice.paid_amount.toLocaleString()}</span>
                              {invoice.balance > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  ₫{invoice.balance.toLocaleString()} remaining
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-sm">{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsPaymentDialogOpen(true);
                                  }}
                                >
                                  <Receipt className="w-4 h-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel Invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payments</h3>
                <p className="text-sm text-muted-foreground">Track payment history and reconciliation</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Import Payments
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading payments...
                        </TableCell>
                      </TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono">#{payment.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Invoice #{payment.invoice_id}</div>
                              <div className="text-sm text-muted-foreground">Payment ID: {payment.id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">INV-{payment.invoice_id}</TableCell>
                          <TableCell className="font-mono">₫{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            {getPaymentMethodBadge(payment.payment_method)}
                          </TableCell>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.transaction_id || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fee-tables" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Fee Tables</h3>
                <p className="text-sm text-muted-foreground">Configure fee structures by program and term</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Fee Table
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {isLoadingFeeStructures ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Loading fee structures...
                  </CardContent>
                </Card>
              ) : feeStructures.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No fee structures found
                  </CardContent>
                </Card>
              ) : (
                feeStructures.map((feeStructure) => (
                  <Card key={feeStructure.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg capitalize">
                            {feeStructure.fee_type.replace(/_/g, ' ')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {feeStructure.academic_year || 'Academic Year'} • {feeStructure.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Fee
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-mono font-medium">
                              {feeStructure.currency === 'VND' ? '₫' : '$'}
                              {feeStructure.amount.toLocaleString()}
                            </span>
                          </div>
                          {feeStructure.description && (
                            <div className="text-sm text-muted-foreground pt-2 border-t">
                              {feeStructure.description}
                            </div>
                          )}
                        </div>
                        
                        {(feeStructure.effective_from || feeStructure.effective_to) && (
                          <div className="pt-2 border-t">
                            {feeStructure.effective_from && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Effective From:</span>
                                <span>{new Date(feeStructure.effective_from).toLocaleDateString()}</span>
                              </div>
                            )}
                            {feeStructure.effective_to && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Effective To:</span>
                                <span>{new Date(feeStructure.effective_to).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CRUD Dialogs */}
      <CreateInvoiceDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
      
      {selectedInvoice && (
        <>
          <EditInvoiceDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            invoice={selectedInvoice}
          />
          
          <RecordPaymentDialog
            open={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            invoice={selectedInvoice}
          />
          
          <DeleteInvoiceDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            invoice={selectedInvoice}
          />
        </>
      )}
    </AdminLayout>
  );
}
