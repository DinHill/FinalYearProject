'use client';

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
  Filter,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { UploadMaterialDialog } from '@/components/documents/UploadMaterialDialog';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { BulkUploadDialog } from '@/components/documents/BulkUploadDialog';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Minimal frontend type for documents returned by API
interface DocumentItem {
  id: number | string;
  title?: string;
  document_type?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  status?: string;
  uploaded_by?: number;
    user_id?: number;
    created_at?: string;
}

export default function DocumentsPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  // Share document handler
  const handleShare = async (documentId: number | string, documentTitle?: string) => {
    try {
      const shareUrl = `${window.location.origin}/documents/view/${documentId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied',
        description: `Share link for "${documentTitle || 'document'}" copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy share link',
        variant: 'destructive',
      });
    }
  };

  const handleEditCourseAssignments = () => {
    toast({
      title: "Opening course assignment manager...",
      description: "This feature will be available soon"
    });
    // In production, navigate to course assignment page or open modal
    // router.push('/documents/assignments');
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      toast({
        title: "Generating report...",
        description: "Please wait while we compile the usage data"
      });
      
      const response = await api.get('/api/v1/documents/reports/usage', {
        responseType: 'blob'
      });
      
      if (response.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `document-usage-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast({
          title: "Success",
          description: "Report generated and downloaded"
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Fetch documents from API
  const { data: documentsData, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const result = await api.getDocuments(1, 20);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch documents');
    },
  });

  const documents: DocumentItem[] = (documentsData?.items as DocumentItem[]) || [];

  // Download handler
  const handleDownload = async (documentId: number | string, documentTitle?: string) => {
    toast({
      title: "Downloading...",
      description: `Starting download for: ${documentTitle || 'document'}`,
    });

    const result = await api.downloadDocument(documentId);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <PageHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Failed to load documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Course material types matching the database enum
  const materialTypes = [
    { value: 'all', label: 'All Materials' },
    { value: 'syllabus', label: 'Syllabi' },
    { value: 'lecture_note', label: 'Lecture Notes' },
    { value: 'assignment', label: 'Assignments' },
  ];

  const getFileIcon = (type: string | null | undefined) => {
    if (!type) {
      return <File className="w-4 h-4 text-gray-600" />;
    }
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) {
      return <FileText className="w-4 h-4 text-red-600" />;
    } else if (lowerType.includes('excel') || lowerType.includes('xls')) {
      return <File className="w-4 h-4 text-green-600" />;
    } else if (lowerType.includes('word') || lowerType.includes('doc')) {
      return <File className="w-4 h-4 text-blue-600" />;
    } else {
      return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Course Materials' }]}
        subtitle="Manage course syllabi, lecture notes, assignments and exam materials"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Folder className="w-4 h-4 mr-2" />
              Courses
            </Button>
            <Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90 text-white" onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Course Material
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid - Course Materials focused */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-text-light">Total Materials</p>
                  <p className="text-2xl font-bold text-brand-text-dark">{documentsData?.total?.toString() || '0'}</p>
                  <p className="text-xs text-brand-green">+{documents.filter((d: DocumentItem) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return d.created_at && new Date(d.created_at) > weekAgo;
                  }).length} this week</p>
                </div>
                <div className="p-3 rounded-full bg-brand-blue/10">
                  <FileText className="h-6 w-6 text-brand-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-text-light">Lecture Notes</p>
                  <p className="text-2xl font-bold text-brand-text-dark">{documents.filter((d: DocumentItem) => d.document_type === 'lecture_note').length}</p>
                  <p className="text-xs text-brand-green">Most recent type</p>
                </div>
                <div className="p-3 rounded-full bg-brand-green/10">
                  <Eye className="h-6 w-6 text-brand-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-text-light">Assignments</p>
                  <p className="text-2xl font-bold text-brand-text-dark">{documents.filter((d: DocumentItem) => d.document_type === 'assignment').length}</p>
                  <p className="text-xs text-brand-blue">Active tasks</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-text-light">Storage Used</p>
                  <p className="text-2xl font-bold text-brand-text-dark">{(documents.reduce((sum: number, d: DocumentItem) => sum + (d.file_size || 0), 0) / (1024 * 1024)).toFixed(1)} MB</p>
                  <p className="text-xs text-brand-blue">Course files</p>
                </div>
                <div className="p-3 rounded-full bg-brand-orange/10">
                  <Folder className="h-6 w-6 text-brand-orange" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Uploads - Mobile-friendly quick access */}
        {documents.length > 0 && (() => {
          const recentDocs = documents
            .filter((d: DocumentItem) => d.created_at)
            .sort((a: DocumentItem, b: DocumentItem) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 3);
          
          if (recentDocs.length === 0) return null;
          
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Uploads</CardTitle>
                <CardDescription>Latest course materials added this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDocs.map((doc: DocumentItem) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.mime_type || doc.document_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Course Materials Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>Upload and organize materials used in classes (syllabi, notes, assignments)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search course materials..." 
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Material Type Filter (course materials only) */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {materialTypes.map((type, index) => (
                <Button 
                  key={type.value}
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {type.label}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No documents found</div>
              ) : (
                documents.map((document: DocumentItem) => (
                  <div key={document.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      {getFileIcon(document.mime_type || document.document_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {document.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="capitalize">{document.document_type?.replace('_', ' ') || 'General'}</span>
                        <span>•</span>
                        <span>{document.file_size ? (document.file_size / 1024).toFixed(1) : '0'} KB</span>
                        <span>•</span>
                        <span>{(document.uploaded_by ?? document.user_id) ? `By User #${document.uploaded_by ?? document.user_id}` : 'By Unknown'}</span>
                        <span>•</span>
                        <span>{document.created_at ? new Date(document.created_at).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={document.status === 'active' ? "text-green-600" : "text-orange-600"}>
                        {document.status === 'active' ? 'Active' : document.status || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document.id, document.title)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(document.id, document.title)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedDocument({ id: document.id, title: document.title });
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Upload Materials
              </CardTitle>
              <CardDescription>Upload lecture slides and materials for a course</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setIsBulkUploadDialogOpen(true)}
              >
                Start Bulk Upload
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Manage Courses
              </CardTitle>
              <CardDescription>Assign materials to courses and modules</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={handleEditCourseAssignments}>Edit Course Assignments</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Reports
              </CardTitle>
              <CardDescription>Export material usage and download stats</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Material Dialog */}
      <UploadMaterialDialog 
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />

      {/* Delete Document Dialog */}
      <DeleteDocumentDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        document={selectedDocument}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog 
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
      />
    </AdminLayout>
  );
}