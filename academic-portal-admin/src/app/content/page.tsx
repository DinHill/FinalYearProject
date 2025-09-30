import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Calendar,
  Eye,
  Edit3,
  MoreHorizontal,
  Upload
} from 'lucide-react';

export default function ContentPage() {
  const mockContent = [
    {
      id: 1,
      title: 'Welcome to Greenwich University Vietnam',
      type: 'Article',
      category: 'News',
      status: 'Published',
      author: 'Marketing Team',
      publishDate: '2024-01-15',
      views: 1250,
      thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=100&h=60&fit=crop'
    },
    {
      id: 2,
      title: 'New Academic Programs for 2024',
      type: 'Article',
      category: 'Academic',
      status: 'Published',
      author: 'Academic Affairs',
      publishDate: '2024-01-10',
      views: 856,
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=60&fit=crop'
    },
    {
      id: 3,
      title: 'Campus Tour Video 2024',
      type: 'Video',
      category: 'Campus Life',
      status: 'Draft',
      author: 'Media Team',
      publishDate: '2024-01-20',
      views: 0,
      thumbnail: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=60&fit=crop'
    },
    {
      id: 4,
      title: 'Student Success Stories',
      type: 'Gallery',
      category: 'Success Stories',
      status: 'Published',
      author: 'Student Affairs',
      publishDate: '2024-01-05',
      views: 2341,
      thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=100&h=60&fit=crop'
    }
  ];

  const contentStats = [
    {
      label: 'Total Articles',
      value: '156',
      change: '+12',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      label: 'Published',
      value: '134',
      change: '+8',
      icon: Eye,
      color: 'text-green-600'
    },
    {
      label: 'Draft',
      value: '22',
      change: '+4',
      icon: Edit3,
      color: 'text-orange-600'
    },
    {
      label: 'Total Views',
      value: '45.2K',
      change: '+15%',
      icon: Eye,
      color: 'text-purple-600'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'Draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'Archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return <Video className="w-4 h-4" />;
      case 'Gallery':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Media Library
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contentStats.map((stat, index) => {
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

        {/* Content Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Library</CardTitle>
                <CardDescription>Manage your website content, articles, and media</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search content..." 
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockContent.map((content) => (
                <div key={content.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-16 h-10 bg-muted rounded overflow-hidden">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${content.thumbnail})` }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(content.type)}
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {content.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>By {content.author}</span>
                      <span>•</span>
                      <span>{content.category}</span>
                      <span>•</span>
                      <span>{content.publishDate}</span>
                      <span>•</span>
                      <span>{content.views} views</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(content.status)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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
                <FileText className="w-5 h-5" />
                Create Article
              </CardTitle>
              <CardDescription>Write and publish new articles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Writing</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Media Gallery
              </CardTitle>
              <CardDescription>Manage images and media files</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Browse Media</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Content Calendar
              </CardTitle>
              <CardDescription>Plan and schedule content</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Calendar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}