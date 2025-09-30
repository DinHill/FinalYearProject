import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';

const ProfileScreen = () => {
  const academicInfo = [
    {
      icon: 'school',
      title: 'Program',
      value: 'Computer Science BSc',
      color: COLORS.primary,
    },
    {
      icon: 'calendar',
      title: 'Year of Study',
      value: '3rd Year',
      color: COLORS.secondary,
    },
    {
      icon: 'account-check',
      title: 'Academic Status',
      value: 'Good Standing',
      color: COLORS.info,
    },
    {
      icon: 'book-open',
      title: 'Credits Completed',
      value: '85/120',
      color: COLORS.accent,
    },
  ];

  const personalInfo = [
    {
      icon: 'email',
      title: 'Email',
      value: 'student@greenwich.edu',
      color: COLORS.primary,
    },
    {
      icon: 'phone',
      title: 'Phone',
      value: '+44 20 1234 5678',
      color: COLORS.secondary,
    },
    {
      icon: 'map-marker',
      title: 'Address',
      value: 'London, UK',
      color: COLORS.warning,
    },
    {
      icon: 'calendar',
      title: 'Date of Birth',
      value: '15 March 2002',
      color: COLORS.accent,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <MaterialCommunityIcons name="image" size={32} color={COLORS.gray} />
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check" size={12} color={COLORS.white} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>Student 033</Text>
            <Text style={styles.studentId}>ID: HieuNDGCD220033</Text>
            <View style={styles.statusTags}>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>Active Student</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: COLORS.secondary }]}>
                <Text style={styles.statusTagText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Academic Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          
          {academicInfo.map((item, index) => (
            <View key={index} style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {personalInfo.map((item, index) => (
            <View key={index} style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Additional Info Placeholder */}
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>Scroll for more information...</Text>
        </View>
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
  editButton: {
    padding: SPACING.xs,
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: SPACING.base,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    color: COLORS.white,
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    marginBottom: SPACING.xs,
  },
  studentId: {
    color: COLORS.white,
    fontSize: FONTS.base,
    marginBottom: SPACING.sm,
  },
  statusTags: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusTag: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusTagText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
  },
  infoCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONTS.base,
    color: COLORS.black,
    fontWeight: FONTS.medium as any,
  },
  additionalInfo: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  additionalInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
