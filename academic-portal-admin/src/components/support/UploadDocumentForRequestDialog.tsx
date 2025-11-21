'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type DocumentRequest } from '@/lib/api';
import { Loader2, Upload, FileText } from 'lucide-react';

interface UploadDocumentForRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DocumentRequest | null;
}

export function UploadDocumentForRequestDialog({
  open,
  onOpenChange,
  request,
}: UploadDocumentForRequestDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFile(null);
      setTitle('');
    }
    onOpenChange(newOpen);
  };

  // Auto-generate title when dialog opens with a request
  useState(() => {
    if (request && open) {
      const docType = request.document_type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setTitle(`${docType} - Student ${request.student_id}`);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !request) throw new Error('No file or request selected');
      if (!title.trim()) throw new Error('Please provide a document title');

      // Step 1: Upload the document
      const uploadResult = await api.uploadDocument(
        file,
        title.trim(),
        `Document for request #${request.id}`,
        request.document_type
      );

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload document');
      }

      const documentId = uploadResult.data.id;

      // Step 2: Update the document request with the uploaded document ID
      const updateResult = await api.updateDocumentRequest(request.id, {
        document_id: documentId,
        status: 'ready', // Mark as ready when document is uploaded
        admin_notes: `Document uploaded: ${title}`,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to link document to request');
      }

      return updateResult.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded and request updated successfully');
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      handleOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload the requested document for request #{request.id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-sm font-medium">Request Details</p>
            <p className="text-xs text-muted-foreground">
              Student ID: {request.student_id}
            </p>
            <p className="text-xs text-muted-foreground">
              Type: {request.document_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </p>
          </div>

          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              required
              maxLength={200}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Document File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
                className="cursor-pointer"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (max 50MB)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !file || !title.trim()}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Mark Ready
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
