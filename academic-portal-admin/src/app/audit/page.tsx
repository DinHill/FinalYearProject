'use client';

import { useState } from 'react';
import { Shield, Activity, XCircle, TrendingUp, Eye, Download, Filter, RefreshCw, Search, CheckCircle, Clock, User, Server, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SmartPagination } from '@/components/ui/smart-pagination';

type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SECURITY' | 'ADMIN' | 'SYSTEM' | 'API_REQUEST';
type LogStatus = 'success' | 'failed' | 'pending';
type EntityType = 'User' | 'Course' | 'Grade' | 'Enrollment' | 'Document' | 'Invoice' | 'Announcement' | 'Setting' | 'Report';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: ActionType;
  entity: EntityType;
  entity_id: string;
  description: string;
  status: LogStatus;
  ip_address: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

interface AuditStats {
  total_logs: number;
  failed_operations: number;
  success_rate: number;
  most_common_action: string;
}

const getActionBadgeConfig = (action: ActionType) => {
  const configs = {
    CREATE: { color: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Create' },
    UPDATE: { color: 'bg-orange-100 text-orange-800 hover:bg-orange-100', label: 'Update' },
    DELETE: { color: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Delete' },
    LOGIN: { color: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Login' },
    LOGOUT: { color: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: 'Logout' },
    SECURITY: { color: 'bg-purple-100 text-purple-800 hover:bg-purple-100', label: 'Security' },
    ADMIN: { color: 'bg-pink-100 text-pink-800 hover:bg-pink-100', label: 'Admin' },
    SYSTEM: { color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100', label: 'System' },
    API_REQUEST: { color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100', label: 'API Request' },
  };
  return configs[action];
};

export default function AuditLogsPage() {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState({
    action: 'all',
    entity: 'all',
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });

  const { data: logsResponse, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', currentPage, filters],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      if (filters.action !== 'all') params.action_type = filters.action;
      if (filters.entity !== 'all') params.entity = filters.entity;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const result = await api.get<{
        logs: AuditLog[];
        total: number;
        page: number;
        page_size: number;
      }>('/api/v1/audit/logs', { params });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['audit-stats', filters],
    queryFn: async () => {
      const params: Record<string, any> = {};
      
      if (filters.action !== 'all') params.action_type = filters.action;
      if (filters.entity !== 'all') params.entity = filters.entity;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const result = await api.get<AuditStats>('/api/v1/audit/stats', { params });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics');
      }

      return result.data;
    },
  });

  const logs = logsResponse?.logs || [];
  const totalLogs = logsResponse?.total || 0;
  const totalPages = Math.ceil(totalLogs / 20);
  const stats = statsResponse || {
    total_logs: 0,
    failed_operations: 0,
    success_rate: 0,
    most_common_action: 'N/A',
  };

  const handleRefresh = async () => {
    toast.info('Refreshing audit logs...');
    await refetch();
    toast.success('Audit logs refreshed successfully');
  };

  const handleExport = async () => {
    try {
      toast.info('Exporting audit logs to CSV...');
      
      const params: Record<string, any> = {};
      if (filters.action !== 'all') params.action_type = filters.action;
      if (filters.entity !== 'all') params.entity = filters.entity;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const result = await api.get('/api/v1/audit/export', { params });
      
      if (result.success) {
        toast.success('CSV export completed successfully');
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      action: 'all',
      entity: 'all',
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          description="Monitor and track all system activities and security events"
          icon={Shield}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.total_logs.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-1">All recorded events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Failed Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{stats.failed_operations}</div>
              <p className="text-sm text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.success_rate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-1">System reliability</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Most Common Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.most_common_action}</div>
              <p className="text-sm text-muted-foreground mt-1">Primary activity type</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
              <CardDescription>Filter audit logs by various criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select value={filters.action} onValueChange={(value) => setFilters(f => ({ ...f, action: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="SECURITY">Security</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                      <SelectItem value="API_REQUEST">API Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={filters.entity} onValueChange={(value) => setFilters(f => ({ ...f, entity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All entities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All entities</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Course">Course</SelectItem>
                      <SelectItem value="Grade">Grade</SelectItem>
                      <SelectItem value="Enrollment">Enrollment</SelectItem>
                      <SelectItem value="Document">Document</SelectItem>
                      <SelectItem value="Invoice">Invoice</SelectItem>
                      <SelectItem value="Announcement">Announcement</SelectItem>
                      <SelectItem value="Setting">Setting</SelectItem>
                      <SelectItem value="Report">Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label>Search Description</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search description..."
                      value={filters.search}
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Showing {logs.length} of {totalLogs} logs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Loading audit logs...</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  No audit logs match your current filters. Try adjusting your filter criteria or reset filters to see all logs.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead className="w-[180px]">Date/Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="w-[130px]">Action</TableHead>
                      <TableHead className="w-[120px]">Entity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[130px]">IP Address</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const actionConfig = getActionBadgeConfig(log.action);
                      
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{log.id}</TableCell>
                          <TableCell className="text-sm">{formatDate(log.timestamp)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.user_name || 'System'}</div>
                              {log.user_email && (
                                <div className="text-sm text-muted-foreground">{log.user_email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={actionConfig.color}>
                              {actionConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.entity} #{log.entity_id}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {log.description}
                          </TableCell>
                          <TableCell>
                            {log.status === 'success' && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </Badge>
                            )}
                            {log.status === 'failed' && (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {log.status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && logs.length > 0 && (
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalLogs}
                itemsPerPage={20}
                itemName="logs"
                onPageChange={setCurrentPage}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Audit Log Details
              </DialogTitle>
              <DialogDescription>
                {selectedLog?.id} • {selectedLog && formatDate(selectedLog.timestamp)}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-4 h-4" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="font-medium">{selectedLog.user_name || 'System'}</div>
                      {selectedLog.user_email && (
                        <div className="text-sm text-muted-foreground">{selectedLog.user_email}</div>
                      )}
                      {selectedLog.user_id && (
                        <div className="text-sm text-muted-foreground font-mono">{selectedLog.user_id}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="w-4 h-4" />
                      Action Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getActionBadgeConfig(selectedLog.action).color}>
                      {getActionBadgeConfig(selectedLog.action).label}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${
                  selectedLog.status === 'success' ? 'from-green-50' : 
                  selectedLog.status === 'failed' ? 'from-red-50' : 
                  'from-yellow-50'
                } to-white`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {selectedLog.status === 'success' && <CheckCircle className="w-4 h-4" />}
                      {selectedLog.status === 'failed' && <XCircle className="w-4 h-4" />}
                      {selectedLog.status === 'pending' && <Clock className="w-4 h-4" />}
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedLog.status === 'success' && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    )}
                    {selectedLog.status === 'failed' && (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    {selectedLog.status === 'pending' && (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Server className="w-4 h-4" />
                      Entity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="font-medium">{selectedLog.entity}</div>
                      <div className="text-sm text-muted-foreground font-mono">#{selectedLog.entity_id}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-50 to-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="w-4 h-4" />
                      IP Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono">{selectedLog.ip_address}</div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedLog.description}</p>
                  </CardContent>
                </Card>

                {selectedLog.user_agent && (
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">User Agent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md">
                        <code className="text-sm font-mono break-all">{selectedLog.user_agent}</code>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedLog.metadata && (
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                        <pre className="text-sm font-mono">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

