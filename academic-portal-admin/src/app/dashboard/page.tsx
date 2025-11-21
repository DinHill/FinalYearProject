'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, TrendingUp, Users, GraduationCap, DollarSign, FileText, AlertCircle, Calendar, Loader2, Bell, Clock, BarChart3, Settings, Megaphone, Download, CreditCard } from 'lucide-react';
import { api, DashboardStats, getAuthToken } from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CreateAnnouncementDialog } from '@/components/dashboard/CreateAnnouncementDialog';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // First, check authentication synchronously
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Ensure token is available
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Load stats - removed timeout to allow first slow query to complete
      // Subsequent requests will be fast (~26ms) due to database caching
      const statsResult = await api.getDashboardStats();
      
      // const [statsResult, activityResult] = await Promise.all([
      //   api.getDashboardStats(),
      //   api.getRecentActivity(10)
      // ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        setError(statsResult.error || 'Failed to load statistics');
      }

      // if (activityResult.success && activityResult.data) {
      //   setRecentActivity(activityResult.data);
      // }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Only load data after authentication is confirmed
    if (!isAuthenticated) {
      return;
    }
    
    // Small delay to ensure token is persisted to localStorage
    const timeoutId = setTimeout(() => {
      const storedToken = localStorage.getItem('admin_token');
      if (!storedToken) {
        console.error('❌ No token in localStorage on dashboard mount!');
        router.push('/login');
        return;
      }
      console.log('✅ Token verified in localStorage before loading dashboard');
      loadDashboardData();
    }, 100); // Reduced to 100ms since backend handles clock skew
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, loadDashboardData, router]);

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <PageHeader />
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData}>
              Retry
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <Button onClick={loadDashboardData}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Total Students */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-2xl font-semibold mb-2">{stats.users.total_students.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mb-3">Active learners in the system</p>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                    <span className="text-sm text-green-600">+12% this month</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Courses */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Active Courses</p>
                  <p className="text-2xl font-semibold mb-2">{stats.academics.active_courses}</p>
                  <p className="text-xs text-muted-foreground mb-3">{stats.academics.total_courses} total courses available</p>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                    <span className="text-sm text-green-600">+{stats.academics.active_courses - stats.academics.total_courses + 15} new</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
                  <p className="text-2xl font-semibold mb-2">{stats.pending.documents + stats.pending.tickets}</p>
                  <p className="text-xs text-muted-foreground mb-3">Document and support requests</p>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-orange-600" />
                    <span className="text-sm text-orange-600">Needs attention</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue This Month */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Revenue This Month</p>
                  <p className="text-2xl font-semibold mb-2">{formatCurrency(stats.finance.total_revenue)}</p>
                  <p className="text-xs text-muted-foreground mb-3">Tuition, fees, and services</p>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                    <span className="text-sm text-green-600">+15% vs last month</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Payments */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Outstanding Payments</p>
                  <p className="text-2xl font-semibold mb-2">{stats.finance.pending_invoices}</p>
                  <p className="text-xs text-muted-foreground mb-3">Unpaid invoices requiring attention</p>
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                    <span className="text-sm text-red-600">{stats.finance.pending_invoices} overdue</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Course Completion</p>
                  <p className="text-2xl font-semibold mb-2">{stats.academics.attendance_rate}%</p>
                  <p className="text-xs text-muted-foreground mb-3">Average completion rate this term</p>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="text-sm text-blue-600">+3% improvement</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recent Activities
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAnnouncementDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Recent activity will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Tasks and Alerts */}
          <div className="space-y-6">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Process document requests</p>
                        <p className="text-xs text-muted-foreground">{stats.pending.documents} requests pending</p>
                      </div>
                      <Badge variant="destructive" className="text-xs ml-2">high</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Due Today</span>
                      <span>60% complete</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Review enrollment applications</p>
                        <p className="text-xs text-muted-foreground">{stats.academics.total_enrollments} applications awaiting</p>
                      </div>
                      <Badge variant="default" className="text-xs ml-2">medium</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Due Tomorrow</span>
                      <span>30% complete</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Generate monthly financial report</p>
                        <p className="text-xs text-muted-foreground">Revenue and payment analytics</p>
                      </div>
                      <Badge variant="default" className="text-xs ml-2">medium</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Due This Week</span>
                      <span>75% complete</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.pending.documents > 0 && (
                    <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Pending Documents</p>
                        <Button variant="outline" size="sm" className="text-xs h-6">
                          Review
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{stats.pending.documents} document requests need processing</p>
                    </div>
                  )}
                  
                  {stats.pending.tickets > 0 && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Open Tickets</p>
                        <Button variant="outline" size="sm" className="text-xs h-6">
                          View
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{stats.pending.tickets} support tickets awaiting response</p>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">System Status</p>
                      <Button variant="outline" size="sm" className="text-xs h-6">
                        View Details
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                <span className="text-xs">Add Student</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <GraduationCap className="w-6 h-6" />
                <span className="text-xs">Manage Courses</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-xs">Process Docs</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <CreditCard className="w-6 h-6" />
                <span className="text-xs">Create Invoice</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Megaphone className="w-6 h-6" />
                <span className="text-xs">Send Notice</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Download className="w-6 h-6" />
                <span className="text-xs">Export Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcement Dialog */}
      <CreateAnnouncementDialog
        open={announcementDialogOpen}
        onOpenChange={setAnnouncementDialogOpen}
      />
    </AdminLayout>
  );
}
