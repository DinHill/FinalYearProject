'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, BookOpen, GraduationCap, DollarSign, FileText, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import { api, DashboardStats, RecentActivity } from '@/lib/api';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    try {
      const [statsResult, activityResult] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivity(10)
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        setError(statsResult.error || 'Failed to load statistics');
      }

      if (activityResult.success && activityResult.data) {
        setRecentActivity(activityResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

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
      
      <div className="p-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
                <p className="text-3xl font-bold mt-2 text-blue-600">{stats.users.total_students.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active learners
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
          </div>
          
          {/* Active Courses */}
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Active Courses</h3>
                <p className="text-3xl font-bold mt-2 text-green-600">{stats.academics.active_courses}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.academics.total_courses} total courses
                </p>
              </div>
              <BookOpen className="w-10 h-10 text-green-500 opacity-80" />
            </div>
          </div>
          
          {/* Faculty Members */}
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Faculty Members</h3>
                <p className="text-3xl font-bold mt-2 text-purple-600">{stats.users.total_teachers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.users.total_staff} staff members
                </p>
              </div>
              <GraduationCap className="w-10 h-10 text-purple-500 opacity-80" />
            </div>
          </div>
          
          {/* Attendance Rate */}
          <div className="p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Attendance Rate</h3>
                <p className="text-3xl font-bold mt-2 text-orange-600">{stats.academics.attendance_rate}%</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  Last 30 days
                </p>
              </div>
              <Calendar className="w-10 h-10 text-orange-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* Total Revenue */}
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <p className="text-2xl font-bold mt-2">{formatCurrency(stats.finance.total_revenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500 opacity-80" />
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Pending Invoices</h3>
                <p className="text-2xl font-bold mt-2">{stats.finance.pending_invoices}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-500 opacity-80" />
            </div>
          </div>

          {/* Pending Documents */}
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Pending Documents</h3>
                <p className="text-2xl font-bold mt-2">{stats.pending.documents}</p>
              </div>
              <FileText className="w-8 h-8 text-cyan-500 opacity-80" />
            </div>
          </div>

          {/* Pending Tickets */}
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Open Tickets</h3>
                <p className="text-2xl font-bold mt-2">{stats.pending.tickets}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-rose-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {recentActivity && (
              <span className="text-sm text-muted-foreground">
                {recentActivity.total} activities
              </span>
            )}
          </div>
          <div className="bg-card rounded-lg border">
            <div className="p-6">
              {recentActivity && recentActivity.activities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`w-2 h-2 mt-2 rounded-full ${
                        activity.type === 'user_created' ? 'bg-blue-500' :
                        activity.type === 'enrollment' ? 'bg-green-500' :
                        activity.type === 'announcement' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">System Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Campuses</span>
                <span className="font-semibold">{stats.system.campuses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Majors</span>
                <span className="font-semibold">{stats.system.majors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Enrollments</span>
                <span className="font-semibold">{stats.academics.total_enrollments}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Academic Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Enrollments</span>
                <span className="font-semibold text-green-600">{stats.academics.active_enrollments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Recent Announcements</span>
                <span className="font-semibold">{stats.system.recent_announcements}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Action Required</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Documents</span>
                <span className={`font-semibold ${stats.pending.documents > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {stats.pending.documents}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Open Tickets</span>
                <span className={`font-semibold ${stats.pending.tickets > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  {stats.pending.tickets}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Invoices</span>
                <span className={`font-semibold ${stats.finance.pending_invoices > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {stats.finance.pending_invoices}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
