'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  Download,
  Eye,
  Trash2,
  Loader2,
  File,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  Upload,
} from 'lucide-react';
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
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate, formatFileSize } from '@/lib/utils';

interface MaterialsCourseViewProps {
  semesterId: number | null;
}

interface Material {
  id: number;
  filename: string;
  title: string;
  description: string | null;
  category: string;
  file_type: string | null;
  file_size: number;
  file_path: string;
  is_public: boolean;
  uploader_id: string | null;
  uploader_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  level: number;
  is_active: boolean;
  materials_count: number;
  materials: Material[];
}

interface Program {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  course_count: number;
  courses: Course[];
}

const MATERIAL_CATEGORIES: Record<string, string> = {
  lecture_notes: 'Lecture Notes',
  assignment: 'Assignments',
  syllabus: 'Syllabus',
  reading: 'Reading Materials',
  presentation: 'Presentations',
  video: 'Videos',
  other: 'Other',
};

const MATERIAL_CATEGORIES_WITH_ICONS = [
  { value: 'lecture_notes', label: 'Lecture Notes', icon: FileText },
  { value: 'assignment', label: 'Assignments', icon: FileText },
  { value: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { value: 'reading', label: 'Reading Materials', icon: FileText },
  { value: 'presentation', label: 'Presentations', icon: FileImage },
  { value: 'video', label: 'Videos', icon: FileVideo },
  { value: 'other', label: 'Other', icon: File },
];

export function MaterialsCourseView({ semesterId }: MaterialsCourseViewProps) {
  const queryClient = useQueryClient();
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  
  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('lecture_notes');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch hierarchical data
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['materials-course-view', semesterId],
    queryFn: async () => {
      const params: { semester_id?: number } = {};
      if (semesterId) {
        params.semester_id = semesterId;
      }

      const response = await api.get<Program[]>('/api/v1/academic/materials-course-view', { params });
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (materialId: number) => {
      const response = await api.delete(`/api/v1/documents/${materialId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setMaterialToDelete(null);
      toast.success('Material deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['materials-course-view'] });
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !selectedCourseId) throw new Error('No file or course selected');

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
      const uploadHeaders: HeadersInit = { ...headers };

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
        course_id: selectedCourseId,
      });

      if (!createDocResponse.success) {
        throw new Error(createDocResponse.error || 'Failed to save document metadata');
      }

      setUploadProgress(100);
      return createDocResponse.data;
    },
    onSuccess: () => {
      toast.success('Material uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['materials-course-view'] });
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

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('lecture_notes');
    setIsPublic(true);
    setUploadProgress(0);
    setSelectedCourseId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const openUploadDialog = (courseId: number) => {
    setSelectedCourseId(courseId);
    setIsUploadDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const cat = MATERIAL_CATEGORIES_WITH_ICONS.find(c => c.value === category);
    const Icon = cat?.icon || File;
    return <Icon className="h-4 w-4" />;
  };

  const toggleProgram = (programId: number) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const toggleCourse = (courseId: number) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const handleDownload = async (material: Material) => {
    try {
      const response = await api.get<any>(`/api/v1/documents/${material.id}/download-url`, {
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

  const handleView = async (material: Material) => {
    try {
      const response = await api.get<any>(`/api/v1/documents/${material.id}/download-url`, {
        params: { disposition: 'inline' },
      });

      if (!response.success) throw new Error(response.error);

      const { download_url } = response.data;
      window.open(download_url, '_blank');
    } catch (error) {
      toast.error('Failed to view file');
    }
  };

  const getFileIcon = (fileType: string | null | undefined) => {
    if (!fileType) return <File className="h-4 w-4 text-gray-600" />;
    const lowerType = fileType.toLowerCase();
    if (lowerType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (lowerType.includes('sheet') || lowerType.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    if (lowerType.includes('image')) return <FileImage className="h-4 w-4 text-blue-600" />;
    if (lowerType.includes('video')) return <FileVideo className="h-4 w-4 text-purple-600" />;
    if (lowerType.includes('presentation') || lowerType.includes('powerpoint')) return <FileImage className="h-4 w-4 text-orange-600" />;
    return <File className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No materials found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload materials to courses to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Materials
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Browse and manage learning materials organized by program and course
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {programs.map((program) => (
              <div key={program.id} className="border rounded-lg">
                {/* Program Row */}
                <div
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleProgram(program.id)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProgram(program.id);
                    }}
                  >
                    {expandedPrograms.has(program.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{program.name}</span>
                      <Badge variant="outline">{program.code}</Badge>
                      <Badge variant="secondary">{program.course_count} courses</Badge>
                    </div>
                    {program.description && (
                      <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
                    )}
                  </div>
                </div>

                {/* Courses */}
                {expandedPrograms.has(program.id) && (
                  <div className="ml-6 border-l-2 border-gray-200">
                    {program.courses.map((course) => (
                      <div key={course.id} className="border-t">
                        {/* Course Row */}
                        <div
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleCourse(course.id)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCourse(course.id);
                            }}
                          >
                            {expandedCourses.has(course.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{course.name}</span>
                              <Badge variant="outline">{course.code}</Badge>
                              <Badge variant="secondary">{course.credits} credits</Badge>
                              <Badge>{course.materials_count} materials</Badge>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUploadDialog(course.id);
                            }}
                            title="Upload Material"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Materials */}
                        {expandedCourses.has(course.id) && (
                          <div className="ml-6 border-l-2 border-gray-200">
                            {course.materials.length === 0 ? (
                              <div className="p-4 text-sm text-muted-foreground text-center">
                                No materials uploaded yet
                              </div>
                            ) : (
                              course.materials.map((material) => (
                                <div
                                  key={material.id}
                                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t"
                                >
                                  {getFileIcon(material.file_type)}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate">{material.title}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {MATERIAL_CATEGORIES[material.category] || material.category}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                      <span>{formatFileSize(material.file_size)}</span>
                                      <span>•</span>
                                      <span>Uploaded {formatDate(material.created_at)}</span>
                                      {material.uploader_name && (
                                        <>
                                          <span>•</span>
                                          <span>by {material.uploader_name}</span>
                                        </>
                                      )}
                                    </div>
                                    {material.description && (
                                      <p className="text-sm text-muted-foreground mt-1 truncate">
                                        {material.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleView(material)}
                                      className="h-8 w-8 p-0"
                                      title="View"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownload(material)}
                                      className="h-8 w-8 p-0"
                                      title="Download"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setMaterialToDelete(material)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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
              onClick={() => materialToDelete && deleteMutation.mutate(materialToDelete.id)}
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

      {/* Upload Dialog */}
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
                  {MATERIAL_CATEGORIES_WITH_ICONS.map((cat) => (
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
    </>
  );
}
