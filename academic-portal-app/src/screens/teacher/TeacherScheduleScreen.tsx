import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { SearchBar } from '../../components/common';
import { api } from '../../services/api';
import { commonStyles } from '../../styles/commonStyles';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';

interface TeachingClass {
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
  date: string;
  enrolled_count: number;
}

type ViewMode = 'week' | 'month';

const TeacherScheduleScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const responsive = useResponsive();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<TeachingClass[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/v1/me/teaching-schedule?days=30');
      if (!response.success) {
        throw new Error(response.error || 'Failed to load schedule');
      }
      
      console.log('📅 Teaching schedule response:', response);
      
      // Handle nested data structure from API
      let scheduleData = Array.isArray(response.data) 
        ? response.data 
        : ((response.data as any)?.data || []);
      
      console.log('📚 Schedule data:', scheduleData);
      
      // Ensure each item has a proper date field
      scheduleData = scheduleData.map((item: any) => ({
        ...item,
        // Ensure date is in proper format
        date: item.date || item.next_occurrence || new Date().toISOString().split('T')[0],
      }));
      
      setSchedule(scheduleData);
    } catch (err: any) {
      console.error('❌ Schedule error:', err);
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const getDaysForWeek = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
    // Adjust for selected week
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
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    
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

  const getClassesForSelectedDay = () => {
    console.log('🔍 Filtering for day:', selectedDayInfo?.fullDate?.toDateString());
    console.log('📊 Total schedule items:', schedule.length);
    
    let classes = schedule.filter(classItem => {
      if (!classItem.date) {
        console.log('⚠️ Class missing date:', classItem);
        return false;
      }
      const classDate = new Date(classItem.date);
      const matches = classDate.toDateString() === selectedDayInfo.fullDate.toDateString();
      if (matches) {
        console.log('✅ Match found:', classItem.course_name, classDate.toDateString());
      }
      return matches;
    });

    console.log('📋 Filtered classes for selected day:', classes.length);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      classes = classes.filter(classItem => 
        classItem.course_name?.toLowerCase().includes(query) ||
        classItem.course_code?.toLowerCase().includes(query) ||
        classItem.room?.toLowerCase().includes(query) ||
        classItem.section_code?.toLowerCase().includes(query)
      );
      console.log('🔎 After search filter:', classes.length);
    }

    return classes;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getClassColor = (index: number) => {
    const colors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.info];
    return colors[index % colors.length];
  };

  const hasClassesOnDay = (day: any) => {
    return schedule.some(classItem => {
      if (!classItem.date) return false;
      const classDate = new Date(classItem.date);
      return classDate.toDateString() === day.fullDate.toDateString();
    });
  };

  const classesForDay = getClassesForSelectedDay();

  // Log summary
  useEffect(() => {
    if (schedule.length > 0) {
      console.log('📊 Schedule summary:');
      console.log('  Total classes:', schedule.length);
      console.log('  Sample class:', schedule[0]);
      const uniqueDates = [...new Set(schedule.map(s => s.date))];
      console.log('  Unique dates:', uniqueDates);
    }
  }, [schedule]);

  const quickActions = [
    { icon: 'clock', title: 'View Full Week Schedule' },
    { icon: 'map-marker', title: 'Campus Map & Room Finder' },
    { icon: 'account-group', title: 'View Student Lists' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={commonStyles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={commonStyles.errorText}>{error}</Text>
          <TouchableOpacity style={commonStyles.primaryButton} onPress={loadSchedule}>
            <Text style={commonStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['left', 'right']}>
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Student Schedule Style */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="calendar-account" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.universityName}>Teaching Timetable</Text>
            </View>
          </View>
          <View style={commonStyles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('More', { screen: 'Announcements' })}
            >
              <MaterialCommunityIcons name="bell" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('More', { screen: 'Profile' })}
            >
              <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={commonStyles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search classes, rooms, sections..."
          />
        </View>

        {/* View Mode Filter */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: adaptiveSpacing.base,
          paddingTop: adaptiveSpacing.base,
          gap: adaptiveSpacing.sm
        }}>
          {/* Dropdown Selection */}
          <TouchableOpacity
            style={{
              flex: 2,
              paddingVertical: adaptiveSpacing.sm,
              paddingHorizontal: adaptiveSpacing.base,
              borderRadius: BORDER_RADIUS.base,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.grayLight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={{
              fontSize: adaptiveFontSize.small,
              fontWeight: '600' as any,
              color: COLORS.black
            }}>
              {viewMode === 'week' 
                ? `Week ${selectedWeek + 1}` 
                : `${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`
              }
            </Text>
            <MaterialCommunityIcons 
              name={showDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.gray} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: adaptiveSpacing.sm,
              borderRadius: BORDER_RADIUS.base,
              backgroundColor: viewMode === 'week' ? COLORS.primary : COLORS.white,
              borderWidth: 1,
              borderColor: viewMode === 'week' ? COLORS.primary : COLORS.grayLight,
              alignItems: 'center'
            }}
            onPress={() => { setViewMode('week'); setShowDropdown(false); }}
          >
            <Text style={{
              fontSize: adaptiveFontSize.small,
              fontWeight: '600' as any,
              color: viewMode === 'week' ? COLORS.white : COLORS.gray
            }}>Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: adaptiveSpacing.sm,
              borderRadius: BORDER_RADIUS.base,
              backgroundColor: viewMode === 'month' ? COLORS.primary : COLORS.white,
              borderWidth: 1,
              borderColor: viewMode === 'month' ? COLORS.primary : COLORS.grayLight,
              alignItems: 'center'
            }}
            onPress={() => { setViewMode('month'); setShowDropdown(false); }}
          >
            <Text style={{
              fontSize: adaptiveFontSize.small,
              fontWeight: '600' as any,
              color: viewMode === 'month' ? COLORS.white : COLORS.gray
            }}>Month</Text>
          </TouchableOpacity>
        </View>

        {/* Day Navigation - Week or Month View */}
        {viewMode === 'week' ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ paddingVertical: adaptiveSpacing.base }}
            contentContainerStyle={{
              paddingHorizontal: adaptiveSpacing.base,
              gap: adaptiveSpacing.xs
            }}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: selectedDay === index ? COLORS.primary : COLORS.white,
                  paddingHorizontal: adaptiveSpacing.base,
                  paddingVertical: adaptiveSpacing.base,
                  borderRadius: BORDER_RADIUS.base,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: selectedDay === index ? COLORS.primary : COLORS.grayLight,
                  minWidth: 70
                }}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={{
                  color: selectedDay === index ? COLORS.white : COLORS.black,
                  fontSize: adaptiveFontSize.small,
                  fontWeight: '600' as any
                }}>
                  {day.name}
                </Text>
                <Text style={{
                  color: selectedDay === index ? COLORS.white : COLORS.gray,
                  fontSize: adaptiveFontSize.tiny,
                  marginTop: 2
                }}>
                  {day.date}
                </Text>
                {hasClassesOnDay(day) && (
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: selectedDay === index ? COLORS.white : COLORS.primary,
                    marginTop: 4
                  }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{
            paddingHorizontal: adaptiveSpacing.base,
            paddingVertical: adaptiveSpacing.base
          }}>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: adaptiveSpacing.xs
            }}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: selectedDay === index ? COLORS.primary : COLORS.white,
                    paddingHorizontal: adaptiveSpacing.sm,
                    paddingVertical: adaptiveSpacing.base,
                    borderRadius: BORDER_RADIUS.base,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: selectedDay === index ? COLORS.primary : COLORS.grayLight,
                    width: `${100 / 7 - 1}%`
                  }}
                  onPress={() => setSelectedDay(index)}
                >
                  <Text style={{
                    color: selectedDay === index ? COLORS.white : COLORS.gray,
                    fontSize: adaptiveFontSize.tiny,
                    fontWeight: '400' as any
                  }}>
                    {day.name}
                  </Text>
                  <Text style={{
                    color: selectedDay === index ? COLORS.white : COLORS.black,
                    fontSize: adaptiveFontSize.small,
                    fontWeight: '600' as any,
                    marginTop: 2
                  }}>
                    {day.date}
                  </Text>
                  {hasClassesOnDay(day) && (
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: selectedDay === index ? COLORS.white : COLORS.primary,
                      marginTop: 4
                    }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Classes for Selected Day */}
        <Card style={styles.classesCard}>
          <Text style={commonStyles.sectionTitle}>
            Classes for {viewMode === 'week' ? days[selectedDay]?.name : `${days[selectedDay]?.name}, ${days[selectedDay]?.date}`}
          </Text>
          
          {classesForDay.length === 0 ? (
            <View style={commonStyles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.gray} />
              <Text style={commonStyles.emptyStateText}>No classes scheduled for this day</Text>
            </View>
          ) : (
            classesForDay.map((classItem, index) => (
              <View key={classItem.id} style={commonStyles.listItemWithLine}>
                <View style={[styles.classLine, { backgroundColor: getClassColor(index) }]} />
                <View style={commonStyles.itemContent}>
                  <Text style={styles.className}>{classItem.course_name}</Text>
                  <View style={styles.classInfo}>
                    <View style={styles.classInfoRow}>
                      <MaterialCommunityIcons name="clock" size={16} color={COLORS.gray} />
                      <Text style={styles.classInfoText}>
                        {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                      </Text>
                    </View>
                    <View style={styles.classInfoRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.gray} />
                      <Text style={styles.classInfoText}>
                        {classItem.room || 'Room TBA'}
                      </Text>
                    </View>
                    <View style={styles.classInfoRow}>
                      <MaterialCommunityIcons name="book" size={16} color={COLORS.gray} />
                      <Text style={styles.classInfoText}>{classItem.section_code}</Text>
                    </View>
                    <View style={styles.classInfoRow}>
                      <MaterialCommunityIcons name="account-group" size={16} color={COLORS.gray} />
                      <Text style={styles.classInfoText}>{classItem.enrolled_count} students</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={commonStyles.sectionTitle}>Quick Actions</Text>
          
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem}>
              <MaterialCommunityIcons 
                name={action.icon as any} 
                size={24} 
                color={COLORS.primary} 
              />
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>

      {/* Dropdown Menu - Overlay */}
      {showDropdown && (
        <View style={{
          position: 'absolute',
          top: 220,
          left: adaptiveSpacing.base,
          right: adaptiveSpacing.base,
          backgroundColor: COLORS.white,
          borderRadius: BORDER_RADIUS.base,
          borderWidth: 1,
          borderColor: COLORS.grayLight,
          maxHeight: 200,
          zIndex: 1000,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}>
          <ScrollView>
            {viewMode === 'week' ? (
              // Week selection (4-5 weeks in current month)
              Array.from({ length: 5 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    paddingVertical: adaptiveSpacing.base,
                    paddingHorizontal: adaptiveSpacing.base,
                    borderBottomWidth: i < 4 ? 1 : 0,
                    borderBottomColor: COLORS.grayLight,
                    backgroundColor: selectedWeek === i ? COLORS.primaryLight : 'transparent'
                  }}
                  onPress={() => {
                    setSelectedWeek(i);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={{
                    fontSize: adaptiveFontSize.base,
                    color: selectedWeek === i ? COLORS.primary : COLORS.black,
                    fontWeight: selectedWeek === i ? '600' as any : '400' as any
                  }}>Week {i + 1}</Text>
                </TouchableOpacity>
              ))
            ) : (
              // Month selection (12 months)
              Array.from({ length: 12 }, (_, i) => {
                const monthName = new Date(selectedYear, i).toLocaleString('default', { month: 'long' });
                return (
                  <TouchableOpacity
                    key={i}
                    style={{
                      paddingVertical: adaptiveSpacing.base,
                      paddingHorizontal: adaptiveSpacing.base,
                      borderBottomWidth: i < 11 ? 1 : 0,
                      borderBottomColor: COLORS.grayLight,
                      backgroundColor: selectedMonth === i ? COLORS.primaryLight : 'transparent'
                    }}
                    onPress={() => {
                      setSelectedMonth(i);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={{
                      fontSize: adaptiveFontSize.base,
                      color: selectedMonth === i ? COLORS.primary : COLORS.black,
                      fontWeight: selectedMonth === i ? '600' as any : '400' as any
                    }}>{monthName} {selectedYear}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  universityName: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium as any,
  },
  notificationButton: {
    marginRight: SPACING.base,
  },
  profileButton: {
    // Empty style for consistency
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONTS['2xl'],
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  searchContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
  },
  dayNavigation: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  dayButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayName: {
    color: COLORS.black,
    fontSize: FONTS.sm,
    fontWeight: '600' as any,
  },
  dayNameSelected: {
    color: COLORS.white,
  },
  dayDate: {
    color: COLORS.gray,
    fontSize: FONTS.xs,
    marginTop: 2,
  },
  dayDateSelected: {
    color: COLORS.white,
  },
  classesCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  classesTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  classLine: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: SPACING.base,
  },
  classContent: {
    flex: 1,
  },
  className: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  classInfo: {
    gap: SPACING.xs,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
  },
  emptyClasses: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyClassesText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.gray,
  },
  statusButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
  },
  quickActionsCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  quickActionsTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  quickActionText: {
    fontSize: FONTS.base,
    color: COLORS.black,
    marginLeft: SPACING.base,
  },
});

export default TeacherScheduleScreen;
