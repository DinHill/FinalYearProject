'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Shield,
  Clock,
  Loader2,
  KeyRound,
  Building,
  IdCard,
  Activity,
  UserCog
} from 'lucide-react';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/firebase';

interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  avatar_url?: string;
  campus?: {
    id: number;
    code: string;
    name: string;
    city?: string;
  };
  major?: {
    id: number;
    code: string;
    name: string;
  };
  year_entered?: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.getUserById(parseInt(userId));
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user');
      }
      return response.data as User;
    },
  });

  // Fetch teacher's sections if user is a teacher
  const { data: teacherSections } = useQuery({
    queryKey: ['teacher-sections', userId],
    queryFn: async () => {
      const response = await api.getTeacherSections(parseInt(userId));
      if (!response.success) {
        return null;
      }
      return response.data;
    },
    enabled: !!user && user.role === 'teacher',
  });

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('admin')) return <Shield className="w-5 h-5" />;
    if (role === 'teacher') return <Briefcase className="w-5 h-5" />;
    if (role === 'student') return <GraduationCap className="w-5 h-5" />;
    return <UserIcon className="w-5 h-5" />;
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await resetPassword(user.email);
      toast({
        title: 'Success',
        description: `Password reset email sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {(error as Error)?.message || 'User not found'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const formatRoleName = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
              <p className="text-sm text-muted-foreground font-mono">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${user.email}`, '_blank')}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </Button>
            {user.phone_number && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${user.phone_number}`, '_blank')}
                className="gap-2"
              >
                <Phone className="w-4 h-4" />
                Call
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="border-gray-300"
            >
              {isResettingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Reset Password
            </Button>
            <Button 
              size="sm" 
              onClick={() => router.push(`/users/${userId}/edit`)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2"
            >
              <UserCog className="w-4 h-4" />
              Manage User
            </Button>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="profile" className="space-y-4">
          <style>{`
            [data-slot="tabs-trigger"][data-state="active"] {
              background-color: #007AC3 !important;
              color: white !important;
              box-shadow: 0 2px 4px 0 rgba(0, 122, 195, 0.2) !important;
              border-radius: 0.5rem !important;
              font-weight: 600 !important;
            }
            [data-slot="tabs-trigger"][data-state="active"] span {
              color: white !important;
            }
            [data-slot="tabs-trigger"][data-state="active"] svg {
              color: white !important;
              opacity: 1 !important;
            }
            [data-slot="tabs-trigger"]:not([data-state="active"]) {
              color: rgb(55, 65, 81) !important;
              background-color: transparent !important;
              font-weight: 500 !important;
            }
            [data-slot="tabs-trigger"]:not([data-state="active"]):hover {
              background-color: rgb(243, 244, 246) !important;
              border-radius: 0.5rem !important;
            }
            [data-slot="tabs-trigger"] {
              transition: all 0.2s ease !important;
            }
          `}</style>
          <TabsList className="bg-white border border-gray-200 p-1 h-auto shadow-sm">
            <TabsTrigger 
              value="profile" 
              className="gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors"
              style={{
                color: 'rgb(55, 65, 81)',
              }}
              data-active-style={{
                backgroundColor: 'var(--brand-blue)',
                color: 'white',
              }}
            >
              <UserIcon className="w-4 h-4" />
              <span style={{ color: 'inherit' }}>Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="academic" 
              className="gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors"
              style={{
                color: 'rgb(55, 65, 81)',
              }}
            >
              <GraduationCap className="w-4 h-4" />
              <span style={{ color: 'inherit' }}>Academic</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors"
              style={{
                color: 'rgb(55, 65, 81)',
              }}
            >
              <Activity className="w-4 h-4" />
              <span style={{ color: 'inherit' }}>Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* User Profile Card with Avatar */}
            <Card className="border-2 border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="pt-6 pb-6 px-8">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {/* First Column: User Info with Avatar - All Centered */}
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                    {/* Bigger Avatar */}
                    <div 
                      className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background: 'linear-gradient(to bottom right, #007AC3, #F36C21)'
                      }}
                    >
                      <span className="text-white text-5xl font-bold" style={{ color: '#FFFFFF' }}>
                        {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Name */}
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.full_name}</h2>
                    
                    {/* Username */}
                    <p className="text-sm text-muted-foreground font-mono -mt-2">@{user.username}</p>
                    
                    {/* Role and Status Badges Together */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-semibold flex items-center gap-1.5">
                        {getRoleIcon(user.role)}
                        {formatRoleName(user.role)}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                        {user.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Second Column: First 2 Info Cards */}
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 flex items-center gap-3 p-4 rounded-lg bg-blue-50/50 border border-blue-200/50 hover:border-blue-300 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-brand-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-semibold text-blue-800/60 uppercase tracking-wider block mb-1">Email Address</label>
                        <p className="text-sm font-semibold text-blue-900 truncate" title={user.email}>{user.email}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-3 p-4 rounded-lg bg-green-50/50 border border-green-200/50 hover:border-green-300 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-semibold text-green-800/60 uppercase tracking-wider block mb-1">Phone Number</label>
                        <p className="text-sm font-semibold text-green-900">{user.phone_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Third Column: Last 2 Info Cards */}
                  <div className="flex flex-col gap-3">
                    {user.campus && (
                      <div className="flex-1 flex items-center gap-3 p-4 rounded-lg bg-orange-50/50 border border-orange-200/50 hover:border-orange-300 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-semibold text-orange-800/60 uppercase tracking-wider block mb-1">Campus Location</label>
                          <p className="text-sm font-semibold text-orange-900 leading-tight">{user.campus.name}</p>
                          <p className="text-[10px] text-orange-700/70 mt-0.5">{user.campus.code} • {user.campus.city}</p>
                        </div>
                      </div>
                    )}

                    {user.date_of_birth && (
                      <div className="flex-1 flex items-center gap-3 p-4 rounded-lg bg-purple-50/50 border border-purple-200/50 hover:border-purple-300 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-semibold text-purple-800/60 uppercase tracking-wider block mb-1">Date of Birth</label>
                          <p className="text-sm font-semibold text-purple-900">
                            {format(new Date(user.date_of_birth), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-brand-blue" />
                    </div>
                    <span>Personal Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">Full Name</span>
                      <span className="text-sm font-semibold text-gray-900">{user.full_name}</span>
                    </div>
                    
                    {user.gender && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Gender</span>
                        <span className="text-sm font-semibold text-gray-900 capitalize">{user.gender}</span>
                      </div>
                    )}
                    
                    {user.date_of_birth && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Age</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()} years old
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Username</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">@{user.username}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-brand-orange" />
                    </div>
                    <span>Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">Account Status</span>
                      <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                        {user.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">User Role</span>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm font-semibold text-gray-900">{formatRoleName(user.role)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {format(new Date(user.created_at), 'MMM yyyy')}
                      </span>
                    </div>

                    {user.last_login && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Last Active</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            {format(new Date(user.last_login), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            {user.role === 'student' && user.major ? (
              <>
                {/* Student Academic Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-brand-blue to-brand-blue/80 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Program</p>
                          <p className="text-lg font-bold text-white mt-1">{user.major.code}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-gray-900">{user.major.name}</p>
                    </CardContent>
                  </Card>

                  {user.year_entered && (
                    <Card className="border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-green-100 uppercase tracking-wide">Year Entered</p>
                            <p className="text-lg font-bold text-white mt-1">{user.year_entered}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date().getFullYear() - user.year_entered} year(s) enrolled
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {user.campus && (
                    <Card className="border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-br from-brand-orange to-orange-600 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-orange-100 uppercase tracking-wide">Campus</p>
                            <p className="text-lg font-bold text-white mt-1">{user.campus.code}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Building className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold text-gray-900">{user.campus.name}</p>
                        <p className="text-xs text-muted-foreground">{user.campus.city}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Detailed Student Academic Information */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                        <IdCard className="w-4 h-4 text-brand-blue" />
                      </div>
                      <span>Student Academic Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Major Name</span>
                        <span className="text-sm font-semibold text-gray-900">{user.major.name}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Major Code</span>
                        <span className="text-sm font-semibold text-gray-900 font-mono">{user.major.code}</span>
                      </div>
                      {user.year_entered && (
                        <>
                          <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-sm text-muted-foreground">Year Entered</span>
                            <span className="text-sm font-semibold text-gray-900">{user.year_entered}</span>
                          </div>
                          <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-muted-foreground">Academic Year</span>
                            <Badge variant="outline" className="font-semibold">
                              Year {new Date().getFullYear() - user.year_entered + 1}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : user.role === 'teacher' && user.campus ? (
              <>
                {/* Teacher Academic Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-brand-orange to-orange-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-orange-100 uppercase tracking-wide">Assigned Campus</p>
                          <p className="text-lg font-bold text-white mt-1">{user.campus.code}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-gray-900">{user.campus.name}</p>
                      <p className="text-xs text-muted-foreground">{user.campus.city}</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-purple-100 uppercase tracking-wide">Position</p>
                          <p className="text-lg font-bold text-white mt-1">Faculty</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Teaching Staff Member</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-100 uppercase tracking-wide">Active Courses</p>
                          <p className="text-lg font-bold text-white mt-1">{teacherSections?.length || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Course Sections Teaching</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Teacher Academic Information */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-brand-orange" />
                      </div>
                      <span>Teaching Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Primary Campus</span>
                        <span className="text-sm font-semibold text-gray-900">{user.campus.name}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Campus Code</span>
                        <span className="text-sm font-semibold text-gray-900 font-mono">{user.campus.code}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="text-sm font-semibold text-gray-900">{user.campus.city}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <Badge variant="outline" className="font-semibold flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3" />
                          {formatRoleName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Teaching Schedule - Course Sections */}
                {teacherSections && teacherSections.length > 0 && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b pb-4">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-brand-blue" />
                        </div>
                        <span>Teaching Schedule ({teacherSections.length} Sections)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {teacherSections.map((section) => (
                          <div 
                            key={section.id} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-brand-blue hover:bg-blue-50/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                                  <span className="text-sm font-bold text-brand-blue">{section.course.code}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{section.course.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Section {section.section_code} • {section.course.credits} Credits
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Semester</p>
                                <p className="text-sm font-semibold text-gray-900">{section.semester.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Students</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {section.enrolled_count} / {section.max_students}
                                </p>
                              </div>
                              {section.room && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Room</p>
                                  <p className="text-sm font-semibold text-gray-900">{section.room}</p>
                                </div>
                              )}
                              <Badge variant={section.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                {section.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : user.role === 'teacher' && user.campus ? (
              <>
                {/* Teacher Academic Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-brand-orange to-orange-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-orange-100 uppercase tracking-wide">Assigned Campus</p>
                          <p className="text-lg font-bold text-white mt-1">{user.campus.code}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-gray-900">{user.campus.name}</p>
                      <p className="text-xs text-muted-foreground">{user.campus.city}</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-purple-100 uppercase tracking-wide">Position</p>
                          <p className="text-lg font-bold text-white mt-1">Faculty</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Teaching Staff Member</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Teacher Academic Information */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-brand-orange" />
                      </div>
                      <span>Teaching Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Primary Campus</span>
                        <span className="text-sm font-semibold text-gray-900">{user.campus.name}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Campus Code</span>
                        <span className="text-sm font-semibold text-gray-900 font-mono">{user.campus.code}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="text-sm font-semibold text-gray-900">{user.campus.city}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <Badge variant="outline" className="font-semibold flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3" />
                          {formatRoleName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : user.campus ? (
              <>
                {/* Admin/Staff Academic Overview */}
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-brand-blue to-brand-blue/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Primary Campus</p>
                        <p className="text-lg font-bold text-white mt-1">{user.campus.code}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-gray-900">{user.campus.name}</p>
                    <p className="text-xs text-muted-foreground">{user.campus.city}</p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-brand-blue" />
                      </div>
                      <span>Administrative Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-muted-foreground">Campus</span>
                        <span className="text-sm font-semibold text-gray-900">{user.campus.name}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <Badge variant="outline" className="font-semibold flex items-center gap-1.5">
                          <Shield className="w-3 h-3" />
                          {formatRoleName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Academic Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This user doesn&apos;t have any academic information on record yet.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/users/${userId}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Add Academic Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Activity & Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {user.last_login && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-green-900 uppercase tracking-wide">Last Login</label>
                      <p className="mt-1 text-sm font-semibold text-green-900">
                        {format(new Date(user.last_login), 'MMMM dd, yyyy • HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-2 h-2 bg-brand-blue rounded-full mt-2"></div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-blue-900 uppercase tracking-wide">Account Created</label>
                    <p className="mt-1 text-sm font-semibold text-blue-900">
                      {format(new Date(user.created_at), 'MMMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Last Updated</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {format(new Date(user.updated_at), 'MMMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
