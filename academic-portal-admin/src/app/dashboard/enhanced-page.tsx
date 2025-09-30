import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { Plus, TrendingUp, Users, BookOpen, GraduationCap, DollarSign, Calendar, Activity } from 'lucide-react';

export default function EnhancedDashboard() {
  const metrics = [
    {
      title: "Total Students",
      value: 1247,
      trend: { value: 12, label: "vs last month", direction: "up" as const },
      icon: Users,
      variant: "info" as const,
    },
    {
      title: "Active Courses",
      value: 64,
      trend: { value: 8, label: "new this semester", direction: "up" as const },
      icon: BookOpen,
      variant: "success" as const,
    },
    {
      title: "Faculty Members",
      value: 89,
      trend: { value: 2, label: "hired this month", direction: "up" as const },
      icon: GraduationCap,
      variant: "purple" as const,
    },
    {
      title: "Revenue",
      value: "$2.4M",
      trend: { value: 15, label: "quarterly growth", direction: "up" as const },
      icon: DollarSign,
      variant: "success" as const,
    },
  ];

  const recentActivities = [
    { id: 1, action: "New student enrollment", user: "John Doe", time: "2 minutes ago", type: "success" },
    { id: 2, action: "Course completion", user: "Jane Smith", time: "5 minutes ago", type: "info" },
    { id: 3, action: "Payment received", user: "Mike Johnson", time: "10 minutes ago", type: "success" },
    { id: 4, action: "Document uploaded", user: "Sarah Wilson", time: "15 minutes ago", type: "info" },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening at your institution."
        actions={
          <div className="flex gap-3">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View Schedule
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
              icon={metric.icon}
              variant={metric.variant}
            />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <EnhancedCard variant="elevated" className="lg:col-span-2">
            <EnhancedCardHeader>
              <EnhancedCardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Performance Overview
              </EnhancedCardTitle>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-green-800">Enrollment Rate</p>
                    <p className="text-2xl font-bold text-green-900">94.2%</p>
                  </div>
                  <div className="text-green-600">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Satisfaction</p>
                    <p className="text-xl font-bold text-blue-900">4.8/5</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-800">Retention</p>
                    <p className="text-xl font-bold text-purple-900">92%</p>
                  </div>
                </div>
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          {/* Recent Activity */}
          <EnhancedCard>
            <EnhancedCardHeader>
              <EnhancedCardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activity
              </EnhancedCardTitle>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Add Student", icon: Users, href: "/users", color: "blue" },
            { label: "Create Course", icon: BookOpen, href: "/academics", color: "green" },
            { label: "Send Announcement", icon: Calendar, href: "/announcements", color: "purple" },
            { label: "Generate Report", icon: Activity, href: "/analytics", color: "orange" },
          ].map((action, index) => (
            <EnhancedCard 
              key={index} 
              variant="interactive"
              className="cursor-pointer group"
            >
              <EnhancedCardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-foreground">{action.label}</span>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}