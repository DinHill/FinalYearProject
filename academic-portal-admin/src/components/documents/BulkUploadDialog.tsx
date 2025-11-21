'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileWithProgress {
  file: File;
  title: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [documentType, setDocumentType] = useState('lecture_note');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndAddFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithProgress[] = [];
    
    fileArray.forEach(file => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Please upload PDF, Word, Excel, PowerPoint, text, or image files.`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File too large. Maximum size is 50MB.`);
        return;
      }

      // Check for duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        toast.error(`${file.name}: File already added.`);
        return;
      }

      validFiles.push({
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        status: 'pending',
        progress: 0,
      });
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added successfully`);
    }
  }, [files]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      validateAndAddFiles(droppedFiles);
    }
  }, [validateAndAddFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      validateAndAddFiles(selectedFiles);
    }
    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileWithProgress: FileWithProgress, index: number): Promise<boolean> => {
    // Update status to uploading
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    try {
      const result = await api.uploadDocument(
        fileWithProgress.file,
        fileWithProgress.title,
        undefined,
        documentType
      );

      if (result.success) {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'success', progress: 100 } : f
        ));
        return true;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', progress: 0, error: errorMessage } : f
      ));
      return false;
    }
  };

  const handleBulkUpload = async () => {
    if (files.length === 0) {
      toast.error('Please add files to upload');
      return;
    }

    setIsUploading(true);
    
    let successCount = 0;
    let errorCount = 0;

    // Upload files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.status === 'pending' || file.status === 'error') {
        const success = await uploadFile(file, i);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } else if (file.status === 'success') {
        successCount++;
      }
    }

    setIsUploading(false);

    // Invalidate documents query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['documents'] });

    // Show summary toast
    if (errorCount === 0) {
      toast.success(`All ${successCount} files uploaded successfully!`);
      // Close dialog after 1 second
      setTimeout(() => {
        onOpenChange(false);
        setFiles([]);
        setDocumentType('lecture_note');
      }, 1000);
    } else if (successCount > 0) {
      toast.warning(`${successCount} files uploaded, ${errorCount} failed. You can retry failed uploads.`);
    } else {
      toast.error(`All ${errorCount} uploads failed. Please check the errors and try again.`);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setFiles([]);
      setDocumentType('lecture_note');
    }
  };

  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalProgress = files.length > 0 
    ? Math.round((successCount / files.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Bulk Upload Documents
          </DialogTitle>
          <DialogDescription>
            Upload multiple files at once. Maximum file size: 50MB per file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type for All Files</Label>
            <Select
              value={documentType}
              onValueChange={setDocumentType}
              disabled={isUploading}
            >
              <SelectTrigger id="documentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="lecture_note">Lecture Note</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="reference">Reference Material</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "opacity-50 pointer-events-none"
            )}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-foreground mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports: PDF, Word, Excel, PowerPoint, Text, Images (max 50MB each)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
              onChange={handleFileSelect}
              className="hidden"
              id="bulk-file-input"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('bulk-file-input')?.click()}
              disabled={isUploading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Files ({files.length})</Label>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="h-8 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20"
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {fileItem.status === 'pending' && (
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      )}
                      {fileItem.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {fileItem.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileItem.error && (
                        <p className="text-xs text-destructive mt-1">{fileItem.error}</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    {!isUploading && fileItem.status !== 'success' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {successCount} completed, {uploadingCount} uploading, {errorCount} failed
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Cancel'}
          </Button>
          <Button
            onClick={handleBulkUpload}
            disabled={files.length === 0 || isUploading || successCount === files.length}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading ({successCount}/{files.length})
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
