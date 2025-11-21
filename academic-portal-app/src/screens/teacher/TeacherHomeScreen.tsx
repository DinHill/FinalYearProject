import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { commonStyles } from '../../styles/commonStyles';
import Card from '../../components/common/Card';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';

interface TeachingStats {
  total_sections: number;
  total_students: number;
  pending_assignments: number;
  recent_sections: Array<{
    id: number;
    course_code: string;
    course_name: string;
    section_code: string;
    enrolled_count: number;
    max_students: number;
  }>;
}

interface UpcomingClass {
  id: number;
  course_code: string;
  course_name: string;
  section_code: string;
  start_time: string;
  end_time: string;
  room: string;
  date: string;
  day_name: string;
  enrolled_count: number;
}

const TeacherHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const responsive = useResponsive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeachingStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setError(null);

    try {
      // Load teaching stats
      const statsResponse = await api.get('/api/v1/me/teaching-stats');
      console.log('📊 Stats response:', statsResponse);
      if (!statsResponse.success) {
        throw new Error(statsResponse.error || 'Failed to load stats');
      }
      // Handle nested data structure from API
      const statsData = (statsResponse.data as any)?.data || statsResponse.data;
      setStats(statsData);

      // Load today's schedule
      const scheduleResponse = await api.get('/api/v1/me/teaching-schedule?days=1');
      console.log('📅 Schedule response:', scheduleResponse);
      if (scheduleResponse.success && scheduleResponse.data) {
        // Handle nested data structure from API
        const scheduleData = Array.isArray(scheduleResponse.data) 
          ? scheduleResponse.data 
          : ((scheduleResponse.data as any)?.data || []);
        console.log('📅 Setting upcomingClasses to:', scheduleData, 'Type:', Array.isArray(scheduleData));
        setUpcomingClasses(scheduleData);
      } else {
        console.log('⚠️ Schedule request failed, setting empty array');
        setUpcomingClasses([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Dashboard error:', err);
      // Ensure arrays are set even on error
      setUpcomingClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header - Same format as student screen */}
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
          <Text style={[commonStyles.greeting, { fontSize: adaptiveFontSize.xxlarge }]}>
            {getGreeting()}, {user?.full_name || 'Teacher'}!
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="school-outline" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats?.total_sections || 0}</Text>
            <Text style={styles.statLabel}>Active Classes</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={32} color={COLORS.success} />
            <Text style={styles.statValue}>{stats?.total_students || 0}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </Card>

          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats?.pending_assignments || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Attendance')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <MaterialCommunityIcons name="calendar-check" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Grades')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                <MaterialCommunityIcons name="chart-box-outline" size={28} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>Grades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Schedule')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.info + '20' }]}>
                <MaterialCommunityIcons name="calendar-month" size={28} color={COLORS.info} />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('More', { screen: 'Support' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <MaterialCommunityIcons name="help-circle-outline" size={28} color={COLORS.warning} />
              </View>
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Classes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {!upcomingClasses || upcomingClasses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No classes today</Text>
            </Card>
          ) : (
            upcomingClasses.map((classItem, index) => (
              <Card key={index} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classBadge}>
                    <Text style={styles.classCode}>{classItem.course_code}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray} />
                    <Text style={styles.classTime}>
                      {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.className}>{classItem.course_name}</Text>

                <View style={styles.classFooter}>
                  <View style={styles.classDetail}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.gray} />
                    <Text style={styles.classDetailText}>{classItem.room}</Text>
                  </View>
                  <View style={styles.classDetail}>
                    <MaterialCommunityIcons name="account-group" size={16} color={COLORS.gray} />
                    <Text style={styles.classDetailText}>{classItem.enrolled_count} students</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Recent Sections */}
        {stats?.recent_sections && stats.recent_sections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Classes</Text>
            {stats.recent_sections.map((section) => (
              <Card key={section.id} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionCode}>{section.course_code}</Text>
                  </View>
                  <Text style={styles.sectionEnrollment}>
                    {section.enrolled_count}/{section.max_students}
                  </Text>
                </View>
                <Text style={styles.sectionName}>{section.course_name}</Text>
                <Text style={styles.sectionInfo}>Section: {section.section_code}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  universityName: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  notificationButton: {
    position: 'relative',
    marginLeft: SPACING.base,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  profileButton: {
    marginLeft: SPACING.base,
  },
  greetingContainer: {
    backgroundColor: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    padding: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONTS['2xl'],
    fontWeight: '700',
    color: COLORS.black,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs / 2,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  seeAll: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: FONTS.xs,
    color: COLORS.black,
    textAlign: 'center',
  },
  classCard: {
    marginBottom: SPACING.base,
    padding: SPACING.lg,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  classBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  classCode: {
    fontSize: FONTS.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  classTime: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  className: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  classDetailText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    marginTop: SPACING.base,
  },
  sectionCard: {
    marginBottom: SPACING.base,
    padding: SPACING.lg,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  sectionCode: {
    fontSize: FONTS.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionEnrollment: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    fontWeight: '600',
  },
  sectionName: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionInfo: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
});

export default TeacherHomeScreen;
