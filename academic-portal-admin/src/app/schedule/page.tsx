'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/dialog'
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
import { Clock, MapPin, AlertTriangle, Plus, Edit, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, CalendarEvent, ScheduleConflict } from '@/lib/api'
import { toast } from 'sonner'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7 // Start from 7 AM
  return `${hour.toString().padStart(2, '0')}:00`
})

export default function SchedulePage() {
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [teacherFilter] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<CalendarEvent>>({})

  // Calculate week range
  const getWeekRange = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
      monday,
      sunday
    }
  }

  const weekRange = getWeekRange(new Date(currentDate))

  // Fetch calendar events
  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['calendar', weekRange.start, weekRange.end, campusFilter, teacherFilter],
    queryFn: async () => {
      return api.getCalendarView(
        weekRange.start,
        weekRange.end,
        campusFilter !== 'all' ? parseInt(campusFilter) : undefined,
        teacherFilter !== 'all' ? parseInt(teacherFilter) : undefined
      )
    },
  })

  const events = eventsResponse?.success ? eventsResponse.data || [] : []

  // Fetch campuses for filter
  const { data: campusesResponse } = useQuery({
    queryKey: ['campuses'],
    queryFn: () => api.getCampuses(),
  })

  const campuses = campusesResponse?.success ? campusesResponse.data || [] : []

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (scheduleId: number) => api.deleteSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Schedule deleted successfully')
      setSelectedEvent(null)
      setDeleteConfirmId(null)
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete schedule: ${error.message}`)
    },
  })

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEvent> }) =>
      api.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Schedule updated successfully')
      setIsEditMode(false)
      setSelectedEvent(null)
    },
    onError: (error: Error) => {
      toast.error(`Failed to update schedule: ${error.message}`)
    },
  })

  // Navigation
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get events for a specific day and time slot
  const getEventsForSlot = (dayIndex: number, timeSlot: string) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      const eventDay = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1 // Convert to 0=Monday
      const eventHour = eventDate.getHours()
      const slotHour = parseInt(timeSlot.split(':')[0])
      
      return eventDay === dayIndex && eventHour === slotHour
    })
  }

  // Format time range
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Get conflict badge
  const ConflictBadge = ({ conflicts }: { conflicts: ScheduleConflict[] }) => {
    if (conflicts.length === 0) return null
    
    const errorCount = conflicts.filter(c => c.severity === 'error').length
    const warningCount = conflicts.filter(c => c.severity === 'warning').length
    
    return (
      <div className="flex gap-1 mt-1">
        {errorCount > 0 && (
          <Badge variant="destructive" className="text-xs px-1 py-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {errorCount}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge className="text-xs px-1 py-0 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {warningCount}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Schedule Management"
        />

        <p className="text-muted-foreground mb-4">
          View and manage class schedules with conflict detection
        </p>

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium ml-2">
                  {weekRange.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekRange.sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={campusFilter} onValueChange={setCampusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Campuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campuses</SelectItem>
                    {Array.isArray(campuses) && campuses.map((campus: { id: number; name: string }) => (
                      <SelectItem key={campus.id} value={campus.id.toString()}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="w-20 p-2 text-left text-sm font-medium text-gray-600 sticky left-0 bg-gray-50">
                      Time
                    </th>
                    {DAYS.map((day, index) => (
                      <th key={index} className="p-2 text-center text-sm font-medium text-gray-600 min-w-[150px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        Loading schedule...
                      </td>
                    </tr>
                  ) : TIME_SLOTS.map((timeSlot) => (
                    <tr key={timeSlot} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm text-gray-600 font-medium sticky left-0 bg-white">
                        {timeSlot}
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const slotEvents = getEventsForSlot(dayIndex, timeSlot)
                        return (
                          <td key={dayIndex} className="p-1 align-top border-l">
                            <div className="space-y-1">
                              {slotEvents.map((event) => (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`w-full text-left p-2 rounded text-xs transition-all hover:shadow-md ${
                                    event.conflicts.length > 0
                                      ? 'bg-red-100 hover:bg-red-200 border-l-2 border-red-500'
                                      : 'bg-blue-100 hover:bg-blue-200 border-l-2 border-blue-500'
                                  }`}
                                >
                                  <div className="font-semibold truncate">{event.course_code}</div>
                                  <div className="text-gray-600 truncate">{event.section_code}</div>
                                  <div className="flex items-center gap-1 mt-1 text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                  </div>
                                  {event.room && (
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <MapPin className="w-3 h-3" />
                                      {event.room}
                                    </div>
                                  )}
                                  <ConflictBadge conflicts={event.conflicts} />
                                </button>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-l-2 border-blue-500 rounded"></div>
              <span>No Conflicts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-l-2 border-red-500 rounded"></div>
              <span>Has Conflicts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Error
              </Badge>
              <span>Must be resolved</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-yellow-100 text-yellow-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Warning
              </Badge>
              <span>Should be reviewed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.course_code} - {selectedEvent?.section_code}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.course_name}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {isEditMode ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <input
                        type="datetime-local"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={editData.start?.slice(0, 16) || ''}
                        onChange={(e) => setEditData({ ...editData, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <input
                        type="datetime-local"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={editData.end?.slice(0, 16) || ''}
                        onChange={(e) => setEditData({ ...editData, end: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Building</label>
                      <input
                        type="text"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={editData.building || ''}
                        onChange={(e) => setEditData({ ...editData, building: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Room</label>
                      <input
                        type="text"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={editData.room || ''}
                        onChange={(e) => setEditData({ ...editData, room: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false)
                        setEditData({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => updateMutation.mutate({ id: selectedEvent.id, data: editData })}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Time</div>
                      <div className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                      </div>
                    </div>
                    {selectedEvent.teacher_name && (
                      <div>
                        <div className="text-sm text-gray-600">Teacher</div>
                        <div className="font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {selectedEvent.teacher_name}
                        </div>
                      </div>
                    )}
                    {selectedEvent.room && (
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {selectedEvent.building && `${selectedEvent.building} - `}
                          {selectedEvent.room}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conflicts */}
                  {selectedEvent.conflicts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-800">
                          Scheduling Conflicts Detected
                        </span>
                      </div>
                      <div className="space-y-2">
                        {selectedEvent.conflicts.map((conflict, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded ${
                              conflict.severity === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Badge
                                variant={conflict.severity === 'error' ? 'destructive' : 'default'}
                                className="mt-0.5"
                              >
                                {conflict.conflict_type.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm">{conflict.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(true)
                        setEditData(selectedEvent)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirmId(selectedEvent.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule entry? This action cannot be undone.
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
