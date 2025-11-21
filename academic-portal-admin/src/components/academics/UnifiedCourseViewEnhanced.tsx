'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  MapPin,
  Clock,
  User,
  Loader2,
  Search,
  Plus,
  Eye,
  UserPlus,
  Filter,
  Download,
  MoreVertical,
  Expand,
  Minimize2,
  BookOpen,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateSectionDialog } from './CreateSectionDialog';
import { CreateEnrollmentDialog } from './CreateEnrollmentDialog';
import { DetailPanel } from './DetailPanel';

interface UnifiedCourseViewProps {
  semesterId: number | null;
}

type SelectedDetail =
  | {
      type: 'program' | 'course' | 'section';
      id: number;
    }
  | null;

type FilterType = 'all' | 'full' | 'open' | 'closed' | 'no-instructor';
type SortBy = 'name' | 'enrollment' | 'capacity';

export function UnifiedCourseViewEnhanced({ semesterId }: UnifiedCourseViewProps) {
  const router = useRouter();
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>();
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail>(null);
  
  // New state for enhancements
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fetch unified data
  const { data: unifiedData = [], isLoading, refetch } = useQuery({
    queryKey: ['unified-courses', semesterId],
    queryFn: async () => {
      const params: { semester_id?: number } = {};
      if (semesterId) {
        params.semester_id = semesterId;
      }
      
      const response = await api.get<any>('/api/v1/academic/unified-course-view', { params });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch unified course data');
      }
      return response.data;
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E = Expand All
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        expandAll();
      }
      // Ctrl/Cmd + Shift + E = Collapse All
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        collapseAll();
      }
      // Escape = Close detail panel
      if (e.key === 'Escape' && selectedDetail) {
        setSelectedDetail(null);
      }
      // Ctrl/Cmd + F = Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('academic-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDetail]);

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

  const expandAll = () => {
    const allPrograms = new Set(unifiedData.map((p: any) => p.id));
    const allCourses = new Set(
      unifiedData.flatMap((p: any) => p.courses?.map((c: any) => c.id) || [])
    );
    setExpandedPrograms(allPrograms);
    setExpandedCourses(allCourses);
    toast.success('Expanded all items');
  };

  const collapseAll = () => {
    setExpandedPrograms(new Set());
    setExpandedCourses(new Set());
    toast.success('Collapsed all items');
  };

  const toggleSectionSelection = (sectionId: number) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
    } else {
      newSelected.add(sectionId);
    }
    setSelectedSections(newSelected);
  };

  const handleBulkAction = (action: string) => {
    if (selectedSections.size === 0) {
      toast.error('Please select at least one section');
      return;
    }
    toast.info(`${action} ${selectedSections.size} sections...`);
    // Implement bulk actions here
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value && !recentSearches.includes(value)) {
      setRecentSearches(prev => [value, ...prev.slice(0, 4)]);
    }
  };

  const getStatusColor = (enrolledCount: number, maxStudents: number) => {
    const fillRate = maxStudents > 0 ? (enrolledCount / maxStudents) * 100 : 0;
    if (fillRate >= 100) return 'text-red-600 bg-red-50';
    if (fillRate >= 90) return 'text-orange-600 bg-orange-50';
    if (fillRate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = (enrolledCount: number, maxStudents: number) => {
    const fillRate = maxStudents > 0 ? (enrolledCount / maxStudents) * 100 : 0;
    if (fillRate >= 100) return <XCircle className="h-3 w-3" />;
    if (fillRate >= 90) return <AlertCircle className="h-3 w-3" />;
    return <CheckCircle2 className="h-3 w-3" />;
  };

  // Apply filters
  const filteredData = unifiedData
    .map((program: any) => ({
      ...program,
      courses: program.courses?.map((course: any) => ({
        ...course,
        sections: course.sections?.filter((section: any) => {
          // Apply filters
          if (filterType === 'full' && section.enrolled_count < section.max_students) return false;
          if (filterType === 'open' && section.enrolled_count >= section.max_students) return false;
          if (filterType === 'closed' && section.is_active) return false;
          if (filterType === 'no-instructor' && section.instructor_name) return false;
          
          // Apply search
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              program.name?.toLowerCase().includes(searchLower) ||
              program.code?.toLowerCase().includes(searchLower) ||
              course.name?.toLowerCase().includes(searchLower) ||
              course.code?.toLowerCase().includes(searchLower) ||
              section.section_code?.toLowerCase().includes(searchLower) ||
              section.instructor_name?.toLowerCase().includes(searchLower) ||
              section.room?.toLowerCase().includes(searchLower)
            );
          }
          return true;
        })
      }))
      // Keep courses even if they have no sections (to show newly created courses)
      .filter((course: any) => {
        // If filtering by section status, only show courses with sections
        if (filterType !== 'all') {
          return course.sections && course.sections.length > 0;
        }
        // Otherwise, show all courses
        return true;
      })
    }))
    .filter((program: any) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          program.name?.toLowerCase().includes(searchLower) ||
          program.code?.toLowerCase().includes(searchLower) ||
          (program.courses && program.courses.length > 0)
        );
      }
      return program.courses && program.courses.length > 0;
    });

  const exportToCSV = () => {
    toast.success('Exporting to CSV...');
    // Implement CSV export
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-4 ${selectedDetail ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
        {/* Main Content */}
        <Card className={selectedDetail ? 'lg:col-span-3' : 'col-span-1'}>
          <CardHeader className="space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Curriculum Management</CardTitle>
                {selectedSections.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedSections.size} selected
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/programs/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Program
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/courses/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Course
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={expandAll}>
                        <Expand className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Expand All</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={collapseAll}>
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Collapse All</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                {selectedSections.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm">
                        Bulk Actions
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Apply to {selectedSections.size} sections</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('Close')}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Sections
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('Open')}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Open Sections
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('Export')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setSelectedSections(new Set())}
                        className="text-red-600"
                      >
                        Clear Selection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="academic-search"
                  placeholder="Search programs, courses, sections, instructors... (Ctrl+F)"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="open">Open Only</SelectItem>
                  <SelectItem value="full">Full Only</SelectItem>
                  <SelectItem value="closed">Closed Only</SelectItem>
                  <SelectItem value="no-instructor">No Instructor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="enrollment">Sort by Enrollment</SelectItem>
                  <SelectItem value="capacity">Sort by Capacity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && searchTerm === '' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Recent:</span>
                {recentSearches.map((search, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm(search)}
                    className="h-6 text-xs"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="overflow-auto max-h-[calc(100vh-22rem)]">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm || filterType !== 'all' ? 'No results found' : 'No programs available'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Create your first program to get started'}
                </p>
                {!searchTerm && filterType === 'all' && (
                  <Button onClick={() => router.push('/programs/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Program
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedSections.size > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allSections = new Set(
                              filteredData.flatMap((p: any) =>
                                p.courses?.flatMap((c: any) =>
                                  c.sections?.map((s: any) => s.id) || []
                                ) || []
                              )
                            );
                            setSelectedSections(allSections);
                          } else {
                            setSelectedSections(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Programme / Course / Section</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((program: any) => {
                    const isExpanded = expandedPrograms.has(program.id);
                    
                    return (
                      <React.Fragment key={`program-${program.id}`}>
                        {/* Program Row */}
                        <TableRow
                          className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button, input')) return;
                            setSelectedDetail({ type: 'program', id: program.id });
                          }}
                        >
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProgram(program.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="font-semibold">{program.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {program.code}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            {program.coordinator_name && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{program.coordinator_name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {program.course_count || 0} courses
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={program.is_active ? 'default' : 'secondary'}>
                              {program.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Program Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/programs/${program.id}/edit`);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Program
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDetail({ type: 'program', id: program.id });
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/courses/new?program=${program.id}`);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Course
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {/* Courses */}
                        {isExpanded && program.courses?.map((course: any) => {
                          const isCourseExpanded = expandedCourses.has(course.id);
                          const courseEnrollRate = course.total_capacity > 0 
                            ? (course.total_enrolled / course.total_capacity) * 100 
                            : 0;
                          
                          return (
                            <React.Fragment key={`course-${course.id}`}>
                              <TableRow
                                className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest('button, input')) return;
                                  setSelectedDetail({ type: 'course', id: course.id });
                                }}
                              >
                                <TableCell></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 pl-8">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCourse(course.id);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      {isCourseExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <span className="font-medium">{course.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {course.code}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {course.credits} Credits
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {course.section_count || 0} sections
                                      </Badge>
                                      <Badge className={courseEnrollRate >= 100 ? 'bg-red-500' : ''}>
                                        {course.total_enrolled || 0}/{course.total_capacity || 0}
                                      </Badge>
                                    </div>
                                    {/* Capacity Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${
                                          courseEnrollRate >= 100
                                            ? 'bg-red-500'
                                            : courseEnrollRate >= 90
                                            ? 'bg-orange-500'
                                            : courseEnrollRate >= 70
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(courseEnrollRate, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={course.is_active ? 'default' : 'secondary'}>
                                    {course.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedCourseId(course.id);
                                              setSectionDialogOpen(true);
                                            }}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Add Section</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Course Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/courses/${course.id}/edit`);
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Course
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/courses/${course.id}/sections`);
                                          }}
                                        >
                                          <Users className="h-4 w-4 mr-2" />
                                          Manage Sections
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDetail({ type: 'course', id: course.id });
                                          }}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Sections */}
                              {isCourseExpanded && course.sections?.map((section: any) => {
                                const schedule = section.schedule
                                  ? typeof section.schedule === 'string'
                                    ? JSON.parse(section.schedule)
                                    : section.schedule
                                  : null;
                                const fillRate = section.max_students > 0
                                  ? (section.enrolled_count / section.max_students) * 100
                                  : 0;
                                const isSelected = selectedSections.has(section.id);

                                return (
                                  <TableRow
                                    key={`section-${section.id}`}
                                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                      isSelected ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('button, input')) return;
                                      setSelectedDetail({ type: 'section', id: section.id });
                                    }}
                                  >
                                    <TableCell>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSectionSelection(section.id)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2 pl-16">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium">
                                          Section {section.section_code}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        {section.semester_name || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {section.instructor_name ? (
                                        <div className="flex items-center gap-1 text-sm">
                                          <User className="h-3 w-3 text-gray-400" />
                                          {section.instructor_name}
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="text-xs text-red-600">
                                          No Instructor
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {schedule && Array.isArray(schedule) && schedule.length > 0 ? (
                                        <div className="space-y-1">
                                          {schedule.map((sch: any, idx: number) => (
                                            <div key={idx} className="text-xs flex items-center gap-1">
                                              <Clock className="h-3 w-3 text-gray-400" />
                                              {sch.day} {sch.time}
                                              {sch.room && (
                                                <>
                                                  <MapPin className="h-3 w-3 text-gray-400 ml-1" />
                                                  {sch.room}
                                                </>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            className={`${getStatusColor(
                                              section.enrolled_count,
                                              section.max_students
                                            )} flex items-center gap-1`}
                                          >
                                            {getStatusIcon(section.enrolled_count, section.max_students)}
                                            {section.enrolled_count || 0}/{section.max_students || 0}
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {fillRate.toFixed(0)}%
                                          </span>
                                        </div>
                                        {/* Mini Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-1">
                                          <div
                                            className={`h-1 rounded-full transition-all ${
                                              fillRate >= 100
                                                ? 'bg-red-500'
                                                : fillRate >= 90
                                                ? 'bg-orange-500'
                                                : fillRate >= 70
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={section.is_active ? 'default' : 'secondary'}>
                                        {section.is_active ? 'Open' : 'Closed'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedDetail({ type: 'section', id: section.id });
                                            }}
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Section
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedSectionId(section.id);
                                              setEnrollmentDialogOpen(true);
                                            }}
                                          >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Enroll Students
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Section
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedDetail && (
          <div className="lg:col-span-2">
            <DetailPanel
              type={selectedDetail.type}
              id={selectedDetail.id}
              onClose={() => setSelectedDetail(null)}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateSectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        courseId={selectedCourseId}
      />

      <CreateEnrollmentDialog
        open={enrollmentDialogOpen}
        onOpenChange={setEnrollmentDialogOpen}
        sectionId={selectedSectionId?.toString()}
      />

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full shadow-lg">
                ⌨️
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="w-64">
              <div className="space-y-2 text-xs">
                <div className="font-semibold">Keyboard Shortcuts</div>
                <div className="flex justify-between">
                  <span>Ctrl+E</span>
                  <span className="text-gray-500">Expand All</span>
                </div>
                <div className="flex justify-between">
                  <span>Ctrl+Shift+E</span>
                  <span className="text-gray-500">Collapse All</span>
                </div>
                <div className="flex justify-between">
                  <span>Ctrl+F</span>
                  <span className="text-gray-500">Focus Search</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span className="text-gray-500">Close Panel</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
