import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  Target
} from 'lucide-react';

export default function AnalyticsPage() {
  const analyticsData = [
    {
      title: 'Student Enrollment',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      description: 'Total enrolled students this semester'
    },
    {
      title: 'Course Completion Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600',
      description: 'Students completing their courses'
    },
    {
      title: 'Revenue This Month',
      value: '$125,450',
      change: '+8.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-yellow-600',
      description: 'Total revenue from fees and payments'
    },
    {
      title: 'Portal Usage',
      value: '89.7%',
      change: '-1.2%',
      trend: 'down',
      icon: Eye,
      color: 'text-purple-600',
      description: 'Daily active users on portal'
    }
  ];

  const topCourses = [
    {
      name: 'Introduction to Computer Science',
      code: 'CS101',
      enrollment: 156,
      completion: 98,
      satisfaction: 4.8
    },
    {
      name: 'Business Administration',
      code: 'BA201',
      enrollment: 134,
      completion: 89,
      satisfaction: 4.6
    },
    {
      name: 'Digital Marketing',
      code: 'MKT301',
      enrollment: 98,
      completion: 92,
      satisfaction: 4.7
    },
    {
      name: 'Data Analytics',
      code: 'DA401',
      enrollment: 87,
      completion: 95,
      satisfaction: 4.9
    }
  ];

  const monthlyData = [
    { month: 'Jan', students: 2400, revenue: 115000, courses: 45 },
    { month: 'Feb', students: 2600, revenue: 125000, courses: 48 },
    { month: 'Mar', students: 2800, revenue: 135000, courses: 52 },
    { month: 'Apr', students: 2750, revenue: 128000, courses: 50 },
    { month: 'May', students: 2900, revenue: 142000, courses: 55 },
    { month: 'Jun', students: 2847, revenue: 125450, courses: 54 }
  ];

  const recentActivities = [
    {
      activity: 'New student registration spike',
      time: '2 hours ago',
      impact: '+15% compared to last week',
      type: 'positive'
    },
    {
      activity: 'Course completion rate improved',
      time: '1 day ago',
      impact: '+2.1% month over month',
      type: 'positive'
    },
    {
      activity: 'Payment processing delay',
      time: '3 days ago',
      impact: 'Affected 23 transactions',
      type: 'negative'
    },
    {
      activity: 'New feature usage increase',
      time: '1 week ago',
      impact: '+45% feature adoption',
      type: 'positive'
    }
  ];

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsData.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
            const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600';
            
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full bg-muted ${metric.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{metric.change}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{metric.title}</h3>
                    <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Student enrollment and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium text-foreground">{data.month}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Students</p>
                        <p className="font-medium">{data.students.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">${(data.revenue / 1000).toFixed(0)}k</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Courses</p>
                        <p className="font-medium">{data.courses}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Top Performing Courses
              </CardTitle>
              <CardDescription>Courses with highest enrollment and satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">{course.name}</h4>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Enrolled</p>
                        <p className="font-medium">{course.enrollment}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">{course.completion}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Rating</p>
                        <p className="font-medium">{course.satisfaction}⭐</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analytics Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Insights
            </CardTitle>
            <CardDescription>Notable trends and events affecting your metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                  <div className={`mt-1 w-2 h-2 rounded-full ${
                    activity.type === 'positive' ? 'bg-green-600' : 'bg-red-600'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{activity.activity}</h4>
                    <p className="text-sm text-muted-foreground">{activity.impact}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Custom Reports
              </CardTitle>
              <CardDescription>Create detailed analytics reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Create Report</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>Automate report generation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Schedule Reports</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Goal Tracking
              </CardTitle>
              <CardDescription>Set and monitor performance goals</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Manage Goals</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}