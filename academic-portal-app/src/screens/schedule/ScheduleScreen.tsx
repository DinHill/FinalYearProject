import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';

const ScheduleScreen = () => {
  const [selectedDay, setSelectedDay] = useState(0);

  const days = [
    { name: 'Mon', date: '11 Aug' },
    { name: 'Tue', date: '12 Aug' },
    { name: 'Wed', date: '13 Aug' },
    { name: 'Thu', date: '14 Aug' },
    { name: 'Fri', date: '15 Aug' },
  ];

  const classes = [
    {
      name: 'Mathematics',
      time: '09:00-10:30',
      location: 'Room 101',
      instructor: 'Dr. Smith',
      color: COLORS.primary,
      status: 'Active',
    },
    {
      name: 'Computer Science',
      time: '14:00-15:30',
      location: 'Lab 205',
      instructor: 'Prof. Johnson',
      color: COLORS.secondary,
      status: 'Active',
    },
  ];

  const quickActions = [
    { icon: 'clock', title: 'View Full Week Schedule' },
    { icon: 'map-marker', title: 'Campus Map & Room Finder' },
    { icon: 'account', title: 'Contact Instructors' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Timetable</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.navButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day Navigation */}
        <View style={styles.dayNavigation}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.dayButtonSelected,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.dayName,
                selectedDay === index && styles.dayNameSelected,
              ]}>
                {day.name}
              </Text>
              <Text style={[
                styles.dayDate,
                selectedDay === index && styles.dayDateSelected,
              ]}>
                {day.date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Classes for Selected Day */}
        <Card style={styles.classesCard}>
          <Text style={styles.classesTitle}>Classes for {days[selectedDay].name}</Text>
          
          {classes.map((classItem, index) => (
            <View key={index} style={styles.classItem}>
              <View style={[styles.classLine, { backgroundColor: classItem.color }]} />
              <View style={styles.classContent}>
                <Text style={styles.className}>{classItem.name}</Text>
                <View style={styles.classInfo}>
                  <View style={styles.classInfoRow}>
                    <MaterialCommunityIcons name="clock" size={16} color={COLORS.gray} />
                    <Text style={styles.classInfoText}>{classItem.time}</Text>
                  </View>
                  <View style={styles.classInfoRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.gray} />
                    <Text style={styles.classInfoText}>{classItem.location}</Text>
                  </View>
                  <View style={styles.classInfoRow}>
                    <MaterialCommunityIcons name="account" size={16} color={COLORS.gray} />
                    <Text style={styles.classInfoText}>{classItem.instructor}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusButton, { backgroundColor: classItem.color }]}>
                <Text style={styles.statusText}>{classItem.status}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          
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
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
  },
  headerActions: {
    flexDirection: 'row',
  },
  navButton: {
    marginLeft: SPACING.sm,
  },
  dayNavigation: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  dayButton: {
    flex: 1,
    backgroundColor: COLORS.header,
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.white,
  },
  dayName: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold as any,
  },
  dayNameSelected: {
    color: COLORS.primary,
  },
  dayDate: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    marginTop: 2,
  },
  dayDateSelected: {
    color: COLORS.primary,
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

export default ScheduleScreen;
