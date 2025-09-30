import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';

const AcademicScreen = () => {
  const [activeTab, setActiveTab] = useState('Grades');

  const tabs = ['Grades', 'Attendance', 'Transcript'];

  const overviewData = {
    gpa: '3.59',
    attendance: '90%',
    credits: '18',
  };

  const courses = [
    {
      name: 'Mathematics',
      credits: '4 credits',
      grade: 'A-',
      gpaPoints: '3.7 pts',
      color: COLORS.secondary,
    },
    {
      name: 'Computer Science',
      credits: '3 credits',
      grade: 'A+',
      gpaPoints: '4 pts',
      color: COLORS.primary,
    },
    {
      name: 'Physics',
      credits: '3 credits',
      grade: 'B+',
      gpaPoints: '3.3 pts',
      color: COLORS.accent,
    },
    {
      name: 'English Literature',
      credits: '3 credits',
      grade: 'A',
      gpaPoints: '4 pts',
      color: COLORS.info,
    },
    {
      name: 'Chemistry',
      credits: '3 credits',
      grade: 'B',
      gpaPoints: '3 pts',
      color: COLORS.warning,
    },
  ];

  const actionButtons = [
    { icon: 'trophy', title: 'View Achievements' },
    { icon: 'target', title: 'Grade Calculator' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Academic Overview</Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewNumber}>{overviewData.gpa}</Text>
            <Text style={styles.overviewLabel}>Current GPA</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewNumber}>{overviewData.attendance}</Text>
            <Text style={styles.overviewLabel}>Attendance</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewNumber}>{overviewData.credits}</Text>
            <Text style={styles.overviewLabel}>Credits</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on active tab */}
        {activeTab === 'Grades' && (
          <View style={styles.contentContainer}>
            {/* Current Semester Grades */}
            <Card style={styles.gradesCard}>
              <View style={styles.gradesHeader}>
                <Text style={styles.gradesTitle}>Current Semester Grades</Text>
                <View style={styles.gpaIndicator}>
                  <MaterialCommunityIcons name="trending-up" size={16} color={COLORS.success} />
                  <Text style={styles.gpaIndicatorText}>{overviewData.gpa} GPA</Text>
                </View>
              </View>

              {courses.map((course, index) => (
                <View key={index} style={styles.courseItem}>
                  <View style={[styles.courseLine, { backgroundColor: course.color }]} />
                  <View style={styles.courseContent}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseCredits}>{course.credits}</Text>
                  </View>
                  <View style={styles.courseGrade}>
                    <Text style={styles.gradeText}>{course.grade}</Text>
                    <Text style={styles.gpaPointsText}>{course.gpaPoints}</Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {actionButtons.map((button, index) => (
                <TouchableOpacity key={index} style={styles.actionButton}>
                  <MaterialCommunityIcons 
                    name={button.icon as any} 
                    size={32} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.actionButtonText}>{button.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'Attendance' && (
          <Card style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>Attendance data will be displayed here</Text>
          </Card>
        )}

        {activeTab === 'Transcript' && (
          <Card style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>Transcript data will be displayed here</Text>
          </Card>
        )}
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
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
  },
  overviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: COLORS.header,
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.white,
  },
  overviewLabel: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  tab: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    paddingVertical: SPACING.base,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: FONTS.base,
    color: COLORS.grayDark,
    fontWeight: FONTS.medium as any,
  },
  activeTabText: {
    color: COLORS.black,
    fontWeight: FONTS.semibold as any,
  },
  contentContainer: {
    paddingHorizontal: SPACING.base,
  },
  gradesCard: {
    marginBottom: SPACING.lg,
  },
  gradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  gradesTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  gpaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  gpaIndicatorText: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium as any,
    marginLeft: SPACING.xs,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  courseLine: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: SPACING.base,
  },
  courseContent: {
    flex: 1,
  },
  courseName: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  courseCredits: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  courseGrade: {
    alignItems: 'flex-end',
  },
  gradeText: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
  },
  gpaPointsText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  placeholderCard: {
    marginHorizontal: SPACING.base,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONTS.base,
    color: COLORS.gray,
  },
});

export default AcademicScreen;
