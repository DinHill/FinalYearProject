'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { api, CreateUserRequest } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'student',
    phone_number: '',
    campus_code: undefined as string | undefined,
    major_code: undefined as string | undefined,
    year_entered: currentYear, // Default to current year for students
  });

  // Fetch campuses
  const { data: campusesData } = useQuery({
    queryKey: ['campuses'],
    queryFn: async () => {
      const response = await api.getCampuses();
      if (response.success) {
        // Handle both array and paginated response
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
      }
      return [];
    },
  });

  // Fetch majors
  const { data: majorsData, isLoading: majorsLoading, error: majorsError } = useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await api.getMajors();
      console.log('Majors API Response:', response);
      if (response.success) {
        // Handle both array and paginated response
        const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        console.log('Processed Majors Data:', data);
        return data;
      }
      return [];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      console.log('=== CREATING USER ===');
      console.log('Data being sent:', JSON.stringify(data, null, 2));
      const response = await api.createUser(data);
      console.log('Response from API:', JSON.stringify(response, null, 2));
      if (!response.success) {
        const errorMsg = response.error || 'Failed to create user';
        console.error('❌ Error creating user:', errorMsg);
        throw new Error(errorMsg);
      }
      console.log('✅ User created successfully:', response.data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users query to refetch data
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      router.push('/users');
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
    
    // Validation - email is now optional
    if (!formData.full_name || !formData.role) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if any validation errors exist
    if (nameError || emailError || phoneError) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all errors before submitting',
        variant: 'destructive',
      });
      return;
    }

    // Clean the data - remove undefined values
    const cleanedData: Partial<CreateUserRequest> = {
      full_name: formData.full_name,
      role: formData.role,
      ...(formData.email && { email: formData.email }),
      ...(formData.phone_number && { phone_number: formData.phone_number }),
      ...(formData.campus_code && { campus_code: formData.campus_code }),
      ...(formData.major_code && { major_code: formData.major_code }),
      ...(formData.year_entered && { year_entered: formData.year_entered }),
    };

    createUserMutation.mutate(cleanedData as CreateUserRequest);
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing again
    if (field === 'full_name') setNameError('');
    if (field === 'email') setEmailError('');
    if (field === 'phone_number') setPhoneError('');
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

  const validateName = () => {
    setTouchedFields(prev => ({ ...prev, full_name: true }));
    
    if (!formData.full_name.trim()) {
      setNameError('');
      return;
    }
    
    // Check for numbers or special characters
    if (/[0-9!@#$%^&*()+=\[\]{};:"|<>?\/\\]/.test(formData.full_name)) {
      setNameError('Name cannot contain numbers or special characters');
      return;
    }
    
    // Check for at least 2 words
    const nameParts = formData.full_name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setNameError('Full name must include at least first and last name (e.g., "Nguyen Van A")');
    } else {
      setNameError('');
    }
  };

  const validateEmail = () => {
    setTouchedFields(prev => ({ ...prev, email: true }));
    
    // Email is optional, empty is valid
    if (!formData.email.trim()) {
      setEmailError('');
      return;
    }
    
    // If provided, must be valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const validatePhone = () => {
    setTouchedFields(prev => ({ ...prev, phone_number: true }));
    
    if (!formData.phone_number.trim()) {
      setPhoneError('');
      return;
    }
    
    // Remove spaces and check if it's a valid phone format
    const phoneClean = formData.phone_number.replace(/\s+/g, '');
    const phoneRegex = /^\+?[0-9]{9,15}$/;
    if (!phoneRegex.test(phoneClean)) {
      setPhoneError('Please enter a valid phone number (9-15 digits)');
    } else {
      setPhoneError('');
    }
  };

  const needsCampus = formData.role === 'student' || formData.role === 'teacher' || formData.role.includes('admin');
  const needsMajor = formData.role === 'student' || formData.role === 'teacher';

  // Check if form is valid to enable/disable submit button
  const isFormValid = (() => {
    // Full name must not contain numbers or special characters
    if (/[0-9!@#$%^&*()+=\[\]{};:"|<>?\/\\]/.test(formData.full_name)) return false;
    
    // Full name must be at least 2 words
    const nameParts = formData.full_name.trim().split(/\s+/);
    if (nameParts.length < 2) return false;

    // Role must be selected
    if (!formData.role) return false;

    // Email validation (if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return false;
    }

    // Phone validation (if provided)
    if (formData.phone_number.trim()) {
      const phoneClean = formData.phone_number.replace(/\s+/g, '');
      const phoneRegex = /^\+?[0-9]{9,15}$/;
      if (!phoneRegex.test(phoneClean)) return false;
    }

    // Campus required for students and teachers
    if ((formData.role === 'student' || formData.role === 'teacher') && !formData.campus_code) {
      return false;
    }

    // Major and year_entered required for students
    if (formData.role === 'student') {
      if (!formData.major_code) return false;
      if (!formData.year_entered) return false;
    }

    return true;
  })();

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'User Management', href: '/users' },
          { label: 'Add New User' }
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the user&apos;s basic information. Username will be auto-generated by the system.
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
                    onBlur={validateName}
                    placeholder="Nguyen Van A"
                    required
                    className={nameError ? 'border-destructive' : ''}
                  />
                  {touchedFields.full_name && nameError && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.role}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={validateEmail}
                    placeholder="user@example.com"
                    className={emailError ? 'border-destructive' : ''}
                  />
                  {touchedFields.email && emailError && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    onBlur={validatePhone}
                    placeholder="+84 123 456 789"
                    className={phoneError ? 'border-destructive' : ''}
                  />
                  {touchedFields.phone_number && phoneError && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The Greenwich username will be automatically generated by the backend based on the user's name, role, campus, and year.
                  The default password will be the same as the username. Please share these credentials with the user directly.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Academic Information */}
          {(needsCampus || needsMajor) && (
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>
                  Select the campus and major for the user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {needsCampus && (
                    <div className="space-y-2">
                      <Label htmlFor="campus_code">
                        Campus {(formData.role === 'student' || formData.role === 'teacher') && <span className="text-destructive">*</span>}
                      </Label>
                      <Select
                        value={formData.campus_code}
                        onValueChange={(value) => handleInputChange('campus_code', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent>
                          {campusesData?.map((campus: any) => (
                            <SelectItem key={campus.id} value={campus.code}>
                              {campus.name} ({campus.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {needsMajor && (
                    <div className="space-y-2">
                      <Label htmlFor="major_code">
                        Major/Program {formData.role === 'student' && <span className="text-destructive">*</span>}
                      </Label>
                      <Select
                        value={formData.major_code}
                        onValueChange={(value) => handleInputChange('major_code', value)}
                        disabled={majorsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={majorsLoading ? "Loading majors..." : "Select major"} />
                        </SelectTrigger>
                        <SelectContent>
                          {majorsError && (
                            <div className="px-2 py-1.5 text-sm text-destructive">
                              Error loading majors
                            </div>
                          )}
                          {!majorsLoading && !majorsError && majorsData?.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No majors available
                            </div>
                          )}
                          {majorsData?.map((major: any) => (
                            <SelectItem key={major.id} value={major.code}>
                              {major.name} ({major.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {majorsData && (
                        <p className="text-xs text-muted-foreground">
                          {majorsData.length} major(s) available
                        </p>
                      )}
                    </div>
                  )}

                  {formData.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="year_entered">
                        Year Entered <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="year_entered"
                        type="number"
                        value={formData.year_entered || currentYear}
                        onChange={(e) => handleInputChange('year_entered', parseInt(e.target.value))}
                        placeholder={currentYear.toString()}
                        min={2000}
                        max={currentYear + 1}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Year the student enrolled (e.g., {currentYear})
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending || !isFormValid}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
