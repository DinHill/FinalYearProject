import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Calendar,
  Bell
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    type: "up" | "down" | "neutral";
  };
  icon: React.ReactNode;
}

function StatCard({ title, value, description, trend, icon }: StatCardProps) {
  const TrendIcon = trend?.type === "up" ? TrendingUp : trend?.type === "down" ? TrendingDown : Clock;
  const trendColor = trend?.type === "up" ? "text-green-600" : trend?.type === "down" ? "text-red-600" : "text-gray-600";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <div className={`flex items-center ${trendColor}`}>
                <TrendIcon className="w-3 h-3 mr-1" />
                {Math.abs(trend.value)}%
              </div>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const stats = [
    {
      title: "Active Users",
      value: "2,847",
      description: "Students and faculty",
      trend: { value: 8.2, type: "up" as const },
      icon: <Users className="w-4 h-4" />
    },
    {
      title: "Open Requests",
      value: "23",
      description: "Document requests",
      trend: { value: 12, type: "down" as const },
      icon: <FileText className="w-4 h-4" />
    },
    {
      title: "Unpaid Invoices",
      value: "₦1.2M",
      description: "Outstanding fees",
      trend: { value: 5.1, type: "up" as const },
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      title: "System Health",
      value: "99.9%",
      description: "Uptime this month",
      trend: { value: 0.1, type: "neutral" as const },
      icon: <Activity className="w-4 h-4" />
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "urgent",
      title: "Document Request Overdue",
      description: "5 transcript requests are overdue for processing",
      time: "2 hours ago",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 2,
      type: "info",
      title: "New User Registration",
      description: "12 new students registered today",
      time: "4 hours ago",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 3,
      type: "success",
      title: "Payment Received",
      description: "₦450,000 in fees collected this week",
      time: "1 day ago",
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: 4,
      type: "warning",
      title: "System Maintenance",
      description: "Payment gateway maintenance scheduled for tonight",
      time: "2 days ago",
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome back! Here's what's happening in your academic portal."
          breadcrumbs={[{ label: "Dashboard" }]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export Report
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                Refresh Data
              </Button>
            </div>
          }
        />
        
        <div className="px-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Add New User
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Process Documents
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Send Announcement
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  <CardDescription>Latest updates and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'urgent' ? 'bg-red-100 text-red-600' :
                          activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          activity.type === 'success' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">System Status</CardTitle>
              <CardDescription>Current status of academic portal services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Student Portal</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Payment Gateway</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Document Processing</span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}