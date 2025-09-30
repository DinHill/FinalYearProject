'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, TrendingUp, Users, BookOpen, GraduationCap, FileText, AlertTriangle, Activity } from 'lucide-react'
import { useDashboardStats, useFirebaseStatus } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: firebaseStatus } = useFirebaseStatus()

  if (statsLoading) {
    return (
      <AdminLayout>
        <PageHeader />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard"
        subtitle="Welcome to Greenwich Academic Portal Admin"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
                  <p className="text-3xl font-bold mt-2 text-blue-600">
                    {stats?.total_users || 0}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    {stats?.active_users || 0} active
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Active Courses</h3>
                  <p className="text-3xl font-bold mt-2 text-green-600">
                    {stats?.total_courses || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">This semester</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Announcements</h3>
                  <p className="text-3xl font-bold mt-2 text-purple-600">
                    {stats?.total_announcements || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Firebase Status</h3>
                  <p className="text-lg font-semibold mt-2">
                    {firebaseStatus?.initialized ? (
                      <span className="text-green-600 flex items-center">
                        <Activity className="w-4 h-4 mr-1" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Disconnected
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {firebaseStatus?.project_id || 'No project'}
                  </p>
                </div>
                <GraduationCap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recent_activity?.length ? (
                  stats.recent_activity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.created_at, true)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Server</span>
                  <span className="text-sm text-green-600 flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm text-green-600 flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Firebase</span>
                  <span className={`text-sm flex items-center ${
                    firebaseStatus?.initialized ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {firebaseStatus?.initialized ? (
                      <>
                        <Activity className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </span>
                </div>
                {firebaseStatus?.services && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Firebase Services</h4>
                    <div className="space-y-2">
                      {Object.entries(firebaseStatus.services).map(([service, status]) => (
                        <div key={service} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground capitalize">
                            {service}
                          </span>
                          <span className={`text-xs ${status ? 'text-green-600' : 'text-red-600'}`}>
                            {status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}