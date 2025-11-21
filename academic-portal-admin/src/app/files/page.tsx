'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File,
  Search,
  Filter,
  Clock,
  User,
  HardDrive,
  Eye
} from 'lucide-react'
import { api, FileMetadata } from '@/lib/api'
import { toast } from 'sonner'
import { SmartPagination } from '@/components/ui/smart-pagination'

const FILE_CATEGORIES = [
  'academic',
  'administrative',
  'financial',
  'student_records',
  'course_materials',
  'certificates',
  'other'
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

export default function FilesPage() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState('academic')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadIsPublic, setUploadIsPublic] = useState(false)

  const pageSize = 20

  // Fetch file library
  const { data: filesResponse, isLoading } = useQuery({
    queryKey: ['files', currentPage, categoryFilter, searchQuery],
    queryFn: () =>
      api.getFileLibrary(
        currentPage,
        pageSize,
        categoryFilter !== 'all' ? categoryFilter : undefined,
        searchQuery || undefined
      ),
  })

  const files = filesResponse?.success ? filesResponse.data?.files || [] : []
  const total = filesResponse?.success ? filesResponse.data?.total || 0 : 0
  const totalPages = Math.ceil(total / pageSize)

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['file-categories'],
    queryFn: () => api.getFileCategories(),
  })

  const categories = categoriesResponse?.success ? categoriesResponse.data?.categories || [] : []

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file selected')
      return api.uploadFile(
        uploadFile,
        uploadCategory,
        uploadDescription || undefined,
        uploadIsPublic
      )
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['files'] })
        queryClient.invalidateQueries({ queryKey: ['file-categories'] })
        toast.success(response.data?.message || 'File uploaded successfully')
        setShowUploadDialog(false)
        resetUploadForm()
      }
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => api.deleteFile(fileId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['file-categories'] })
      toast.success('File deleted successfully')
      setDeleteConfirmId(null)
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })

  // Download file
  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const blob = await api.downloadFile(fileId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Download started')
    } catch {
      toast.error('Download failed')
    }
  }

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadCategory('academic')
    setUploadDescription('')
    setUploadIsPublic(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader title="File Library" />

        <p className="text-muted-foreground">
          Upload, manage, and organize documents with version control
        </p>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <File className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Filter className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(files.reduce((sum, f) => sum + f.file_size, 0))}
                  </p>
                </div>
                <HardDrive className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">
                    {files.reduce((sum, f) => sum + f.download_count, 0)}
                  </p>
                </div>
                <Download className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Loading files...
                    </TableCell>
                  </TableRow>
                ) : files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No files found
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{getFileIcon(file.mime_type)}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="truncate max-w-[300px]">{file.original_filename}</div>
                          {file.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {file.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {file.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell className="text-sm">{file.uploaded_by_name}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{file.download_count}</TableCell>
                      <TableCell>
                        <Badge variant={file.is_public ? 'default' : 'secondary'}>
                          {file.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(file)
                              setShowInfoDialog(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file.id, file.original_filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(file.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={pageSize}
                  itemName="files"
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a new file to the library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>

            <div>
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of the file..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={uploadIsPublic}
                onCheckedChange={(checked) => setUploadIsPublic(!!checked)}
              />
              <Label>Make file publicly accessible</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!uploadFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Information</DialogTitle>
          </DialogHeader>

          {selectedFile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">File Name</div>
                  <div className="font-medium">{selectedFile.original_filename}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-medium capitalize">{selectedFile.category.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">File Size</div>
                  <div className="font-medium">{formatFileSize(selectedFile.file_size)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="font-medium">{selectedFile.mime_type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Uploaded By</div>
                  <div className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedFile.uploaded_by_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Upload Date</div>
                  <div className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedFile.uploaded_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Downloads</div>
                  <div className="font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    {selectedFile.download_count} times
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Version</div>
                  <div className="font-medium">v{selectedFile.version}</div>
                </div>
              </div>

              {selectedFile.description && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Description</div>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {selectedFile.description}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedFile.id, selectedFile.original_filename)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteConfirmId(selectedFile.id)
                    setShowInfoDialog(false)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
