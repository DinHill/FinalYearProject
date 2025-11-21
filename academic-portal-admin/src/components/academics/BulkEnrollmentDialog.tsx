'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Section } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Download, Users, Loader2, CheckCircle, AlertCircle, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedStudent {
  student_id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

export function BulkEnrollmentDialog({ open, onOpenChange }: BulkEnrollmentDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const result = await api.getCourses(1, 100);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch courses');
    },
    enabled: open,
  });

  const courses = coursesData?.items || [];

  // Fetch sections for selected course
  const { data: sectionsData, isLoading: isLoadingSections } = useQuery({
    queryKey: ['sections', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return { items: [] };
      const result = await api.getSections(parseInt(selectedCourseId));
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch sections');
    },
    enabled: open && !!selectedCourseId,
  });

  const sections = sectionsData?.items || [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = (text: string): string[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const studentIds: string[] = [];

    if (lines.length === 0) {
      return [];
    }

    // Check if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('student') || firstLine.includes('id');
    const startIndex = hasHeader ? 1 : 0;

    // Parse CSV (handle both comma and semicolon)
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma or semicolon
      const values = line.split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      
      if (hasHeader && i === 1) {
        // If header exists, try to find student_id column
        const headers = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
        const idIndex = headers.findIndex(h => 
          h.includes('student') || h.includes('id')
        );
        if (idIndex >= 0 && values[idIndex]) {
          studentIds.push(values[idIndex]);
        }
      } else {
        // No header or subsequent rows - take first column
        if (values[0]) {
          studentIds.push(values[0]);
        }
      }
    }

    return studentIds;
  };

  const processFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const studentIds = parseCSV(text);

      if (studentIds.length === 0) {
        toast.error('No valid student IDs found in CSV file');
        return;
      }

      // Validate student IDs (should be numbers)
      const validStudents: ParsedStudent[] = [];
      const invalidIds: string[] = [];

      studentIds.forEach(id => {
        if (/^\d+$/.test(id)) {
          validStudents.push({
            student_id: id,
            status: 'pending',
          });
        } else {
          invalidIds.push(id);
        }
      });

      if (invalidIds.length > 0) {
        toast.warning(`${invalidIds.length} invalid student ID(s) skipped: ${invalidIds.slice(0, 3).join(', ')}${invalidIds.length > 3 ? '...' : ''}`);
      }

      if (validStudents.length === 0) {
        toast.error('No valid student IDs found. Student IDs must be numbers.');
        return;
      }

      setStudents(validStudents);
      toast.success(`${validStudents.length} student(s) loaded from CSV`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('CSV parse error:', error);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setCsvFile(file);
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setCsvFile(file);
      processFile(file);
    }
    e.target.value = '';
  };

  const enrollStudent = async (studentId: string, index: number): Promise<boolean> => {
    setStudents(prev => prev.map((s, i) => 
      i === index ? { ...s, status: 'processing' } : s
    ));

    try {
      const result = await api.createEnrollment({
        student_id: parseInt(studentId),
        section_id: parseInt(selectedSectionId),
        status: 'active',
      });

      if (result.success) {
        setStudents(prev => prev.map((s, i) => 
          i === index ? { ...s, status: 'success' } : s
        ));
        return true;
      } else {
        throw new Error(result.error || 'Enrollment failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enrollment failed';
      setStudents(prev => prev.map((s, i) => 
        i === index ? { ...s, status: 'error', error: errorMessage } : s
      ));
      return false;
    }
  };

  const handleBulkEnroll = async () => {
    if (!selectedCourseId || !selectedSectionId) {
      toast.error('Please select a course and section');
      return;
    }

    if (students.length === 0) {
      toast.error('Please upload a CSV file with student IDs');
      return;
    }

    setIsProcessing(true);
    
    let successCount = 0;
    let errorCount = 0;

    // Enroll students sequentially
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      if (student.status === 'pending' || student.status === 'error') {
        const success = await enrollStudent(student.student_id, i);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } else if (student.status === 'success') {
        successCount++;
      }
    }

    setIsProcessing(false);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['sections', selectedCourseId] });

    // Show summary
    if (errorCount === 0) {
      toast.success(`All ${successCount} student(s) enrolled successfully!`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else if (successCount > 0) {
      toast.warning(`${successCount} enrolled, ${errorCount} failed. Review errors below.`);
    } else {
      toast.error(`All ${errorCount} enrollments failed. Please check the errors.`);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'student_id\n1001\n1002\n1003';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_enrollment_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setSelectedCourseId('');
      setSelectedSectionId('');
      setCsvFile(null);
      setStudents([]);
    }
  };

  const pendingCount = students.filter(s => s.status === 'pending').length;
  const processingCount = students.filter(s => s.status === 'processing').length;
  const successCount = students.filter(s => s.status === 'success').length;
  const errorCount = students.filter(s => s.status === 'error').length;
  const totalProgress = students.length > 0 
    ? Math.round((successCount / students.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Bulk Student Enrollment
          </DialogTitle>
          <DialogDescription>
            Enroll multiple students to a course section using a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Instructions */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Upload a CSV file with student IDs. The file should have a column named &quot;student_id&quot; or just a list of student IDs (one per line).
              <Button
                variant="link"
                size="sm"
                onClick={downloadTemplate}
                className="h-auto p-0 ml-2"
              >
                <Download className="w-3 h-3 mr-1" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* Course Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">
                Course <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCourseId}
                onValueChange={(value) => {
                  setSelectedCourseId(value);
                  setSelectedSectionId('');
                }}
                disabled={isProcessing || isLoadingCourses}
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: { id: number; course_code: string; course_name: string }) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">
                Section <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={isProcessing || !selectedCourseId || isLoadingSections}
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No sections available
                    </div>
                  ) : (
                    sections.map((section: Section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.section_number} ({section.schedule || 'No schedule'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isProcessing && "opacity-50 pointer-events-none"
            )}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-foreground mb-2">
              Drag and drop CSV file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              CSV file with student IDs
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-file-input"
              disabled={isProcessing}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('csv-file-input')?.click()}
              disabled={isProcessing}
            >
              <FileText className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            {csvFile && (
              <p className="text-sm text-muted-foreground mt-3">
                Selected: <span className="font-medium">{csvFile.name}</span>
              </p>
            )}
          </div>

          {/* Students List */}
          {students.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Students ({students.length})</Label>
                <div className="text-xs text-muted-foreground">
                  {successCount} success • {errorCount} failed • {pendingCount} pending
                </div>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 border rounded-lg p-3">
                {students.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-muted/20 rounded text-sm"
                  >
                    {student.status === 'pending' && (
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {student.status === 'processing' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                    )}
                    {student.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                    {student.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="flex-1 min-w-0">
                      Student ID: {student.student_id}
                      {student.error && (
                        <span className="text-xs text-destructive ml-2">
                          - {student.error}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Enrollment Progress</span>
                <span className="font-medium">{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Processing {processingCount > 0 ? `(${processingCount} in progress)` : '...'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Cancel'}
          </Button>
          <Button
            onClick={handleBulkEnroll}
            disabled={
              !selectedCourseId ||
              !selectedSectionId ||
              students.length === 0 ||
              isProcessing ||
              successCount === students.length
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enrolling ({successCount}/{students.length})
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Enroll {students.length} Student{students.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
