import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/common/Card';

const HomeScreen = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="school" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.universityName}>University of Greenwich</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons name="bell" size={24} color={COLORS.white} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()}, Student!</Text>
        </View>

        {/* Academic Overview Cards */}
        <View style={styles.overviewContainer}>
          <Card style={styles.overviewCard}>
            <View style={styles.overviewContent}>
              <MaterialCommunityIcons name="target" size={24} color={COLORS.primary} />
              <Text style={styles.overviewNumber}>4.2</Text>
              <Text style={styles.overviewLabel}>Current GPA</Text>
              <View style={styles.overviewChange}>
                <Text style={styles.overviewChangeText}>+0.2</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.overviewCard}>
            <View style={styles.overviewContent}>
              <MaterialCommunityIcons name="waveform" size={24} color={COLORS.secondary} />
              <Text style={styles.overviewNumber}>92%</Text>
              <Text style={styles.overviewLabel}>Attendance</Text>
              <View style={styles.overviewChange}>
                <Text style={styles.overviewChangeText}>+3%</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.overviewCard}>
            <View style={styles.overviewContent}>
              <MaterialCommunityIcons name="account-group" size={24} color={COLORS.accent} />
              <Text style={styles.overviewNumber}>18/20</Text>
              <Text style={styles.overviewLabel}>Credits</Text>
              <View style={styles.overviewChange}>
                <Text style={styles.overviewChangeText}>On track</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Today's Schedule */}
        <Card style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>Today's Schedule</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All ></Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scheduleItem}>
            <View style={[styles.scheduleLine, { backgroundColor: COLORS.primary }]} />
            <View style={styles.scheduleContent}>
              <Text style={styles.scheduleSubject}>Mathematics</Text>
              <Text style={styles.scheduleLocation}>Room 101</Text>
            </View>
            <View style={styles.scheduleTime}>
              <Text style={styles.timeText}>09:00</Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View style={[styles.scheduleLine, { backgroundColor: COLORS.secondary }]} />
            <View style={styles.scheduleContent}>
              <Text style={styles.scheduleSubject}>Computer Science</Text>
              <Text style={styles.scheduleLocation}>Lab 205</Text>
            </View>
            <View style={styles.scheduleTime}>
              <Text style={styles.timeText}>14:00</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem}>
              <MaterialCommunityIcons name="calendar" size={32} color={COLORS.secondary} />
              <Text style={styles.quickActionTitle}>My Timetable</Text>
              <Text style={styles.quickActionSubtitle}>View today's classes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem}>
              <MaterialCommunityIcons name="school" size={32} color={COLORS.primary} />
              <Text style={styles.quickActionTitle}>Grades</Text>
              <Text style={styles.quickActionSubtitle}>Check your results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem}>
              <MaterialCommunityIcons name="currency-usd" size={32} color={COLORS.accent} />
              <Text style={styles.quickActionTitle}>Tuition Fees</Text>
              <Text style={styles.quickActionSubtitle}>Payment status</Text>
              <View style={styles.dueSoonTag}>
                <Text style={styles.dueSoonText}>Due Soon</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem}>
              <MaterialCommunityIcons name="file-document" size={32} color={COLORS.info} />
              <Text style={styles.quickActionTitle}>Documents</Text>
              <Text style={styles.quickActionSubtitle}>Request transcripts</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.lg,
  },
  greeting: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.white,
    backgroundColor: COLORS.header,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    alignSelf: 'flex-start',
  },
  overviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  overviewCard: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    padding: SPACING.base,
  },
  overviewContent: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  overviewLabel: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  overviewChange: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
  overviewChangeText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
  },
  scheduleCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  scheduleTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium as any,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  scheduleLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: SPACING.base,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  scheduleLocation: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
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
  quickActionsTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.base,
    position: 'relative',
  },
  quickActionTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  dueSoonTag: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  dueSoonText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
  },
});

export default HomeScreen;
