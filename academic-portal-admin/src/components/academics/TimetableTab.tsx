'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimetableTabProps {
  semesterId: number | null;
}

type ViewMode = 'week' | 'month';

interface ScheduleItem {
  id: number;
  section_id: number;
  course_code: string;
  course_name: string;
  section_code: string;
  day: number;
  day_name: string;
  start_time: string;
  end_time: string;
  room: string;
  room_name?: string;
  building_name?: string;
  date: string;
  semester: string;
  instructor_name?: string;
}

export function TimetableTab({ semesterId }: TimetableTabProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch schedule data - all sections with their schedules
  const { data: scheduleData = [], isLoading } = useQuery({
    queryKey: ['admin-schedule', semesterId],
    queryFn: async () => {
      // Get all sections for this semester with expanded page size
      const response = await api.get<any>('/api/v1/academic/sections', {
        params: { 
          semester_id: semesterId,
          page: 1,
          page_size: 100
        }
      });
      if (!response.success) throw new Error(response.error);
      
      const sections = response.data?.items || [];
      console.log('📅 Sections loaded:', sections.length);
      if (sections.length > 0) {
        console.log('📅 First section sample:', sections[0]);
      }
      
      // Transform sections into schedule items
      const scheduleItems: ScheduleItem[] = [];
      
      for (const section of sections) {
        // Check if section has schedule in JSONB format
        const scheduleData = section.schedule;
        
        console.log('📅 Section:', section.section_code, 'Schedule:', scheduleData);
        
        if (scheduleData && scheduleData.sessions && Array.isArray(scheduleData.sessions)) {
          console.log('📅 Found sessions for section:', section.section_code, scheduleData.sessions);
          
          // For each session in the schedule, create entries for the next 30 days
          const today = new Date();
          for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Check if any session matches this day
            for (const session of scheduleData.sessions) {
              if (session.day === dayName) {
                scheduleItems.push({
                  id: section.id,
                  section_id: section.id,
                  course_code: section.course_code || 'N/A',
                  course_name: section.course_name || 'Unknown',
                  section_code: section.section_code || '',
                  day: date.getDay(),
                  day_name: dayName,
                  start_time: session.start_time || '',
                  end_time: session.end_time || '',
                  room: session.room || 'TBD',
                  room_name: session.room || 'TBD',
                  building_name: session.building || '',
                  date: date.toISOString().split('T')[0],
                  semester: section.semester_name || '',
                  instructor_name: section.instructor_name || 'Unassigned'
                });
              }
            }
          }
        }
      }
      
      console.log('📅 Schedule items generated:', scheduleItems.length);
      return scheduleItems;
    },
    enabled: !!semesterId
  });

  const getDaysForWeek = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
    monday.setDate(monday.getDate() + (selectedWeek * 7));

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        date: `${day.getDate()} ${day.toLocaleString('default', { month: 'short' })}`,
        dayNumber: day.getDay(),
        fullDate: day,
      });
    }
    return days;
  };

  const getDaysForMonth = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(selectedYear, selectedMonth, i);
      const dayName = day.toLocaleDateString('default', { weekday: 'short' });
      days.push({
        name: dayName,
        date: `${i}`,
        dayNumber: day.getDay(),
        fullDate: day,
      });
    }
    return days;
  };

  const days = viewMode === 'week' ? getDaysForWeek() : getDaysForMonth();
  const selectedDayInfo = days[selectedDay] || days[0];

  // Log for debugging
  useEffect(() => {
    console.log('📅 Current schedule data:', scheduleData);
    console.log('📅 Selected day info:', selectedDayInfo);
    console.log('📅 Classes for selected day:', getClassesForSelectedDay());
  }, [scheduleData, selectedDay, selectedDayInfo]);

  const getClassesForSelectedDay = () => {
    let classes = scheduleData.filter((classItem: ScheduleItem) => {
      if (!classItem.date) return false;
      const classDate = new Date(classItem.date);
      return classDate.toDateString() === selectedDayInfo.fullDate.toDateString();
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      classes = classes.filter((classItem: ScheduleItem) => 
        classItem.course_name.toLowerCase().includes(query) ||
        classItem.course_code.toLowerCase().includes(query) ||
        classItem.room?.toLowerCase().includes(query) ||
        classItem.instructor_name?.toLowerCase().includes(query)
      );
    }

    // Sort by start time
    classes.sort((a: ScheduleItem, b: ScheduleItem) => {
      return a.start_time.localeCompare(b.start_time);
    });

    return classes;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getClassColor = (index: number) => {
    const colors = ['#003366', '#00509E', '#0073E6', '#4A90E2'];
    return colors[index % colors.length];
  };

  const hasClassesOnDay = (day: any) => {
    return scheduleData.some((classItem: ScheduleItem) => {
      if (!classItem.date) return false;
      const classDate = new Date(classItem.date);
      return classDate.toDateString() === day.fullDate.toDateString();
    });
  };

  const classesForDay = getClassesForSelectedDay();

  if (!semesterId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Please select a semester</p>
          <p className="text-gray-500 text-sm mt-2">Choose a semester to view timetable</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Timetable</h2>
            <p className="text-gray-500 text-sm">Manage class schedules</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search classes, rooms, instructors..."
          className="pl-10"
        />
      </div>

      {/* View Mode Filter */}
      <div className="flex items-center gap-3">
        {/* Dropdown Selection */}
        <div className="relative flex-[2]">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="font-semibold">
              {viewMode === 'week' 
                ? `Week ${selectedWeek + 1}` 
                : `${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`
              }
            </span>
            {showDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showDropdown && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-64 overflow-auto">
              <CardContent className="p-0">
                {viewMode === 'week' ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start rounded-none border-b last:border-b-0",
                        selectedWeek === i && "bg-blue-50 text-[#003366] font-semibold"
                      )}
                      onClick={() => {
                        setSelectedWeek(i);
                        setShowDropdown(false);
                        setSelectedDay(0);
                      }}
                    >
                      Week {i + 1}
                    </Button>
                  ))
                ) : (
                  Array.from({ length: 12 }, (_, i) => {
                    const monthName = new Date(selectedYear, i).toLocaleString('default', { month: 'long' });
                    return (
                      <Button
                        key={i}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-none border-b last:border-b-0",
                          selectedMonth === i && "bg-blue-50 text-[#003366] font-semibold"
                        )}
                        onClick={() => {
                          setSelectedMonth(i);
                          setShowDropdown(false);
                          setSelectedDay(0);
                        }}
                      >
                        {monthName} {selectedYear}
                      </Button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          className={cn(
            "flex-1",
            viewMode === 'week' && "bg-[#003366] hover:bg-[#00509E]"
          )}
          onClick={() => {
            setViewMode('week');
            setShowDropdown(false);
            setSelectedDay(0);
          }}
        >
          Week
        </Button>
        
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          className={cn(
            "flex-1",
            viewMode === 'month' && "bg-[#003366] hover:bg-[#00509E]"
          )}
          onClick={() => {
            setViewMode('month');
            setShowDropdown(false);
            setSelectedDay(0);
          }}
        >
          Month
        </Button>
      </div>

      {/* Day Navigation - Week View */}
      {viewMode === 'week' && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((day, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "min-w-[80px] flex-col h-auto py-3 px-4",
                selectedDay === index && "bg-[#003366] text-white border-[#003366] hover:bg-[#00509E] hover:text-white"
              )}
              onClick={() => setSelectedDay(index)}
            >
              <span className="font-semibold text-sm">{day.name}</span>
              <span className="text-xs mt-1">{day.date}</span>
              {hasClassesOnDay(day) && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-2",
                  selectedDay === index ? "bg-white" : "bg-[#003366]"
                )} />
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Day Navigation - Month View */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "flex-col h-auto py-3 px-2",
                selectedDay === index && "bg-[#003366] text-white border-[#003366] hover:bg-[#00509E] hover:text-white"
              )}
              onClick={() => setSelectedDay(index)}
            >
              <span className="text-xs">{day.name}</span>
              <span className="font-semibold text-sm mt-1">{day.date}</span>
              {hasClassesOnDay(day) && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-2",
                  selectedDay === index ? "bg-white" : "bg-[#003366]"
                )} />
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Classes for Selected Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Classes for {viewMode === 'week' ? days[selectedDay]?.name : `${days[selectedDay]?.name}, ${days[selectedDay]?.date}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classesForDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No classes scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classesForDay.map((classItem: ScheduleItem, index) => (
                <div key={`${classItem.section_id}-${classItem.date}-${index}`} className="flex gap-3">
                  <div 
                    className="w-1 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: getClassColor(index) }}
                  />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-gray-900">{classItem.course_name}</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {classItem.room_name || 'Room TBA'}
                          {classItem.building_name && ` • ${classItem.building_name}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{classItem.section_code}</span>
                      </div>
                      {classItem.instructor_name && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Instructor:</span> {classItem.instructor_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
