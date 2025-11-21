'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Loader2, BookOpen, Info, FileText, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CourseFormData {
  course_code: string;
  name: string;  // Changed from course_name to match backend
  description: string;
  credits: number;
  major_id: number | undefined;  // Changed from program_id to match backend
  prerequisites: string;
  syllabus: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<CourseFormData>({
    course_code: '',
    name: '',  // Changed from course_name
    description: '',
    credits: 3,
    major_id: undefined,  // Changed from program_id
    prerequisites: '',
    syllabus: '',
  });

  // Fetch programs
  const { data: programsData } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.getPrograms();
      if (response.success) {
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
      }
      return [];
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      // Send only fields that backend expects
      const payload = {
        course_code: data.course_code,
        name: data.name,
        description: data.description || undefined,
        credits: data.credits,
        major_id: data.major_id || undefined,
      };
      const response = await api.createCourse(payload);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create course');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate courses query to refetch data
      queryClient.invalidateQueries({ queryKey: ['courses'] }); // Matches all ['courses', ...] queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unified-courses'] }); // Matches all ['unified-courses', semesterId] queries
      queryClient.invalidateQueries({ queryKey: ['academic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['materials-course-view'] }); // Also update materials view
      
      toast.success('Course created successfully!');
      
      // Navigate to curriculum tab to see the new course
      router.push('/academics?tab=curriculum');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.course_code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate course code pattern
    const courseCodePattern = /^[A-Z]{3,4}\d{4}$/;
    if (!courseCodePattern.test(formData.course_code)) {
      toast.error('Course code must be 3-4 uppercase letters followed by 4 digits (e.g., CS1234, COMP1640)');
      return;
    }

    if (!formData.major_id) {
      toast.error('Please select a program');
      return;
    }

    if (formData.credits < 1 || formData.credits > 10) {
      toast.error('Credits must be between 1 and 10');
      return;
    }

    createCourseMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const programs = programsData || [];

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Management', href: '/academics' },
          { label: 'Courses', href: '/academics' },
          { label: 'Add New Course' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/academics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 1: Create Course</strong> - Fill in the course information. After creating the course, you&apos;ll need to create sections to assign instructors, set schedules, and enroll students. All fields marked with <span className="text-destructive">*</span> are required.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <Info className="w-4 h-4 mr-2" />
                Basic Information
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="w-4 h-4 mr-2" />
                Course Details
              </TabsTrigger>
              <TabsTrigger value="syllabus">
                <BookOpen className="w-4 h-4 mr-2" />
                Syllabus & Prerequisites
              </TabsTrigger>
            </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Enter the fundamental details of the course
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course_code">
                          Course Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="course_code"
                          placeholder="e.g., COMP1640 (3-4 letters + 4 digits)"
                          value={formData.course_code}
                          onChange={(e) => handleInputChange('course_code', e.target.value.toUpperCase())}
                          pattern="^[A-Z]{3,4}\d{4}$"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be 3-4 uppercase letters followed by 4 digits (e.g., CS1234, COMP1640)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="credits">
                          Credits <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="credits"
                          type="number"
                          min="1"
                          max="10"
                          value={formData.credits}
                          onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of credit hours (1-10)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Course Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Introduction to Programming"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="major_id">
                        Program <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.major_id?.toString()}
                        onValueChange={(value) => handleInputChange('major_id', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program: { id: number; code?: string; program_code?: string; name?: string; program_name?: string }) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.code || program.program_code} - {program.name || program.program_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The program this course belongs to
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Course Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>
                      Provide detailed information about the course content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Course Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Provide a comprehensive description of the course objectives, content, and learning outcomes..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Detailed description of what students will learn
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Syllabus & Prerequisites Tab */}
              <TabsContent value="syllabus" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prerequisites</CardTitle>
                    <CardDescription>
                      Specify any courses that students must complete before enrolling
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prerequisites">
                        Prerequisite Courses
                      </Label>
                      <Textarea
                        id="prerequisites"
                        placeholder="e.g., CS101, MATH201 (enter course codes separated by commas)"
                        value={formData.prerequisites}
                        onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        List prerequisite course codes separated by commas
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Course Syllabus</CardTitle>
                    <CardDescription>
                      Outline the course structure, topics, and schedule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="syllabus">
                        Syllabus Content
                      </Label>
                      <Textarea
                        id="syllabus"
                        placeholder="Week 1: Introduction to...&#10;Week 2: Fundamentals of...&#10;Week 3: Advanced concepts..."
                        value={formData.syllabus}
                        onChange={(e) => handleInputChange('syllabus', e.target.value)}
                        rows={12}
                        className="resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Detailed weekly breakdown of topics and activities
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/academics')}
                disabled={createCourseMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCourseMutation.isPending}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                {createCourseMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Course
                  </>
                )}
              </Button>
            </div>
        </form>
      </div>
    </AdminLayout>
  );
}
