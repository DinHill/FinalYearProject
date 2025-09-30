import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  HeadphonesIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  User,
  Calendar,
  Tag,
  Filter,
  MoreHorizontal,
  Reply,
  Archive,
  Forward
} from 'lucide-react';

export default function SupportPage() {
  const mockTickets = [
    {
      id: 'TK-001',
      title: 'Unable to access course materials',
      description: 'Student cannot access course materials for CS101. Getting permission error when trying to download files.',
      category: 'Technical',
      priority: 'High',
      status: 'Open',
      submittedBy: 'John Doe (Student)',
      assignedTo: 'IT Support Team',
      submittedDate: '2024-02-15 09:30',
      lastUpdate: '2024-02-15 14:22',
      responses: 3
    },
    {
      id: 'TK-002',
      title: 'Fee payment confirmation not received',
      description: 'Paid tuition fee 3 days ago via bank transfer but have not received confirmation email.',
      category: 'Financial',
      priority: 'Medium',
      status: 'In Progress',
      submittedBy: 'Jane Smith (Student)',
      assignedTo: 'Finance Office',
      submittedDate: '2024-02-14 16:45',
      lastUpdate: '2024-02-15 10:15',
      responses: 2
    },
    {
      id: 'TK-003',
      title: 'Room booking system error',
      description: 'Faculty portal showing error when trying to book conference room. System returns 500 error.',
      category: 'Technical',
      priority: 'High',
      status: 'Open',
      submittedBy: 'Dr. Mike Johnson (Faculty)',
      assignedTo: 'IT Support Team',
      submittedDate: '2024-02-15 11:20',
      lastUpdate: '2024-02-15 11:20',
      responses: 0
    },
    {
      id: 'TK-004',
      title: 'Grade dispute for MATH201',
      description: 'Student believes there was an error in final grade calculation for MATH201 course.',
      category: 'Academic',
      priority: 'Low',
      status: 'Resolved',
      submittedBy: 'Sarah Wilson (Student)',
      assignedTo: 'Academic Affairs',
      submittedDate: '2024-02-10 14:30',
      lastUpdate: '2024-02-14 16:45',
      responses: 5
    },
    {
      id: 'TK-005',
      title: 'Library card activation issue',
      description: 'New student unable to activate library card. System shows account not found error.',
      category: 'Services',
      priority: 'Medium',
      status: 'In Progress',
      submittedBy: 'David Brown (Student)',
      assignedTo: 'Library Services',
      submittedDate: '2024-02-13 10:15',
      lastUpdate: '2024-02-15 09:30',
      responses: 1
    }
  ];

  const supportStats = [
    {
      label: 'Open Tickets',
      value: '23',
      change: '+5',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      label: 'In Progress',
      value: '15',
      change: '+2',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      label: 'Resolved Today',
      value: '12',
      change: '+8',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Avg Response Time',
      value: '2.4h',
      change: '-0.3h',
      icon: HeadphonesIcon,
      color: 'text-blue-600'
    }
  ];

  const categories = [
    'All Tickets',
    'Technical',
    'Academic',
    'Financial',
    'Services',
    'Account Issues',
    'Other'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Open
        </Badge>;
      case 'In Progress':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          In Progress
        </Badge>;
      case 'Resolved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </Badge>;
      case 'Closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical':
        return <Tag className="w-4 h-4 text-blue-600" />;
      case 'Academic':
        return <Tag className="w-4 h-4 text-green-600" />;
      case 'Financial':
        return <Tag className="w-4 h-4 text-yellow-600" />;
      case 'Services':
        return <Tag className="w-4 h-4 text-purple-600" />;
      default:
        return <Tag className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      <p className="text-sm text-green-600 mt-1">{stat.change} today</p>
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

        {/* Support Ticket Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Help desk and technical support management</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search tickets..." 
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
              {mockTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(ticket.category)}
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          {ticket.id}: {ticket.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.submittedBy}
                      </span>
                      <span>•</span>
                      <span>Assigned to: {ticket.assignedTo}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ticket.submittedDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {ticket.responses} responses
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Forward className="w-4 h-4" />
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
                <HeadphonesIcon className="w-5 h-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>Manage FAQ and help articles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Articles</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Chat
              </CardTitle>
              <CardDescription>Enable real-time support chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Start Live Chat</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Support Analytics
              </CardTitle>
              <CardDescription>View support performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Reports</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}