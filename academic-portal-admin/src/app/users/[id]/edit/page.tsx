'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { api, UpdateUserRequest, User } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: '',
    full_name: '',
    role: '',
    status: 'active',
    phone_number: '',
    avatar_url: '',
    campus_id: undefined,
    major_id: undefined,
    year_entered: undefined,
    date_of_birth: '',
    gender: '',
  });

  // Fetch user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.getUserById(userId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user');
      }
      return response.data as User;
    },
  });

  // Fetch campuses
  const { data: campusesData } = useQuery({
    queryKey: ['campuses'],
    queryFn: async () => {
      const response = await api.getCampuses();
      return response.success ? response.data : [];
    },
  });

  // Fetch majors
  const { data: majorsData } = useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await api.getMajors();
      return response.success ? response.data : [];
    },
  });

  // Pre-fill form when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || '',
        status: user.status || 'active',
        phone_number: user.phone_number || '',
        avatar_url: user.avatar_url || '',
        campus_id: user.campus_id || undefined,
        major_id: user.major_id || undefined,
        year_entered: user.year_entered || undefined,
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserRequest) => {
      const response = await api.updateUser(userId, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user');
      }
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-status-counts'] });
      router.push(`/users/${userId}`);
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
    
    // Validation
    if (!formData.full_name || !formData.role) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // For students and teachers, campus is required
    if ((formData.role === 'student' || formData.role === 'teacher') && !formData.campus_id) {
      toast({
        title: 'Validation Error',
        description: 'Campus is required for students and teachers',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmSaveChanges = () => {
    // Remove empty optional fields to avoid sending null/undefined
    const cleanedData: UpdateUserRequest = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        cleanedData[key as keyof UpdateUserRequest] = value as any;
      }
    });

    updateUserMutation.mutate(cleanedData);
    setShowConfirmDialog(false);
  };

  const handleInputChange = (field: keyof UpdateUserRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'academic_admin', label: 'Academic Admin' },
    { value: 'content_admin', label: 'Content Admin' },
    { value: 'finance_admin', label: 'Finance Admin' },
    { value: 'support_admin', label: 'Support Admin' },
  ];

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'graduated', label: 'Graduated' },
  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const needsCampus = formData.role === 'student' || formData.role === 'teacher' || formData.role?.includes('admin');
  const needsMajor = formData.role === 'student' || formData.role === 'teacher';

  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader
          breadcrumbs={[
            { label: 'User Management', href: '/users' },
            { label: 'Loading...' }
          ]}
        />
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <PageHeader
          breadcrumbs={[
            { label: 'User Management', href: '/users' },
            { label: 'Error' }
          ]}
        />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load user data'}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push('/users')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'User Management', href: '/users' },
          { label: user.full_name, href: `/users/${userId}` },
          { label: 'Edit' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Username cannot be changed as it is used for login credentials.
            </AlertDescription>
          </Alert>

          {/* Identity Information */}
          <Card>
            <CardHeader>
              <CardTitle>Identity Information</CardTitle>
              <CardDescription>
                Username cannot be changed, but email can be updated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={user.username} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the user's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Nguyen Van A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    key={`role-${user?.id}-${formData.role}`}
                    value={formData.role || undefined}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    key={`status-${user?.id}-${formData.status}`}
                    value={formData.status || undefined}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+84 123 456 789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          {(needsCampus || needsMajor) && (
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>
                  Update campus, major, and year information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {needsCampus && (
                    <div className="space-y-2">
                      <Label htmlFor="campus_id">
                        Campus {(formData.role === 'student' || formData.role === 'teacher') && <span className="text-destructive">*</span>}
                      </Label>
                      <Select
                        key={`campus-${user?.id}-${formData.campus_id}`}
                        value={formData.campus_id?.toString() || undefined}
                        onValueChange={(value) => handleInputChange('campus_id', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(campusesData) ? campusesData : campusesData?.items || []).map((campus: any) => (
                            <SelectItem key={campus.id} value={campus.id.toString()}>
                              {campus.name} ({campus.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {needsMajor && (
                    <div className="space-y-2">
                      <Label htmlFor="major_id">
                        Major/Program {formData.role === 'student' && <span className="text-destructive">*</span>}
                      </Label>
                      <Select
                        key={`major-${user?.id}-${formData.major_id}`}
                        value={formData.major_id?.toString() || undefined}
                        onValueChange={(value) => handleInputChange('major_id', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select major" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(majorsData) ? majorsData : majorsData?.items || []).map((major: any) => (
                            <SelectItem key={major.id} value={major.id.toString()}>
                              {major.name} ({major.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="year_entered">Year Entered</Label>
                      <Input
                        id="year_entered"
                        type="number"
                        min="2000"
                        max="2099"
                        value={formData.year_entered || ''}
                        onChange={(e) => handleInputChange('year_entered', parseInt(e.target.value) || undefined)}
                        placeholder="2023"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="avatar_url">Profile Picture URL</Label>
                  <Input
                    id="avatar_url"
                    type="url"
                    value={formData.avatar_url || ''}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to {user?.full_name}&apos;s profile? This action will update the user information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateUserMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSaveChanges}
              disabled={updateUserMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
