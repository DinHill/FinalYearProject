'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  GraduationCap,
  BookOpen,
  Users,
  User,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileText,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type DetailType = 'program' | 'course' | 'section';

interface DetailPanelProps {
  type: DetailType;
  id: number;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DetailPanel({ type, id, onClose, onEdit, onDelete }: DetailPanelProps) {
  // Fetch details based on type
  const { data, isLoading } = useQuery({
    queryKey: [type, id, 'details'],
    queryFn: async () => {
      let endpoint = '';
      if (type === 'program') endpoint = `/api/v1/academic/programs/${id}`;
      if (type === 'course') endpoint = `/api/v1/academic/courses/${id}`;
      if (type === 'section') endpoint = `/api/v1/academic/sections/${id}`;
      
      const response = await api.get<any>(endpoint);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  // Fetch enrolled students for sections
  const { data: enrolledStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['section', id, 'students'],
    queryFn: async () => {
      const response = await api.get<any>(`/api/v1/academic/sections/${id}/students`);
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
    enabled: type === 'section',
  });

  const renderProgramDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="h-6 w-6 text-brand-orange" />
          <h3 className="text-2xl font-bold">{data?.name}</h3>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {data?.code}
        </Badge>
      </div>

      <Separator />

      {/* Description */}
      {data?.description && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">DESCRIPTION</h4>
          <p className="text-sm text-gray-700">{data.description}</p>
        </div>
      )}

      {/* Coordinator */}
      {data?.coordinator_name && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">PROGRAM COORDINATOR</h4>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-10 w-10 p-2 bg-white rounded-full" />
            <div>
              <p className="font-medium">{data.coordinator_name}</p>
              {data.coordinator_email && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Mail className="h-3 w-3" />
                  {data.coordinator_email}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-3">STATISTICS</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data?.course_count || 0}</div>
            <div className="text-xs text-gray-600">Courses</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data?.student_count || 0}</div>
            <div className="text-xs text-gray-600">Students</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-2">STATUS</h4>
        <Badge variant={data?.is_active ? 'default' : 'secondary'} className="text-sm">
          {data?.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  );

  const renderCourseDetails = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6 text-brand-orange" />
          <h3 className="text-2xl font-bold">{data?.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {data?.course_code || data?.code}
          </Badge>
          <Badge variant="secondary">{data?.credits} Credits</Badge>
        </div>
      </div>

      <Separator />

      {/* Description */}
      {data?.description && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">COURSE DESCRIPTION</h4>
          <p className="text-sm text-gray-700">{data.description}</p>
        </div>
      )}

      {/* Program */}
      {data?.program_name && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">PROGRAM</h4>
          <Badge variant="outline">{data.program_name}</Badge>
        </div>
      )}

      {/* Level */}
      {data?.level && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">LEVEL</h4>
          <Badge variant="outline">Year {data.level}</Badge>
        </div>
      )}

      {/* Prerequisites */}
      {data?.prerequisites && Array.isArray(data.prerequisites) && data.prerequisites.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">PREREQUISITES</h4>
          <div className="flex flex-wrap gap-2">
            {data.prerequisites.map((prereq: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {prereq}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sections Statistics */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-3">SECTIONS & ENROLLMENT</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data?.section_count || 0}</div>
            <div className="text-xs text-gray-600">Sections</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data?.total_enrolled || 0}</div>
            <div className="text-xs text-gray-600">Enrolled</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{data?.total_capacity || 0}</div>
            <div className="text-xs text-gray-600">Capacity</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-2">STATUS</h4>
        <Badge variant={data?.is_active ? 'default' : 'secondary'} className="text-sm">
          {data?.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  );

  const renderSectionDetails = () => {
    const schedule = data?.schedule ? (typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule) : null;
    const fillRate = data?.max_students > 0 ? Math.round((data?.enrolled_count / data?.max_students) * 100) : 0;
    const isFull = data?.enrolled_count >= data?.max_students;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-brand-orange" />
            <h3 className="text-2xl font-bold">Section {data?.section_code}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{data?.course_code}</Badge>
            <Badge variant={isFull ? 'destructive' : 'default'}>
              {data?.enrolled_count || 0} / {data?.max_students || 0} Students
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Course Name */}
        {data?.course_name && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-2">COURSE</h4>
            <p className="font-medium">{data.course_name}</p>
          </div>
        )}

        {/* Instructor */}
        {data?.instructor_name && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-2">INSTRUCTOR</h4>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-10 w-10 p-2 bg-white rounded-full" />
              <div>
                <p className="font-medium">{data.instructor_name}</p>
                {data.instructor_email && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Mail className="h-3 w-3" />
                    {data.instructor_email}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Semester */}
        {data?.semester_name && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-2">SEMESTER</h4>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{data.semester_name}</span>
            </div>
          </div>
        )}

        {/* Schedule */}
        {(schedule || data?.room) && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">SCHEDULE & LOCATION</h4>
            <div className="space-y-2">
              {schedule && Array.isArray(schedule) && schedule.map((sch: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {sch.day} • {sch.time}
                  </div>
                  {sch.room && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {sch.room}
                    </div>
                  )}
                </div>
              ))}
              {!schedule && data?.room && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{data.room}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capacity & Fill Rate */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">ENROLLMENT STATUS</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fill Rate</span>
              <Badge variant={fillRate >= 90 ? 'destructive' : fillRate >= 70 ? 'default' : 'secondary'}>
                {fillRate}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  fillRate >= 90 ? 'bg-red-500' : fillRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${fillRate}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {isFull ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>Section is full</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{data?.max_students - data?.enrolled_count} spots available</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">STATUS</h4>
          <Badge variant={data?.is_active ? 'default' : 'secondary'} className="text-sm">
            {data?.is_active ? 'Open' : 'Closed'}
          </Badge>
        </div>

        {/* Enrolled Students List */}
        {isLoadingStudents && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">ENROLLED STUDENTS</h4>
            <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-orange"></div>
            </div>
          </div>
        )}

        {/* Enrolled Students List */}
        {!isLoadingStudents && enrolledStudents && enrolledStudents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">
              ENROLLED STUDENTS ({enrolledStudents.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {enrolledStudents.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm font-medium">
                      {enrollment.student?.full_name?.charAt(0) || enrollment.student?.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {enrollment.student?.full_name || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {enrollment.student?.student_id || enrollment.student?.email || 'No ID'}
                      </p>
                    </div>
                  </div>
                  {enrollment.status && (
                    <Badge variant="outline" className="text-xs">
                      {enrollment.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Students */}
        {enrolledStudents && enrolledStudents.length === 0 && !isLoadingStudents && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3">ENROLLED STUDENTS</h4>
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">No students enrolled yet</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <CardTitle className="text-lg font-semibold">
          {type === 'program' && 'Program Details'}
          {type === 'course' && 'Course Details'}
          {type === 'section' && 'Section Details'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
              </div>
            ) : (
              <>
                {type === 'program' && renderProgramDetails()}
                {type === 'course' && renderCourseDetails()}
                {type === 'section' && renderSectionDetails()}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Action Buttons */}
      {!isLoading && (
        <div className="border-t p-4 space-y-2">
          {onEdit && (
            <Button variant="outline" className="w-full justify-start" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit {type === 'program' ? 'Program' : type === 'course' ? 'Course' : 'Section'}
            </Button>
          )}
          {type === 'section' && (
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="h-4 w-4 mr-2" />
              Enroll Students
            </Button>
          )}
          {type === 'section' && (
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              View Attendance
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {type === 'program' ? 'Program' : type === 'course' ? 'Course' : 'Section'}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
