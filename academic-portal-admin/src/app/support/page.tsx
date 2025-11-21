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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  HeadphonesIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  User,
  Calendar,
  Tag,
  Filter,
  MoreHorizontal,
  Reply,
  Archive,
  Forward,
  FileText,
  DollarSign,
  XCircle,
  Upload,
  Eye,
  Edit
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, type SupportTicket, type DocumentRequest } from '@/lib/api';
import { useState } from 'react';
import { CreateTicketDialog } from '@/components/support/CreateTicketDialog';
import { ReplyToTicketDialog } from '@/components/support/ReplyToTicketDialog';
import { AssignTicketDialog } from '@/components/support/AssignTicketDialog';
import { ViewDocumentRequestDialog } from '@/components/support/ViewDocumentRequestDialog';
import { UpdateDocumentRequestDialog } from '@/components/support/UpdateDocumentRequestDialog';
import { UploadDocumentForRequestDialog } from '@/components/support/UploadDocumentForRequestDialog';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Document request dialogs state
  const [isViewRequestDialogOpen, setIsViewRequestDialogOpen] = useState(false);
  const [isUpdateRequestDialogOpen, setIsUpdateRequestDialogOpen] = useState(false);
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);

  // Fetch support tickets from API
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const result = await api.getSupportTickets(1, 20);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch support tickets');
    },
  });

  // Fetch support stats
  const { data: statsData } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const result = await api.getSupportStats();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch support stats');
    },
  });

  const tickets = ticketsData?.items || [];
  const stats = statsData;

  // Fetch document requests from API
  const { data: documentRequestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['document-requests'],
    queryFn: async () => {
      const result = await api.getDocumentRequests(1, 100);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch document requests');
    },
  });

  const documentRequests = documentRequestsData?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {status === 'submitted' ? 'Submitted' : 'Open'}
        </Badge>;
      case 'In Progress':
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {status === 'processing' ? 'Processing' : 'In Progress'}
        </Badge>;
      case 'Resolved':
      case 'ready':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {status === 'ready' ? 'Ready' : 'Resolved'}
        </Badge>;
      case 'Closed':
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          {status === 'rejected' ? 'Rejected' : 'Closed'}
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical':
        return <Tag className="w-4 h-4 text-blue-600" />;
      case 'Academic':
        return <Tag className="w-4 h-4 text-green-600" />;
      case 'Financial':
        return <Tag className="w-4 h-4 text-yellow-600" />;
      case 'Services':
        return <Tag className="w-4 h-4 text-purple-600" />;
      default:
        return <Tag className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Student Services' }]}
        subtitle="Manage support tickets and document requests"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button 
              size="sm" 
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={() => {
                if (activeTab === 'tickets') {
                  setIsCreateTicketDialogOpen(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'tickets' ? 'Create Ticket' : 'New Request'}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="documents">Document Requests</TabsTrigger>
          </TabsList>

          {/* SUPPORT TICKETS TAB */}
          <TabsContent value="tickets" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Open Tickets</p>
                      <p className="text-xl font-semibold">{stats?.open_tickets || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-xl font-semibold">{stats?.in_progress_tickets || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved Today</p>
                      <p className="text-xl font-semibold">{stats?.resolved_tickets || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Response</p>
                      <p className="text-xl font-semibold">
                        {stats?.avg_response_time ? `${stats.avg_response_time.toFixed(1)}h` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tickets List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Support Tickets</CardTitle>
                    <CardDescription>Help desk and technical support management</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Search tickets..." 
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No support tickets found</div>
                  ) : (
                    tickets.map((ticket: SupportTicket) => (
                      <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(ticket.category || 'general')}
                            <div>
                              <h3 className="text-sm font-medium text-foreground">
                                #{ticket.id}: {ticket.subject}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {ticket.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Student: {ticket.user_id}
                            </span>
                            {ticket.assigned_to && (
                              <>
                                <span>•</span>
                                <span>Assigned to: {ticket.assigned_to}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsReplyDialogOpen(true);
                              }}
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsAssignDialogOpen(true);
                              }}
                            >
                              <Forward className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTicket(ticket);
                                  setIsReplyDialogOpen(true);
                                }}>
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTicket(ticket);
                                  setIsAssignDialogOpen(true);
                                }}>
                                  <User className="w-4 h-4 mr-2" />
                                  Assign
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENT REQUESTS TAB */}
          <TabsContent value="documents" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-xl font-semibold">
                        {documentRequests.filter((r: DocumentRequest) => r.status === 'pending' || r.status === 'processing').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ready</p>
                      <p className="text-xl font-semibold">
                        {documentRequests.filter((r: DocumentRequest) => r.status === 'ready').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cancelled</p>
                      <p className="text-xl font-semibold">
                        {documentRequests.filter((r: DocumentRequest) => r.status === 'cancelled').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                      <p className="text-xl font-semibold font-mono">
                        ₫{(documentRequests.reduce((sum: number, r: DocumentRequest) => sum + (r.fee_amount || 0), 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document Requests Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Requests</CardTitle>
                    <CardDescription>Process and manage student document requests</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search requests..." 
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRequests ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading document requests...
                        </TableCell>
                      </TableRow>
                    ) : documentRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No document requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      documentRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono">#{request.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Student ID: {request.student_id}</div>
                              <div className="text-sm text-muted-foreground">STU{String(request.student_id).padStart(4, '0')}</div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {request.document_type.split('_').join(' ')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {request.fee_amount ? `₫${request.fee_amount.toLocaleString()}` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRequest(request);
                                  setIsViewRequestDialogOpen(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRequest(request);
                                  setIsUpdateRequestDialogOpen(true);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRequest(request);
                                  setIsUploadDocumentDialogOpen(true);
                                }}>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Document
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions - Below tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeadphonesIcon className="w-5 h-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>Manage FAQ and help articles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Articles</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Chat
              </CardTitle>
              <CardDescription>Enable real-time support chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Start Live Chat</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Service Analytics
              </CardTitle>
              <CardDescription>View service performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Reports</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog 
        open={isCreateTicketDialogOpen}
        onOpenChange={setIsCreateTicketDialogOpen}
      />

      {/* Reply to Ticket Dialog */}
      <ReplyToTicketDialog
        open={isReplyDialogOpen}
        onOpenChange={setIsReplyDialogOpen}
        ticket={selectedTicket}
      />

      {/* Assign Ticket Dialog */}
      <AssignTicketDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        ticket={selectedTicket}
      />

      {/* Document Request Dialogs */}
      <ViewDocumentRequestDialog
        open={isViewRequestDialogOpen}
        onOpenChange={setIsViewRequestDialogOpen}
        request={selectedRequest}
        onUpdateStatus={() => setIsUpdateRequestDialogOpen(true)}
        onUploadDocument={() => setIsUploadDocumentDialogOpen(true)}
      />

      <UpdateDocumentRequestDialog
        open={isUpdateRequestDialogOpen}
        onOpenChange={setIsUpdateRequestDialogOpen}
        request={selectedRequest}
      />

      <UploadDocumentForRequestDialog
        open={isUploadDocumentDialogOpen}
        onOpenChange={setIsUploadDocumentDialogOpen}
        request={selectedRequest}
      />
    </AdminLayout>
  );
}