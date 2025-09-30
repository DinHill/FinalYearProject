import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, GraduationCap, Calendar, Users, Clock, Star } from 'lucide-react';

export default function AcademicsPage() {
  const mockCourses = [
    {
      id: 1,
      title: 'Introduction to Computer Science',
      code: 'CS101',
      instructor: 'Dr. Jane Smith',
      students: 45,
      duration: '16 weeks',
      status: 'Active',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Advanced Machine Learning',
      code: 'CS401',
      instructor: 'Prof. Michael Johnson',
      students: 28,
      duration: '12 weeks',
      status: 'Active',
      rating: 4.9
    },
    {
      id: 3,
      title: 'Digital Marketing Strategy',
      code: 'MKT301',
      instructor: 'Dr. Sarah Wilson',
      students: 35,
      duration: '14 weeks',
      status: 'Upcoming',
      rating: 4.7
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">64</p>
                  <p className="text-xs text-green-600">+3 this semester</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Students</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-green-600">+12% increase</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faculty</p>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-xs text-blue-600">+2 new hires</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-xs text-green-600">+0.2 this term</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Management */}
        <Card>
          <CardHeader>
            <CardTitle>Course Management</CardTitle>
            <CardDescription>
              Manage active courses, schedules, and enrollment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.code} • Instructor: {course.instructor}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {course.students} students
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(course.status)}>
                      {course.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Course Catalog</h3>
              <p className="text-sm text-muted-foreground">Browse and manage course offerings</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Academic Calendar</h3>
              <p className="text-sm text-muted-foreground">View semester dates and deadlines</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <GraduationCap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Programs</h3>
              <p className="text-sm text-muted-foreground">Manage degree programs and requirements</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}