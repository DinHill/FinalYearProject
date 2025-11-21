import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: { relativeOffset: number }[];
}

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to your calendar');
    return false;
  }
  return true;
}

export async function getDefaultCalendarId(): Promise<string | null> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) return null;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Try to find default calendar
  let defaultCalendar = calendars.find(cal => cal.isPrimary);
  
  // Fallback to first writable calendar
  if (!defaultCalendar) {
    defaultCalendar = calendars.find(cal => cal.allowsModifications);
  }

  if (!defaultCalendar) {
    Alert.alert('Error', 'No writable calendar found');
    return null;
  }

  return defaultCalendar.id;
}

export async function addEventToCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) return false;

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      notes: event.notes,
      alarms: event.alarms || [{ relativeOffset: -15 }], // 15 minutes before
      timeZone: 'UTC',
    });

    if (eventId) {
      Alert.alert('Success', 'Event added to calendar');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Add event error:', error);
    Alert.alert('Error', 'Failed to add event to calendar');
    return false;
  }
}

export async function addClassToCalendar(
  courseName: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  room?: string,
  instructor?: string
): Promise<boolean> {
  const now = new Date();
  const currentDay = now.getDay();
  
  // Calculate next occurrence of the day
  let daysUntilClass = dayOfWeek - currentDay;
  if (daysUntilClass < 0) daysUntilClass += 7;
  
  const classDate = new Date(now);
  classDate.setDate(now.getDate() + daysUntilClass);
  
  // Parse time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startDate = new Date(classDate);
  startDate.setHours(startHour, startMinute, 0);
  
  const endDate = new Date(classDate);
  endDate.setHours(endHour, endMinute, 0);
  
  const notes = instructor ? `Instructor: ${instructor}` : undefined;
  
  return addEventToCalendar({
    title: courseName,
    startDate,
    endDate,
    location: room,
    notes,
    alarms: [{ relativeOffset: -15 }],
  });
}
