"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, Upload, FileText } from "lucide-react";

interface UploadMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadMaterialDialog({
  open,
  onOpenChange,
}: UploadMaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<string>("lecture_note");
  const [file, setFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState<string>("");

  // Fetch courses for dropdown
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const result = await api.get('/api/v1/academics/courses', { params: { page: 1, page_size: 100 } });
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch courses');
    },
    enabled: open,
  });

  const courses = coursesData?.items || [];

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { file: File; title: string; documentType: string; courseId?: number }) => {
      return await api.uploadDocument(
        data.file, 
        data.title, 
        undefined, 
        data.documentType,
        data.courseId
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      handleClose();
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (selectedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 50MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, Word, PowerPoint, Excel, text, and image files are allowed",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      // Auto-populate title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a document title",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Validation Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (title.length > 200) {
      toast({
        title: "Validation Error",
        description: "Title must be less than 200 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate course selection for course materials
    if (documentType === "course_materials" && !courseId) {
      toast({
        title: "Validation Error",
        description: "Please select a course for course materials",
        variant: "destructive",
      });
      return;
    }

    // Create FormData for file upload
    uploadDocumentMutation.mutate({
      file,
      title: title.trim(),
      documentType,
      courseId: courseId ? parseInt(courseId) : undefined,
    });
  };

  const handleClose = () => {
    setTitle("");
    setDocumentType("lecture_note");
    setFile(null);
    setCourseId("");
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Course Material</DialogTitle>
          <DialogDescription>
            Upload a new document to the course materials library. Supported formats:
            PDF, Word, PowerPoint, Excel, Text, and Images (max 50MB).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="upload-title">
              Document Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="upload-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 1 Lecture Notes - Introduction"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 characters
            </p>
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="upload-type">
              Document Type <span className="text-red-500">*</span>
            </Label>
            <Select value={documentType} onValueChange={(value) => {
              setDocumentType(value);
              // Reset course selection when changing away from course_materials
              if (value !== "course_materials") {
                setCourseId("");
              }
            }}>
              <SelectTrigger id="upload-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course_materials">Course Materials</SelectItem>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="lecture_note">Lecture Notes</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="exam">Exam Material</SelectItem>
                <SelectItem value="reference">Reference Material</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the type of document you&apos;re uploading
            </p>
          </div>

          {/* Course Selection - Only show for course_materials */}
          {documentType === "course_materials" && (
            <div className="space-y-2">
              <Label htmlFor="upload-course">
                Course <span className="text-red-500">*</span>
              </Label>
              <Select value={courseId} onValueChange={setCourseId} disabled={isLoadingCourses}>
                <SelectTrigger id="upload-course">
                  <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.course_code} - {course.name}
                    </SelectItem>
                  ))}
                  {courses.length === 0 && !isLoadingCourses && (
                    <SelectItem value="none" disabled>
                      No courses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the course this material belongs to
              </p>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="upload-file">
              File <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
              <Input
                id="upload-file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                required
              />
              <label
                htmlFor="upload-file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {file ? (
                  <>
                    <FileText className="w-12 h-12 text-primary" />
                    <div className="text-center">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                      >
                        Remove File
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">Click to upload</p>
                      <p className="text-sm text-muted-foreground">
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, Word, PowerPoint, Excel, Text, Images (max 50MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploadDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadDocumentMutation.isPending || !file}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              {uploadDocumentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
