'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { 
  User, 
  Mail, 
  Calendar, 
  Building2, 
  Shield, 
  Edit2, 
  Save, 
  X, 
  Loader2,
  Camera,
  Key,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  role: string;
  username: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: string;
  avatar_url?: string;
  campus?: {
    id: number;
    name: string;
    code: string;
  };
  major?: {
    id: number;
    name: string;
    code: string;
  };
  created_at: string;
  last_login?: string;
  status: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get<UserProfile>('/api/v1/me/profile');
      if (response.data) {
        setProfile(response.data);
        setEditedProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch('/api/v1/me/profile', {
        full_name: editedProfile.full_name,
        phone_number: editedProfile.phone_number,
        address: editedProfile.address,
        date_of_birth: editedProfile.date_of_birth,
      });
      
      toast.success('Profile updated successfully');
      
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setEditing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      teacher: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
      staff: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Failed to load profile</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account information and settings"
          actions={
            !editing ? (
              <Button onClick={() => setEditing(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : null
          }
        />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  {editing && (
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Name and Role */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                  <Badge className={getRoleBadgeColor(profile.role)}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                  <Badge className={getStatusBadgeColor(profile.status)}>
                    {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="w-full pt-4 border-t space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground break-all">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">@{profile.username}</span>
                  </div>
                  {profile.campus && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{profile.campus.name}</span>
                    </div>
                  )}
                  {profile.last_login && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last login: {new Date(profile.last_login).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editing ? editedProfile.full_name : profile.full_name}
                        onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                        disabled={!editing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editing ? editedProfile.phone_number || '' : profile.phone_number || 'Not provided'}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phone_number: e.target.value })}
                        disabled={!editing}
                        placeholder="+84 XXX XXX XXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={editing ? editedProfile.date_of_birth || '' : profile.date_of_birth || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                        disabled={!editing}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editing ? editedProfile.address || '' : profile.address || 'Not provided'}
                        onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                        disabled={!editing}
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} disabled={saving} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account settings and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Role</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {profile.campus && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Campus</p>
                            <p className="text-sm text-muted-foreground">{profile.campus.name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {profile.major && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Major</p>
                            <p className="text-sm text-muted-foreground">{profile.major.name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Member Since</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent actions and login history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.last_login && (
                      <div className="flex items-start gap-3 p-3 border-l-2 border-primary">
                        <Clock className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Last Login</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(profile.last_login).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Activity history coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
