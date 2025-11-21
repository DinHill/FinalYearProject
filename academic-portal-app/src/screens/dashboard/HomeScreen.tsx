import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, wp, hp } from '../../constants/theme';
import { commonStyles } from '../../styles/commonStyles';
import Card from '../../components/common/Card';
import { api, StudentDashboardStats, UpcomingClass } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const responsive = useResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Only load student dashboard for students
      if (user?.role === 'student') {
        // Load dashboard stats
        const dashboardResponse = await api.getStudentDashboard();
        if (!dashboardResponse.success) {
          throw new Error(dashboardResponse.error || 'Failed to load dashboard');
        }
        setDashboardData(dashboardResponse.data!);

        // Load upcoming classes (next 1 day for "Today")
        const classesResponse = await api.getUpcomingClasses(1);
        if (classesResponse.success && classesResponse.data) {
          setUpcomingClasses(classesResponse.data);
        }
      }
      // For teachers, we don't load student-specific data
      // Teacher dashboard would go here if implemented
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={commonStyles.loadingText}>Loading dashboard...</Text>
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
          <TouchableOpacity style={commonStyles.primaryButton} onPress={loadDashboardData}>
            <Text style={commonStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Image source={require('../../../assets/images/public/Gw_Logo_Small.jpg')} style={styles.logoImage} />
            </View>
            <Text style={styles.universityName}>University of Greenwich</Text>
          </View>
          <View style={commonStyles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('More', { screen: 'Announcements' })}
            >
              <MaterialCommunityIcons name="bell" size={24} color={COLORS.white} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('More', { screen: 'Profile' })}
            >
              <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={[styles.greetingContainer, { 
          paddingHorizontal: adaptiveSpacing.base,
          paddingVertical: adaptiveSpacing.lg 
        }]}>
          <Text style={[commonStyles.greeting, { fontSize: responsive.isTablet ? adaptiveFontSize.title : adaptiveFontSize.xxlarge }]}>
            {getGreeting()}, {user?.full_name || 'Student'}!
          </Text>
        </View>

        {/* Today's Schedule */}
        <Card style={{
          ...styles.scheduleCard,
          marginHorizontal: adaptiveSpacing.base,
          marginBottom: adaptiveSpacing.lg,
          ...(responsive.isTablet && { width: responsive.wp(94) })
        }}>
          <View>
            <View style={styles.scheduleHeader}>
              <Text style={[commonStyles.sectionTitle, { fontSize: adaptiveFontSize.large }]}>Today's Schedule</Text>
              <TouchableOpacity>
                <Text style={[styles.viewAllText, { fontSize: adaptiveFontSize.small }]}>View All {'>'}</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingClasses.length === 0 ? (
              <View style={commonStyles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.gray} />
                <Text style={commonStyles.emptyStateText}>No classes today</Text>
              </View>
            ) : (
              upcomingClasses.map((classItem, index) => {
                const colors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.info];
                const color = colors[index % colors.length];
                
                return (
                  <View key={`schedule-${classItem.schedule_id}-${index}`} style={commonStyles.listItemWithLine}>
                    <View style={[commonStyles.itemLine, { backgroundColor: color }]} />
                    <View style={commonStyles.itemContent}>
                      <Text style={commonStyles.itemTitle}>{classItem.course_name}</Text>
                      <Text style={commonStyles.itemSubtitle}>
                        {classItem.room_name || 'Room TBA'} • {classItem.section_code}
                      </Text>
                    </View>
                    <View style={styles.scheduleTime}>
                      <Text style={styles.timeText}>{formatTime(classItem.start_time)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={{
          ...styles.quickActionsCard,
          marginHorizontal: adaptiveSpacing.base,
          marginBottom: adaptiveSpacing.base,
          paddingVertical: adaptiveSpacing.base
        }}>
          <View>
            <Text style={[commonStyles.sectionTitle, { fontSize: adaptiveFontSize.large, marginBottom: adaptiveSpacing.base }]}>Quick Actions</Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: adaptiveSpacing.sm
            }}>
                <TouchableOpacity 
                  style={[commonStyles.quickActionItem, {
                    width: '48%',
                    padding: adaptiveSpacing.base
                  }]}
                  onPress={() => navigation.navigate('Schedule')}
                >
                  <MaterialCommunityIcons name="calendar" size={32} color={COLORS.secondary} />
                  <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>My Timetable</Text>
                </TouchableOpacity>

                {user?.role === 'teacher' ? (
                  <>
                    <TouchableOpacity 
                      style={[commonStyles.quickActionItem, {
                        width: '48%',
                        padding: adaptiveSpacing.base
                      }]}
                      onPress={() => navigation.navigate('Attendance')}
                    >
                      <MaterialCommunityIcons name="clipboard-check" size={32} color={COLORS.primary} />
                      <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>Attendance</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[commonStyles.quickActionItem, {
                        width: '48%',
                        padding: adaptiveSpacing.base
                      }]}
                      onPress={() => navigation.navigate('Grades')}
                    >
                      <MaterialCommunityIcons name="pencil-box" size={32} color={COLORS.accent} />
                      <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>Grades</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[commonStyles.quickActionItem, {
                        width: '48%',
                        padding: adaptiveSpacing.base
                      }]}
                      onPress={() => navigation.navigate('More', { screen: 'Support' })}
                    >
                      <MaterialCommunityIcons name="help-circle" size={32} color={COLORS.info} />
                      <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>Support</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[commonStyles.quickActionItem, {
                        width: '48%',
                        padding: adaptiveSpacing.base
                      }]}
                      onPress={() => navigation.navigate('Academic')}
                    >
                      <MaterialCommunityIcons name="school" size={32} color={COLORS.primary} />
                      <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>Academic</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[commonStyles.quickActionItem, {
                        width: '48%',
                        padding: adaptiveSpacing.base
                      }]}
                      onPress={() => navigation.navigate('More', { screen: 'Support' })}
                    >
                      <MaterialCommunityIcons name="help-circle" size={32} color={COLORS.info} />
                      <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[commonStyles.quickActionItem, {
                        width: '48%',
                        padding: adaptiveSpacing.base
                      }]}
                      onPress={() => navigation.navigate('More', { screen: 'Finance' })}
                    >
                      <MaterialCommunityIcons name="currency-usd" size={32} color={COLORS.accent} />
                      <Text style={[commonStyles.quickActionTitle, { fontSize: adaptiveFontSize.base, marginTop: adaptiveSpacing.sm }]}>Fee</Text>
                    </TouchableOpacity>
                  </>
                )}
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Screen-specific styles only - many responsive values applied inline
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
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  universityName: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium as any,
  },
  notificationButton: {
    marginRight: SPACING.base,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  profileButton: {
    position: 'relative',
  },
  greetingContainer: {
    // Responsive spacing applied inline
  },
  overviewContent: {
    alignItems: 'center',
  },
  overviewNumber: {
    // Responsive fontSize applied inline
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  overviewLabel: {
    // Responsive fontSize applied inline
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  scheduleCard: {
    // Responsive margins and width applied inline
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  viewAllText: {
    color: COLORS.primary,
    // Responsive fontSize applied inline
    fontWeight: FONTS.medium as any,
  },
  scheduleTime: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  timeText: {
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
    fontWeight: FONTS.medium as any,
  },
  quickActionsCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  quickActionItemRelative: {
    position: 'relative',
  },
  dueSoonTag: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.error,
    // Responsive padding applied inline
    borderRadius: BORDER_RADIUS.sm,
  },
  dueSoonText: {
    color: COLORS.white,
    // Responsive fontSize applied inline
    fontWeight: FONTS.medium as any,
  },
});

export default HomeScreen;
