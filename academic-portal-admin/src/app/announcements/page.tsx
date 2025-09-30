import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Megaphone,
  Calendar,
  Users,
  Eye,
  Edit3,
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Filter,
  Pin
} from 'lucide-react';

export default function AnnouncementsPage() {
  const mockAnnouncements = [
    {
      id: 1,
      title: 'Spring Semester Registration Opens',
      content: 'Registration for Spring 2024 semester will begin on March 1st. Students can access the registration portal...',
      category: 'Academic',
      priority: 'High',
      status: 'Published',
      publishDate: '2024-02-15',
      expiryDate: '2024-03-15',
      views: 1245,
      author: 'Academic Affairs',
      targetAudience: 'All Students',
      isPinned: true
    },
    {
      id: 2,
      title: 'Library Hours Extended During Finals',
      content: 'The library will be open 24/7 during the final exam period from May 15-30 to support student studying...',
      category: 'Campus',
      priority: 'Medium',
      status: 'Published',
      publishDate: '2024-02-10',
      expiryDate: '2024-05-30',
      views: 856,
      author: 'Library Services',
      targetAudience: 'All Students',
      isPinned: false
    },
    {
      id: 3,
      title: 'New Student Orientation Schedule',
      content: 'Orientation sessions for new students will be held on the following dates. All new students must attend...',
      category: 'Student Services',
      priority: 'High',
      status: 'Draft',
      publishDate: null,
      expiryDate: '2024-09-01',
      views: 0,
      author: 'Student Affairs',
      targetAudience: 'New Students',
      isPinned: false
    },
    {
      id: 4,
      title: 'Campus Maintenance Notice',
      content: 'Scheduled maintenance of the main building elevator will take place this weekend. Please use alternative routes...',
      category: 'Facilities',
      priority: 'Low',
      status: 'Published',
      publishDate: '2024-02-08',
      expiryDate: '2024-02-25',
      views: 234,
      author: 'Facilities Management',
      targetAudience: 'All Users',
      isPinned: false
    },
    {
      id: 5,
      title: 'Scholarship Application Deadline',
      content: 'Applications for merit-based scholarships for Fall 2024 must be submitted by April 30th. Required documents include...',
      category: 'Financial Aid',
      priority: 'High',
      status: 'Scheduled',
      publishDate: '2024-03-01',
      expiryDate: '2024-04-30',
      views: 0,
      author: 'Financial Aid Office',
      targetAudience: 'All Students',
      isPinned: false
    }
  ];

  const announcementStats = [
    {
      label: 'Total Announcements',
      value: '156',
      change: '+12',
      icon: Megaphone,
      color: 'text-blue-600'
    },
    {
      label: 'Published',
      value: '134',
      change: '+8',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Draft',
      value: '15',
      change: '+3',
      icon: Edit3,
      color: 'text-yellow-600'
    },
    {
      label: 'Total Views',
      value: '25.4K',
      change: '+18%',
      icon: Eye,
      color: 'text-purple-600'
    }
  ];

  const categories = [
    'All Categories',
    'Academic',
    'Campus',
    'Student Services',
    'Facilities',
    'Financial Aid',
    'Emergency'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Published
        </Badge>;
      case 'Draft':
        return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <Edit3 className="w-3 h-3" />
          Draft
        </Badge>;
      case 'Scheduled':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Scheduled
        </Badge>;
      case 'Expired':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {announcementStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                    </div>
                    <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Announcement Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Announcement Management</CardTitle>
                <CardDescription>Create and manage campus announcements</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search announcements..." 
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {categories.map((category, index) => (
                <Button 
                  key={index}
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {mockAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {announcement.isPinned && (
                        <Pin className="w-4 h-4 text-blue-600" />
                      )}
                      <h3 className="text-sm font-medium text-foreground">
                        {announcement.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(announcement.priority)}
                      {getStatusBadge(announcement.status)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {announcement.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {announcement.targetAudience}
                      </span>
                      <span>•</span>
                      <span>{announcement.category}</span>
                      <span>•</span>
                      <span>By {announcement.author}</span>
                      {announcement.publishDate && (
                        <>
                          <span>•</span>
                          <span>Published: {announcement.publishDate}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {announcement.views} views
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Emergency Alert
              </CardTitle>
              <CardDescription>Send urgent notifications to all users</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full">Send Emergency Alert</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Announcement
              </CardTitle>
              <CardDescription>Plan future announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Open Scheduler</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Analytics
              </CardTitle>
              <CardDescription>View announcement engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Analytics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}