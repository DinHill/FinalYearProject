'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Eye, Edit, Trash2, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data - will be replaced with API
const mockUsers = [
  {
    id: 1,
    username: 'john.doe',
    full_name: 'John Doe',
    email: 'john.doe@student.greenwich.edu.vn',
    role: 'student',
    status: 'active',
    campus_id: 1,
    campus: { name: 'Hanoi Campus' },
    major_id: 1,
    major: { name: 'Computer Science' },
    phone_number: '+84 123 456 789',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    username: 'jane.smith',
    full_name: 'Dr. Jane Smith',
    email: 'jane.smith@teacher.greenwich.edu.vn',
    role: 'teacher',
    status: 'active',
    campus_id: 2,
    campus: { name: 'Da Nang Campus' },
    phone_number: '+84 987 654 321',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
  },
  {
    id: 3,
    username: 'admin',
    full_name: 'System Administrator',
    email: 'admin@greenwich.edu.vn',
    role: 'admin',
    status: 'active',
    campus_id: 1,
    campus: { name: 'Hanoi Campus' },
    phone_number: '+84 555 123 456',
  },
];

export default function UsersPage() {
  const router = useRouter();
  const [users] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (userId: number) => {
    router.push(`/users/${userId}`);
  };

  const handleEdit = (userId: number) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleDelete = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Delete user:', userId);
    }
  };

  const handleCreate = () => {
    router.push('/users/new');
  };

  const handleExport = () => {
    console.log('Export users');
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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                          <AvatarFallback>
                            {user.full_name.split(' ').map((n) => n[0]).join('')}
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
                      <span className="text-sm">{user.campus.name}</span>
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
      </ListPageTemplate>
    </AdminLayout>
  );
}