'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  Plus,
  Loader2,
  Eye,
  File,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate, formatFileSize } from '@/lib/utils';
import { SmartPagination } from '@/components/ui/smart-pagination';

interface MaterialsTabProps {
  semesterId: number | null;
}

interface Document {
  id: number;
  filename: string;
  title: string;
  description: string | null;
  category: string;
  file_type: string | null;
  file_size: number;
  file_path: string;
  is_public: boolean;
  uploader_id: string;
  created_at: string;
  updated_at: string;
}

const MATERIAL_CATEGORIES = [
  { value: 'lecture_notes', label: 'Lecture Notes', icon: FileText },
  { value: 'assignment', label: 'Assignments', icon: FileText },
  { value: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { value: 'reading', label: 'Reading Materials', icon: FileText },
  { value: 'presentation', label: 'Presentations', icon: FileImage },
  { value: 'video', label: 'Videos', icon: FileVideo },
  { value: 'other', label: 'Other', icon: File },
];

export function MaterialsTab({ semesterId }: MaterialsTabProps) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Document | null>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('lecture_notes');
  const [isPublic, setIsPublic] = useState(true);

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['course-materials', currentPage, categoryFilter, searchTerm],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        page_size: 20,
      };
      
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get<any>('/api/v1/documents', { params });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file selected');

      setIsUploading(true);
      setUploadProgress(10);

      // Step 1: Get upload URL
      const uploadUrlResponse = await api.post<any>('/api/v1/documents/upload-url', {
        filename: uploadFile.name,
        content_type: uploadFile.type,
        category: uploadCategory,
      });

      if (!uploadUrlResponse.success) {
        throw new Error(uploadUrlResponse.error || 'Failed to get upload URL');
      }

      const { upload_url, file_path, method, headers } = uploadUrlResponse.data;
      setUploadProgress(30);

      // Step 2: Upload file directly to storage
      const uploadHeaders: HeadersInit = {
        ...headers,
      };

      const uploadResponse = await fetch(upload_url, {
        method: method || 'PUT',
        headers: uploadHeaders,
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(70);

      // Step 3: Create document metadata
      const createDocResponse = await api.post<any>('/api/v1/documents', {
        file_path,
        filename: uploadFile.name,
        file_type: uploadFile.type,
        category: uploadCategory,
        title: uploadTitle || uploadFile.name,
        description: uploadDescription || null,
        is_public: isPublic,
      });

      if (!createDocResponse.success) {
        throw new Error(createDocResponse.error || 'Failed to save document metadata');
      }

      setUploadProgress(100);
      return createDocResponse.data;
    },
    onSuccess: () => {
      toast.success('Material uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['course-materials'] });
      setIsUploadDialogOpen(false);
      resetUploadForm();
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await api.delete(`/api/v1/documents/${documentId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setMaterialToDelete(null); // Close dialog
      toast.success('Material deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['course-materials'] });
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  // Confirm delete handler
  const confirmDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  // Download document
  const handleDownload = async (document: Document) => {
    try {
      const response = await api.get<any>(`/api/v1/documents/${document.id}/download-url`, {
        params: { disposition: 'attachment' },
      });

      if (!response.success) throw new Error(response.error);

      const { download_url } = response.data;
      window.open(download_url, '_blank');
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // View document (inline)
  const handleView = async (document: Document) => {
    try {
      const response = await api.get<any>(`/api/v1/documents/${document.id}/download-url`, {
        params: { disposition: 'inline' },
      });

      if (!response.success) throw new Error(response.error);

      const { download_url } = response.data;
      window.open(download_url, '_blank');
    } catch (error) {
      toast.error('Failed to view file');
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('lecture_notes');
    setIsPublic(true);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must not exceed 50MB');
        return;
      }
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name);
      }
    }
  };

  const getFileIcon = (fileType: string | null | undefined) => {
    if (!fileType) return <File className="h-5 w-5 text-gray-600" />;
    const lowerType = fileType.toLowerCase();
    if (lowerType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (lowerType.includes('sheet') || lowerType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    if (lowerType.includes('image')) return <FileImage className="h-5 w-5 text-blue-600" />;
    if (lowerType.includes('video')) return <FileVideo className="h-5 w-5 text-purple-600" />;
    if (lowerType.includes('presentation') || lowerType.includes('powerpoint')) return <FileImage className="h-5 w-5 text-orange-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const getCategoryIcon = (category: string) => {
    const cat = MATERIAL_CATEGORIES.find(c => c.value === category);
    const Icon = cat?.icon || File;
    return <Icon className="h-4 w-4" />;
  };

  const documents = documentsData?.items || [];
  const totalDocuments = documentsData?.total || 0;
  const totalPages = Math.ceil(totalDocuments / 20);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Materials
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upload and manage learning materials, assignments, and resources
              </p>
            </div>
            <Button className="gap-2" onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload Material
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Upload Course Material</DialogTitle>
                  <DialogDescription>
                    Upload files for students to access. Max file size: 50MB
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.mp4,.avi"
                    />
                    {uploadFile && (
                      <p className="text-sm text-muted-foreground">
                        {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter material title"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={uploadCategory} onValueChange={setUploadCategory} disabled={isUploading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(cat.value)}
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Optional description or notes"
                      rows={3}
                      disabled={isUploading}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={isUploading}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_public" className="font-normal">
                      Make this material publicly accessible to all students
                    </Label>
                  </div>

                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="px-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUploadDialogOpen(false);
                      resetUploadForm();
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={!uploadFile || !uploadTitle || isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MATERIAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Materials Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No materials found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload your first material to get started'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc: Document) => (
                    <TableRow key={doc.id}>
                      <TableCell>{getFileIcon(doc.file_type)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{doc.filename}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {getCategoryIcon(doc.category)}
                          {MATERIAL_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.is_public ? 'default' : 'secondary'}>
                          {doc.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(doc)}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="h-8 w-8 p-0"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMaterialToDelete(doc)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {documentsData && totalDocuments > 0 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalDocuments}
              itemsPerPage={20}
              itemName="materials"
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={materialToDelete !== null} onOpenChange={() => setMaterialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{materialToDelete?.title}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
