'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ListPageTemplate } from '@/components/templates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Mail, Phone, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch users from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: async () => {
      const response = await api.getUsers(1, 20);
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

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'student': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const handleView = (userId: number) => {
    router.push(`/users/${userId}`);
  };

  const handleEdit = (userId: number) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleDelete = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      // TODO: Implement delete functionality
      alert('Delete functionality will be implemented in Task 4');
    }
  };

  const handleCreate = () => {
    router.push('/users/new');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon');
  };

  return (
    <AdminLayout>
      <ListPageTemplate
        title="User Management"
        description="Manage all users including students, teachers, and administrators"
        searchPlaceholder="Search by name, email, or username..."
        onSearch={setSearchQuery}
        onCreate={handleCreate}
        onExport={handleExport}
        createButtonText="Add User"
      >
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: { id: number; full_name: string; username: string; role: string; status: string; email: string; phone?: string; avatar_url?: string; campus?: { name: string } }) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url} alt={user.full_name} />
                            <AvatarFallback>
                              {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.campus?.name || 'N/A'}</span>
                        {user.major && (
                          <p className="text-xs text-muted-foreground">{user.major.name}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(user.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </ListPageTemplate>
    </AdminLayout>
  );
}