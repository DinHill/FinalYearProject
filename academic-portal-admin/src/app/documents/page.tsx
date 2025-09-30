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
  Download,
  Upload,
  Folder,
  File,
  Eye,
  Share2,
  MoreHorizontal,
  Filter
} from 'lucide-react';

export default function DocumentsPage() {
  const mockDocuments = [
    {
      id: 1,
      name: 'Academic Calendar 2024.pdf',
      type: 'PDF',
      category: 'Academic',
      size: '2.4 MB',
      uploadedBy: 'Academic Affairs',
      uploadDate: '2024-01-15',
      downloads: 156,
      status: 'Active',
      isPublic: true
    },
    {
      id: 2,
      name: 'Student Handbook.pdf',
      type: 'PDF',
      category: 'Student Services',
      size: '5.2 MB',
      uploadedBy: 'Student Affairs',
      uploadDate: '2024-01-10',
      downloads: 324,
      status: 'Active',
      isPublic: true
    },
    {
      id: 3,
      name: 'Course Catalog 2024.pdf',
      type: 'PDF',
      category: 'Academic',
      size: '8.7 MB',
      uploadedBy: 'Registrar',
      uploadDate: '2024-01-08',
      downloads: 89,
      status: 'Active',
      isPublic: true
    },
    {
      id: 4,
      name: 'Fee Schedule.xlsx',
      type: 'Excel',
      category: 'Financial',
      size: '125 KB',
      uploadedBy: 'Finance Office',
      uploadDate: '2024-01-05',
      downloads: 67,
      status: 'Active',
      isPublic: false
    },
    {
      id: 5,
      name: 'Campus Map.pdf',
      type: 'PDF',
      category: 'General',
      size: '3.1 MB',
      uploadedBy: 'Facilities',
      uploadDate: '2024-01-03',
      downloads: 234,
      status: 'Active',
      isPublic: true
    }
  ];

  const documentStats = [
    {
      label: 'Total Documents',
      value: '1,248',
      change: '+23',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      label: 'Public Documents',
      value: '856',
      change: '+12',
      icon: Eye,
      color: 'text-green-600'
    },
    {
      label: 'Total Downloads',
      value: '12.4K',
      change: '+8%',
      icon: Download,
      color: 'text-purple-600'
    },
    {
      label: 'Storage Used',
      value: '2.8 GB',
      change: '+156 MB',
      icon: Folder,
      color: 'text-orange-600'
    }
  ];

  const categories = [
    'All Documents',
    'Academic',
    'Student Services',
    'Financial',
    'General',
    'Administrative',
    'Forms'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'Archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      case 'Draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'Excel':
        return <File className="w-4 h-4 text-green-600" />;
      case 'Word':
        return <File className="w-4 h-4 text-blue-600" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Folder className="w-4 h-4 mr-2" />
              Categories
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {documentStats.map((stat, index) => {
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

        {/* Document Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>Manage institutional documents, forms, and resources</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents..." 
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
              {mockDocuments.map((document) => (
                <div key={document.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    {getFileIcon(document.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {document.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{document.category}</span>
                      <span>•</span>
                      <span>{document.size}</span>
                      <span>•</span>
                      <span>By {document.uploadedBy}</span>
                      <span>•</span>
                      <span>{document.uploadDate}</span>
                      <span>•</span>
                      <span>{document.downloads} downloads</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(document.status)}
                    {document.isPublic ? (
                      <Badge variant="outline" className="text-green-600">Public</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">Private</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
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
                <Upload className="w-5 h-5" />
                Bulk Upload
              </CardTitle>
              <CardDescription>Upload multiple documents at once</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Bulk Upload</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Manage Categories
              </CardTitle>
              <CardDescription>Organize documents by categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Edit Categories</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Reports
              </CardTitle>
              <CardDescription>Export document usage analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Generate Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}