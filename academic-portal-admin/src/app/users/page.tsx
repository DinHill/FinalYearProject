'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Edit, 
  Loader2, 
  UserX, 
  Filter, 
  MoreHorizontal, 
  RotateCcw, 
  Download, 
  Upload,
  Users,
  UserCheck,
  UserMinus,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetPassword } from '@/lib/firebase';
import { exportToCSV, formatDateForExport } from '@/lib/export';
import { useDebounce } from '@/hooks/useDebounce';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BulkActions, commonBulkActions, BulkAction } from '@/components/BulkActions';
import { ImportUsersDialog } from '@/components/ImportUsersDialog';

interface User {
  id: number;
  full_name: string;
  username: string;
  role: string;
  status: string;
  email: string;
  phone?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  campus?: { name: string };
  student_id?: string;
  teacher_code?: string;
  major?: { name: string };
  created_at?: string;
}

interface Campus {
  id: number;
  name: string;
  code?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all'); // Now stores campus ID as string
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDeactivate, setUserToDeactivate] = useState<{ id: number; name: string } | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<number | null>(null);
  const [showBulkDeactivateDialog, setShowBulkDeactivateDialog] = useState(false);
  const [userToApprove, setUserToApprove] = useState<{ id: number; name: string } | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const usersPerPage = 20;

  // Fetch status counts for the stat cards
  const { data: statusCounts } = useQuery({
    queryKey: ['user-status-counts'],
    queryFn: async () => {
      const [pendingRes, activeRes, inactiveRes, suspendedRes] = await Promise.all([
        api.getUsers(1, 1, undefined, undefined, undefined, 'pending'),
        api.getUsers(1, 1, undefined, undefined, undefined, 'active'),
        api.getUsers(1, 1, undefined, undefined, undefined, 'inactive'),
        api.getUsers(1, 1, undefined, undefined, undefined, 'suspended'),
      ]);
      return {
        pending: pendingRes.success && pendingRes.data ? pendingRes.data.total : 0,
        active: activeRes.success && activeRes.data ? activeRes.data.total : 0,
        inactive: inactiveRes.success && inactiveRes.data ? inactiveRes.data.total : 0,
        suspended: suspendedRes.success && suspendedRes.data ? suspendedRes.data.total : 0,
      };
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Fetch campuses for filter dropdown
  const { data: campusesData, isLoading: campusesLoading } = useQuery({
    queryKey: ['campuses'],
    queryFn: async () => {
      const response = await api.getCampuses();
      if (!response.success) {
        // Silently fail and return empty array - campuses filter won't be available
        console.warn('Could not load campuses:', response.error);
        return [];
      }
      // Backend returns array directly, not paginated response
      return Array.isArray(response.data) ? response.data : [];
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Ensure campuses is always an array
  // If API fails, use fallback campuses from user data
  const campuses = Array.isArray(campusesData) && campusesData.length > 0 
    ? campusesData 
    : [
        { id: 1, name: 'Hanoi Campus', code: 'H' },
        { id: 2, name: 'Da Nang Campus', code: 'D' },
        { id: 3, name: 'Can Tho Campus', code: 'C' },
        { id: 4, name: 'Ho Chi Minh Campus', code: 'S' },
      ];
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Clear selections when filters or search changes
  useEffect(() => {
    setSelectedUsers([]);
  }, [roleFilter, statusFilter, campusFilter, debouncedSearch, currentPage]);
  
  // Fetch users from API with backend search and filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, statusFilter, campusFilter, currentPage],
    queryFn: async () => {
      // Handle "admin" filter - fetch with larger limit to get all admins, then filter client-side
      const role = (roleFilter !== 'all' && roleFilter !== 'admin') ? roleFilter : undefined;
      const campusId = campusFilter !== 'all' ? parseInt(campusFilter) : undefined;
      const search = debouncedSearch || undefined;
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      
      // If "admin" filter is selected, fetch all users (no role filter) to filter client-side
      // Use a large page size to get all users
      const pageSize = roleFilter === 'admin' ? 1000 : usersPerPage;
      const page = roleFilter === 'admin' ? 1 : currentPage;
      
      const response = await api.getUsers(page, pageSize, role, campusId, search, status);
      if (!response.success) {
        // Check if it's an authentication error
        if (response.error?.includes('401') || response.error?.includes('Unauthorized')) {
          throw new Error('Authentication required. Please log in to continue.');
        }
        throw new Error(response.error || 'Failed to fetch users');
      }
      return response.data;
    },
    retry: false, // Don't retry on auth errors
  });

  const users = data?.items || [];
  let totalUsers = data?.total || 0;
  let totalPages = data?.pages || 1;

  // Apply client-side filtering for "admin" role filter
  const filteredUsers = roleFilter === 'admin' 
    ? users.filter((user: User) => user.role.toLowerCase().includes('admin'))
    : users;

  // If admin filter is active, recalculate pagination based on filtered results
  if (roleFilter === 'admin') {
    totalUsers = filteredUsers.length;
    totalPages = Math.ceil(totalUsers / usersPerPage);
  }

  // Apply pagination for admin filter (client-side)
  const startIndex = roleFilter === 'admin' ? (currentPage - 1) * usersPerPage : 0;
  const endIndex = roleFilter === 'admin' ? startIndex + usersPerPage : filteredUsers.length;
  const paginatedUsers = roleFilter === 'admin' ? filteredUsers.slice(startIndex, endIndex) : filteredUsers;

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map((user: User) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every((user: User) => selectedUsers.includes(user.id));
  const isSomeSelected = selectedUsers.length > 0 && !isAllSelected;

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'pending': return 'outline';  // Yellow/warning style for pending
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const formatRoleName = (role: string): string => {
    // Convert role names like 'academic_admin' to 'Academic Admin'
    // or 'super_admin' to 'Super Admin'
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleView = (userId: number) => {
    router.push(`/users/${userId}`);
  };

  const handleEdit = (userId: number) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleCreate = () => {
    router.push('/users/new');
  };

  const handleExport = async () => {
    try {
      // Fetch ALL users with current filters (no pagination limit)
      // Handle "admin" filter - don't pass to backend, filter client-side instead
      const role = (roleFilter !== 'all' && roleFilter !== 'admin') ? roleFilter : undefined;
      const campusId = campusFilter !== 'all' ? parseInt(campusFilter) : undefined;
      const search = debouncedSearch || undefined;
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      
      const response = await api.getUsers(1, 10000, role, campusId, search, status);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users for export');
      }

      let allUsers = response.data?.items || [];

      // Apply client-side filtering for "admin" role if selected
      if (roleFilter === 'admin') {
        allUsers = allUsers.filter(user => user.role.toLowerCase().includes('admin'));
      }

      // Use all filtered users for export (backend already filtered by status)
      const exportData = allUsers.map(user => ({
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone_number: user.phone_number || user.phone || '',
        campus: user.campus?.name || '',
        major: user.major?.name || '',
        created_at: user.created_at,
      }));

      const columns = [
        { key: 'username', label: 'Username' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'campus', label: 'Campus' },
        { key: 'major', label: 'Major/Program' },
        { 
          key: 'created_at', 
          label: 'Created At',
          format: formatDateForExport
        },
      ];

      // Generate filename with timestamp and filters
      const timestamp = new Date().toISOString().split('T')[0];
      const filterInfo = [];
      if (roleFilter !== 'all') filterInfo.push(roleFilter);
      if (statusFilter !== 'all') filterInfo.push(statusFilter);
      if (campusFilter !== 'all') {
        const selectedCampus = campuses.find((c: Campus) => c.id.toString() === campusFilter);
        if (selectedCampus) filterInfo.push(selectedCampus.name.replace(/\s+/g, '_'));
      }
      const filterSuffix = filterInfo.length > 0 ? `_${filterInfo.join('_')}` : '';
      const filename = `users_export_${timestamp}${filterSuffix}.csv`;

      exportToCSV(exportData, columns, filename);

      toast({
        title: 'Success',
        description: `Exported ${exportData.length} user(s) to ${filename}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export users',
        variant: 'destructive',
      });
    }
  };

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.updateUser(userId, { status: 'inactive' });
      if (!response.success) {
        throw new Error(response.error || 'Failed to deactivate user');
      }
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User deactivated successfully',
      });
      // Refresh the users list and status counts
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-status-counts'] });
      setUserToDeactivate(null);
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setUserToDeactivate(null);
    },
  });

  // Bulk deactivate mutation (legacy - will be replaced with new bulk API)
  const bulkDeactivateMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      const promises = userIds.map(id => api.updateUser(id, { status: 'inactive' }));
      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to deactivate ${failed.length} user(s)`);
      }
      return results;
    },
    onSuccess: () => {
      setShowBulkDeactivateDialog(false); // Close dialog
      toast({
        title: 'Success',
        description: `${selectedUsers.length} user(s) deactivated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-status-counts'] });
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // New bulk operation handlers using bulk API
  const handleBulkStatusUpdate = async (status: string, selectedIds: number[]) => {
    const response = await api.bulkUpdateUsers({
      ids: selectedIds,
      updates: { status }
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update users');
    }
    
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user-status-counts'] });
    setSelectedUsers([]);
  };

  const handleBulkDelete = async (selectedIds: number[]) => {
    const response = await api.bulkDeleteUsers({ ids: selectedIds });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to delete users');
    }
    
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user-status-counts'] });
    setSelectedUsers([]);
  };

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Activate Selected',
      icon: <UserCheck className="h-4 w-4" />,
      onAction: async (ids) => handleBulkStatusUpdate('active', ids)
    },
    {
      label: 'Deactivate Selected',
      icon: <UserMinus className="h-4 w-4" />,
      onAction: async (ids) => handleBulkStatusUpdate('inactive', ids),
      requiresConfirmation: true,
      confirmTitle: 'Deactivate Users',
      confirmDescription: 'This will deactivate the selected users. They will not be able to log in until reactivated.'
    },
    {
      label: 'Suspend Selected',
      icon: <UserX className="h-4 w-4" />,
      variant: 'destructive',
      onAction: async (ids) => handleBulkStatusUpdate('suspended', ids),
      requiresConfirmation: true,
      confirmTitle: 'Suspend Users',
      confirmDescription: 'This will suspend the selected users. They will be blocked from all system access.'
    },
    commonBulkActions.delete(handleBulkDelete)
  ];

  const handleDeactivate = (userId: number, userName: string) => {
    setUserToDeactivate({ id: userId, name: userName });
  };

  const confirmDeactivate = () => {
    if (userToDeactivate) {
      deactivateMutation.mutate(userToDeactivate.id);
    }
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length > 0) {
      setShowBulkDeactivateDialog(true);
    }
  };

  const confirmBulkDeactivate = () => {
    bulkDeactivateMutation.mutate(selectedUsers);
  };

  const handleApproveUser = async (userId: number, userName: string) => {
    setUserToApprove({ id: userId, name: userName });
  };

  const confirmApproveUser = async () => {
    if (!userToApprove) return;
    
    try {
      const response = await api.approveUser(userToApprove.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: `User "${userToApprove.name}" has been approved and can now log in.`,
        });
        setUserToApprove(null); // Close dialog
        refetch();
      } else {
        throw new Error(response.error || 'Failed to approve user');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve user',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (userId: number, userName: string) => {
    // Find user email
    const user = users.find(u => u.id === userId);
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found',
        variant: 'destructive',
      });
      return;
    }

    setResettingPasswordFor(userId);
    try {
      await resetPassword(user.email);
      toast({
        title: 'Success',
        description: `Password reset email sent to ${userName} (${user.email})`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send password reset email',
        variant: 'destructive',
      });
    } finally {
      setResettingPasswordFor(null);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[{ label: 'User Management' }]}
        subtitle="Manage all users including students, teachers, and administrators"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button size="sm" onClick={handleCreate} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Users className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{data?.total || users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {statusCounts?.pending ?? 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">
                    {statusCounts?.active ?? 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold">
                    {statusCounts?.inactive ?? 0}
                  </p>
                </div>
                <UserMinus className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold">
                    {statusCounts?.suspended ?? 0}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
          <Select value={roleFilter} onValueChange={(value) => handleFilterChange(setRoleFilter, value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">All Admins</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="academic_admin">Academic Admin</SelectItem>
              <SelectItem value="content_admin">Content Admin</SelectItem>
              <SelectItem value="finance_admin">Finance Admin</SelectItem>
              <SelectItem value="support_admin">Support Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => handleFilterChange(setStatusFilter, value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={campusFilter} onValueChange={(value) => handleFilterChange(setCampusFilter, value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campuses</SelectItem>
              {campusesLoading ? (
                <SelectItem value="loading" disabled>Loading campuses...</SelectItem>
              ) : campuses.length === 0 ? (
                <SelectItem value="no-campuses" disabled>No campuses available</SelectItem>
              ) : (
                campuses.map((campus: Campus) => (
                  <SelectItem key={campus.id} value={campus.id.toString()}>
                    {campus.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {(roleFilter !== 'all' || statusFilter !== 'all' || campusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRoleFilter('all');
                setStatusFilter('all');
                setCampusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {/* Bulk Actions Component */}
        {selectedUsers.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <BulkActions
                selectedIds={selectedUsers}
                totalCount={filteredUsers.length}
                onSelectAll={handleSelectAll}
                actions={bulkActions}
                entityName="users"
              />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="my-4">
            <AlertDescription className="flex flex-col gap-3">
              <div>{(error as Error).message || 'Failed to load users. Please try again later.'}</div>
              {(error as Error).message.includes('Authentication') && (
                <Button 
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-fit"
                >
                  Go to Login
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all users"
                        className={isSomeSelected ? "data-[state=checked]:bg-brand-blue" : ""}
                      />
                    </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>ID/Code</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No users found matching the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          aria-label={`Select ${user.full_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.role.toLowerCase() === 'student' || user.role.toLowerCase() === 'teacher' 
                          ? user.username 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatRoleName(user.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.campus?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{user.major?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(user.status)}
                          className="capitalize"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(user.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {user.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleApproveUser(user.id, user.full_name)}
                                  className="text-green-600"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Approve User
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleResetPassword(user.id, user.full_name)}
                              disabled={resettingPasswordFor === user.id}
                            >
                              {resettingPasswordFor === user.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4 mr-2" />
                              )}
                              Reset Password
                            </DropdownMenuItem>
                            {user.status === 'inactive' ? (
                              <DropdownMenuItem 
                                onClick={async () => {
                                  try {
                                    await handleBulkStatusUpdate('active', [user.id]);
                                    toast({
                                      title: 'Success',
                                      description: `${user.full_name} has been activated`,
                                    });
                                  } catch (error) {
                                    toast({
                                      title: 'Error',
                                      description: error instanceof Error ? error.message : 'Failed to activate user',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                className="text-green-600"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleDeactivate(user.id, user.full_name)}
                                className="text-destructive"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
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
        )}

        {/* Pagination */}
        {paginatedUsers.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * usersPerPage) + 1}-{Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              {totalPages <= 7 ? (
                // Show all pages if 7 or fewer
                Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                  >
                    {page}
                  </Button>
                ))
              ) : (
                // Show abbreviated pagination for 8+ pages
                <>
                  {/* First page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className={currentPage === 1 ? "bg-primary text-primary-foreground" : ""}
                  >
                    1
                  </Button>

                  {/* Left ellipsis */}
                  {currentPage > 3 && (
                    <span className="text-sm text-muted-foreground px-2">...</span>
                  )}

                  {/* Middle pages */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show current page and 1 page on each side
                      if (page === currentPage) return true;
                      if (page === currentPage - 1 && page > 1) return true;
                      if (page === currentPage + 1 && page < totalPages) return true;
                      return false;
                    })
                    .map((page) => (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Right ellipsis */}
                  {currentPage < totalPages - 2 && (
                    <span className="text-sm text-muted-foreground px-2">...</span>
                  )}

                  {/* Last page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className={currentPage === totalPages ? "bg-primary text-primary-foreground" : ""}
                  >
                    {totalPages}
                  </Button>
                </>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
            <span className="text-sm font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={bulkDeactivateMutation.isPending}
              >
                {bulkDeactivateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4 mr-2" />
                )}
                Deactivate Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers([])}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={userToDeactivate !== null} onOpenChange={() => setUserToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{userToDeactivate?.name}</strong>?
              This will change their status to inactive and they will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Deactivate Confirmation Dialog */}
      <AlertDialog open={showBulkDeactivateDialog} onOpenChange={setShowBulkDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Multiple Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{selectedUsers.length} user(s)</strong>?
              This will change their status to inactive and they will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeactivateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDeactivate}
              disabled={bulkDeactivateMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeactivateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve User Confirmation Dialog */}
      <AlertDialog open={userToApprove !== null} onOpenChange={() => setUserToApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{userToApprove?.name}</strong>?
              This will create their Firebase account and allow them to log in to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproveUser}
              className="bg-primary"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Users Dialog */}
      <ImportUsersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={() => {
          // Refresh the user list
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['user-status-counts'] });
        }}
      />
    </AdminLayout>
  );
}