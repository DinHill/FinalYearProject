"use client";

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Clock, Calendar } from 'lucide-react';

interface CreateSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: number;
}

// Define time slots
const TIME_SLOTS = [
  { id: 1, label: 'Slot 1', time: '7:30-9:00' },
  { id: 2, label: 'Slot 2', time: '9:10-10:40' },
  { id: 3, label: 'Slot 3', time: '10:50-12:20' },
  { id: 4, label: 'Slot 4', time: '12:50-14:20' },
  { id: 5, label: 'Slot 5', time: '14:30-16:00' },
  { id: 6, label: 'Slot 6', time: '16:10-17:40' },
  { id: 7, label: 'Slot 7', time: '17:50-19:20' },
  { id: 8, label: 'Slot 8', time: '19:30-21:00' },
];

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export function CreateSectionDialog({ open, onOpenChange, courseId }: CreateSectionDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    course_id: courseId || 0,
    section_code: '',
    semester_id: 0,
    instructor_id: 0,
    max_students: 30,
    schedule: '',
    room: ''
  });

  // Schedule selection state
  const [selectedSlotStart, setSelectedSlotStart] = useState<string>('');
  const [selectedSlotEnd, setSelectedSlotEnd] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Update course_id when courseId prop changes
  React.useEffect(() => {
    if (courseId) {
      setFormData(prev => ({ ...prev, course_id: courseId }));
    }
  }, [courseId]);

  // Fetch courses if courseId not provided
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.getCourses(1, 100);
      if (response.success) {
        return response.data?.items || [];
      }
      return [];
    },
    enabled: !courseId, // Only fetch if courseId not provided
  });

  // Fetch semesters
  const { data: semestersData } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const response = await api.getSemesters();
      if (response.success) {
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
      }
      return [];
    },
  });

  // Fetch teachers/instructors
  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.getUsers(1, 100, 'teacher');
      if (response.success) {
        return response.data?.items || [];
      }
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Creating section with data:', data);
      const response = await api.createSection(data);
      console.log('Section creation response:', response);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Section created successfully');
      // Invalidate all relevant queries - use prefix matching to invalidate all variations
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['course-sections'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] }); // Matches ['courses', semesterId]
      queryClient.invalidateQueries({ queryKey: ['unified-courses'] }); // Matches ['unified-courses', semesterId]
      queryClient.invalidateQueries({ queryKey: ['academic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create section');
    }
  });

  const resetForm = () => {
    setFormData({
      course_id: courseId || 0,
      section_code: '',
      semester_id: 0,
      instructor_id: 0,
      max_students: 30,
      schedule: '',
      room: ''
    });
    setSelectedSlotStart('');
    setSelectedSlotEnd('');
    setSelectedDays([]);
  };

  // Update schedule when slots or days change
  React.useEffect(() => {
    if (selectedSlotStart && selectedSlotEnd && selectedDays.length > 0) {
      const slotStart = TIME_SLOTS.find(s => s.id.toString() === selectedSlotStart);
      const slotEnd = TIME_SLOTS.find(s => s.id.toString() === selectedSlotEnd);
      const daysStr = selectedDays.map(day => 
        DAYS_OF_WEEK.find(d => d.id === day)?.label.substring(0, 3)
      ).join('/');
      
      if (slotStart && slotEnd) {
        const startTime = slotStart.time.split('-')[0];
        const endTime = slotEnd.time.split('-')[1];
        setFormData(prev => ({
          ...prev,
          schedule: `${daysStr} ${startTime}-${endTime}`
        }));
      }
    } else if (selectedSlotStart || selectedSlotEnd || selectedDays.length > 0) {
      // Partial selection, keep manual schedule
    } else {
      setFormData(prev => ({ ...prev, schedule: '' }));
    }
  }, [selectedSlotStart, selectedSlotEnd, selectedDays]);

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course_id || formData.course_id === 0) {
      toast.error('Please select a course');
      return;
    }

    if (!formData.section_code) {
      toast.error('Please enter a section code');
      return;
    }

    if (!formData.semester_id || formData.semester_id === 0) {
      toast.error('Please select a semester');
      return;
    }

    if (!formData.instructor_id || formData.instructor_id === 0) {
      toast.error('Please select an instructor');
      return;
    }

    if (formData.max_students < 1) {
      toast.error('Capacity must be at least 1');
      return;
    }

    createMutation.mutate(formData);
  };

  const courses = coursesData || [];
  const semesters = semestersData || [];
  const teachers = teachersData || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader className="space-y-1 pb-4">
          <DialogTitle className="text-xl">Create New Section</DialogTitle>
          <DialogDescription className="text-sm">
            Set up a new section with schedule, instructor, and capacity information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-2">
          {/* Basic Info Section - 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            {!courseId && (
              <div className="col-span-2">
                <Label htmlFor="course_id" className="text-sm">Course *</Label>
                <Select
                  value={formData.course_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, course_id: parseInt(value) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a course" />
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
            )}

            <div>
              <Label htmlFor="section_code" className="text-sm">Section Code *</Label>
              <Input
                id="section_code"
                placeholder="e.g., 01, 02, A1"
                value={formData.section_code}
                onChange={(e) => setFormData({ ...formData, section_code: e.target.value.toUpperCase() })}
                required
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="max_students" className="text-sm">Max Students *</Label>
              <Input
                id="max_students"
                type="number"
                min="1"
                max="100"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                required
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="semester_id" className="text-sm">Semester *</Label>
              <Select
                value={formData.semester_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, semester_id: parseInt(value) })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester: { id: number; name: string; code: string; is_current: boolean }) => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      {semester.name} {semester.is_current && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="instructor_id" className="text-sm">Instructor *</Label>
              <Select
                value={formData.instructor_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, instructor_id: parseInt(value) })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher: { id: number; full_name: string; email: string }) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule Selection - Compact Layout */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-orange" />
              <Label className="text-sm font-semibold">Schedule</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Time Slot Selection - From and To */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3" />
                  Time Slots
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedSlotStart}
                    onValueChange={setSelectedSlotStart}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">to</span>
                  <Select
                    value={selectedSlotEnd}
                    onValueChange={setSelectedSlotEnd}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSlotStart && selectedSlotEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {TIME_SLOTS.find(s => s.id.toString() === selectedSlotStart)?.time.split('-')[0]} - {TIME_SLOTS.find(s => s.id.toString() === selectedSlotEnd)?.time.split('-')[1]}
                  </p>
                )}
              </div>

              {/* Days Selection */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3 w-3" />
                  Days of Week
                </Label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day.id}
                      className="flex items-center space-x-1.5"
                    >
                      <Checkbox
                        id={day.id}
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <label
                        htmlFor={day.id}
                        className="text-xs font-medium leading-none cursor-pointer"
                      >
                        {day.label.substring(0, 3)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Schedule Preview */}
            {formData.schedule && (
              <div className="p-2.5 bg-background border rounded-md">
                <p className="text-xs font-medium">{formData.schedule}</p>
              </div>
            )}

            {/* Manual Schedule Input */}
            <div className="pt-2 border-t">
              <Input
                id="schedule_manual"
                placeholder="Or enter manually: e.g., Mon/Wed 9:00-10:30"
                value={formData.schedule}
                onChange={(e) => {
                  setFormData({ ...formData, schedule: e.target.value });
                  if (e.target.value !== formData.schedule) {
                    setSelectedSlotStart('');
                    setSelectedSlotEnd('');
                    setSelectedDays([]);
                  }
                }}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Room/Location */}
          <div>
            <Label htmlFor="room" className="text-sm">Room/Location</Label>
            <Input
              id="room"
              placeholder="e.g., Building A - Room 101"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 pb-2 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="h-9"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 h-9"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Section'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
