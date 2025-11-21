'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Megaphone,
  Calendar,
  Users,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Filter,
  Trash2,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, type Announcement } from '@/lib/api';
import { useState } from 'react';
import { CreateAnnouncementDialog } from '@/components/dashboard/CreateAnnouncementDialog';
import { EditAnnouncementDialog } from '@/components/dashboard/EditAnnouncementDialog';
import { DeleteAnnouncementDialog } from '@/components/dashboard/DeleteAnnouncementDialog';
import { ViewAnnouncementDialog } from '@/components/announcements/ViewAnnouncementDialog';

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState('news');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  
  // Fetch announcements from API
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const result = await api.getAnnouncements(1, 20);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch announcements');
    },
  });

  const announcements = announcementsData?.items || [];

  const getStatusBadge = (status: 'published' | 'draft' | 'scheduled') => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
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
        breadcrumbs={[{ label: 'Announcements' }]}
        subtitle="Create and manage campus news and announcements"
        actions={
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="news">News & Announcements</TabsTrigger>
            <TabsTrigger value="regulations">Regulations & Guides</TabsTrigger>
          </TabsList>

          {/* NEWS & ANNOUNCEMENTS TAB */}
          <TabsContent value="news" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Announcements</p>
                      <p className="text-xl font-semibold">{announcementsData?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-xl font-semibold">
                        {announcements.filter((a: Announcement) => a.is_published).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Drafts</p>
                      <p className="text-xl font-semibold">
                        {announcements.filter((a: Announcement) => !a.is_published).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-xl font-semibold">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search announcements..." 
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Card Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No announcements found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((announcement: Announcement) => (
                  <Card key={announcement.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(announcement.is_published ? 'published' : 'draft')}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAnnouncement(announcement);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAnnouncement(announcement);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedAnnouncement(announcement);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{announcement.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {announcement.content}
                      </p>
                      
                      <div className="space-y-3">
                        {/* Priority & Target Audience */}
                        <div className="flex flex-wrap gap-1">
                          {getPriorityBadge(announcement.priority)}
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {announcement.target_audience}
                          </Badge>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            0 views
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REGULATIONS & GUIDES TAB */}
          <TabsContent value="regulations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Official Documents</h3>
                <p className="text-sm text-muted-foreground">Academic policies, regulations, and service guides</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">Academic Policies & Procedures</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Replace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge>Regulation</Badge>
                      <Badge variant="outline">Academic</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Official academic policies and procedures for students and faculty
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated: 2024-07-15</span>
                      <span>2,341 downloads</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-lg">Student Code of Conduct</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Replace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge>Regulation</Badge>
                      <Badge variant="outline">Student Life</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Official code of conduct and behavioral expectations for students
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated: 2024-06-20</span>
                      <span>1,876 downloads</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-lg">How to Request Transcripts</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Replace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Service Guide</Badge>
                      <Badge variant="outline">Student Services</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Step-by-step guide for requesting official transcripts
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated: 2024-08-01</span>
                      <span>987 downloads</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <CardTitle className="text-lg">Financial Aid Application Guide</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Replace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Service Guide</Badge>
                      <Badge variant="outline">Financial Aid</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete guide for applying for financial aid and scholarships
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated: 2024-07-25</span>
                      <span>1,234 downloads</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions - Below tabs */}
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

      {/* Create Announcement Dialog */}
      <CreateAnnouncementDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Announcement Dialog */}
      <EditAnnouncementDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        announcement={selectedAnnouncement}
      />

      {/* Delete Announcement Dialog */}
      <DeleteAnnouncementDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        announcement={selectedAnnouncement}
      />

      <ViewAnnouncementDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        announcement={selectedAnnouncement}
      />
    </AdminLayout>
  );
}