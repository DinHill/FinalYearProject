'use client'

import { useQuery } from '@tanstack/react-query'
import type { UpcomingClass, GradeSummary } from '@/lib/api'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, TrendingUp, Clock, Calendar, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function StudentDashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const response = await api.getStudentDashboard()
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })

  // Fetch upcoming classes
  const { data: upcomingClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['upcoming-classes'],
    queryFn: async () => {
      const response = await api.getUpcomingClasses(7)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })

  // Fetch recent grades
  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['my-grades'],
    queryFn: async () => {
      const response = await api.getMyGrades()
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your academic progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_courses || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.in_progress_courses || 0} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.completed_courses || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.current_gpa ? stats.current_gpa.toFixed(2) : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Out of 4.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_credits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total credits
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
            <CardDescription>Your schedule for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : upcomingClasses && upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.slice(0, 5).map((classItem) => {
                  const nextDate = new Date(classItem.next_occurrence)
                  return (
                    <div
                      key={`${classItem.enrollment_id}-${classItem.schedule_id}`}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="text-sm font-medium">
                          {dayNames[classItem.day_of_week].slice(0, 3)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {classItem.course_code} - {classItem.course_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {classItem.start_time} - {classItem.end_time}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {classItem.room_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {classItem.room_name}
                              {classItem.building_name && ` (${classItem.building_name})`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {upcomingClasses.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/student/schedule">View Full Schedule</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No upcoming classes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Grades
            </CardTitle>
            <CardDescription>Your latest grade updates</CardDescription>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : grades && grades.length > 0 ? (
              <div className="space-y-3">
                {grades
                  .filter(g => g.grade_score !== null && g.grade_score !== undefined)
                  .slice(0, 5)
                  .map((grade) => {
                    const percentage = grade.max_score 
                      ? ((grade.grade_score! / grade.max_score) * 100).toFixed(1)
                      : null
                    
                    return (
                      <div
                        key={grade.grade_id || `${grade.course_id}-${grade.section_name}`}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {grade.course_code} - {grade.course_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {grade.section_code}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {grade.grade_letter && (
                            <div className="text-lg font-bold">{grade.grade_letter}</div>
                          )}
                          {percentage && (
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                {grades.filter(g => g.grade_score !== null).length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/student/grades">View All Grades</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No grades available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently accessed features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/student/courses">
                <BookOpen className="h-6 w-6" />
                <span>My Courses</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/student/grades">
                <TrendingUp className="h-6 w-6" />
                <span>View Grades</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/student/schedule">
                <Calendar className="h-6 w-6" />
                <span>Full Schedule</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/files">
                <Clock className="h-6 w-6" />
                <span>Course Materials</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
