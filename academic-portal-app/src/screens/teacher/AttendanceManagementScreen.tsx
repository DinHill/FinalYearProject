import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { commonStyles } from '../../styles/commonStyles';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';
import Card from '../../components/common/Card';
import { api } from '../../services/api';

interface Section {
  id: number;
  course_code: string;
  course_name: string;
  section_code: string;
  enrolled_count: number;
}

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  enrollment_id: number;
}

interface AttendanceRecord {
  student_id: number;
  enrollment_id: number;
  status: 'present' | 'absent' | 'late';
}

const AttendanceManagementScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<number, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date());

  useEffect(() => {
    loadTeacherSections();
  }, []);

  const loadTeacherSections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/me/teaching-sections');
      if (response.success && response.data) {
        // Handle nested data structure
        const sectionsData = Array.isArray(response.data) 
          ? response.data 
          : ((response.data as any)?.data || []);
        setSections(sectionsData);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSectionStudents = async (section: Section) => {
    try {
      console.log('📚 Loading students for section:', section.id, section.course_code);
      // Call /api/v1/academic/sections/{id}/students
      const response = await api.get(`/api/v1/academic/sections/${section.id}/students`);
      console.log('📡 Students API response:', response);
      if (response.success && response.data) {
        const studentsData = Array.isArray(response.data) 
          ? response.data 
          : ((response.data as any)?.data || []);
        console.log('👥 Students loaded:', studentsData.length, studentsData);
        setStudents(studentsData);
        // Initialize attendance as all present
        const newAttendance = new Map<number, string>();
        studentsData.forEach((student: Student) => {
          newAttendance.set(student.id, 'present');
        });
        setAttendance(newAttendance);
      } else {
        console.error('❌ Failed to load students:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    loadSectionStudents(section);
  };

  const handleAttendanceToggle = (studentId: number) => {
    const newAttendance = new Map(attendance);
    const current = newAttendance.get(studentId) || 'present';
    
    // Cycle through: present -> late -> absent -> present
    let next: string;
    if (current === 'present') next = 'late';
    else if (current === 'late') next = 'absent';
    else next = 'present';
    
    newAttendance.set(studentId, next);
    setAttendance(newAttendance);
  };

  const handleMarkAll = (status: string) => {
    const newAttendance = new Map<number, string>();
    students.forEach(student => {
      newAttendance.set(student.id, status);
    });
    setAttendance(newAttendance);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSection) return;

    const attendanceRecords = students.map(student => ({
      student_id: student.id,
      status: attendance.get(student.id) || 'present',
      notes: null,
    }));

    setSubmitting(true);
    try {
      const response = await api.post('/api/v1/academic/attendance/bulk', {
        section_id: selectedSection.id,
        date: attendanceDate.toISOString().split('T')[0],
        records: attendanceRecords,
      });

      if (response.success) {
        Alert.alert('Success', 'Attendance submitted successfully');
        setSelectedSection(null);
        setStudents([]);
        setAttendance(new Map());
      } else {
        Alert.alert('Error', response.error || 'Failed to submit attendance');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeacherSections();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'late':
        return COLORS.warning;
      case 'absent':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle';
      case 'late':
        return 'clock-alert';
      case 'absent':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const attendanceStats = {
    present: Array.from(attendance.values()).filter(s => s === 'present').length,
    late: Array.from(attendance.values()).filter(s => s === 'late').length,
    absent: Array.from(attendance.values()).filter(s => s === 'absent').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedSection) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="clipboard-check" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>Attendance Management</Text>
          </View>
        </View>

        {/* Section List */}
        <View style={styles.content}>
            {sections.length === 0 ? (
              <Card style={styles.emptyCard}>
                <MaterialCommunityIcons name="school-outline" size={64} color={COLORS.gray} />
                <Text style={styles.emptyText}>No teaching sections</Text>
                <Text style={styles.emptySubtext}>You are not assigned to any sections this semester</Text>
              </Card>
            ) : (
              sections.map((section) => (
                <TouchableOpacity key={section.id} onPress={() => handleSectionSelect(section)}>
                  <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionCodeBadge}>
                        <Text style={styles.sectionCode}>{section.course_code}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
                    </View>
                    <Text style={styles.sectionName}>{section.course_name}</Text>
                    <View style={styles.sectionFooter}>
                      <Text style={styles.sectionInfo}>Section: {section.section_code}</Text>
                      <Text style={styles.sectionInfo}>{section.enrolled_count} students</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{selectedSection.course_code}</Text>
          <Text style={styles.headerSubtitle}>Section {selectedSection.section_code}</Text>
        </View>
      </View>

      {/* Attendance Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
          <Text style={styles.statValue}>{attendanceStats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
          <Text style={styles.statValue}>{attendanceStats.late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.error }]}>
          <Text style={styles.statValue}>{attendanceStats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: COLORS.success + '20' }]}
          onPress={() => handleMarkAll('present')}
        >
          <Text style={[styles.quickActionText, { color: COLORS.success }]}>Mark All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: COLORS.error + '20' }]}
          onPress={() => handleMarkAll('absent')}
        >
          <Text style={[styles.quickActionText, { color: COLORS.error }]}>Mark All Absent</Text>
        </TouchableOpacity>
      </View>

      {/* Student List */}
      <ScrollView style={styles.studentList}>
        {students.map((student) => {
          const status = attendance.get(student.id) || 'present';
          return (
            <TouchableOpacity
              key={student.id}
              onPress={() => handleAttendanceToggle(student.id)}
            >
              <Card style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <View style={styles.studentAvatar}>
                    <MaterialCommunityIcons name="account" size={24} color={COLORS.gray} />
                  </View>
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{student.full_name}</Text>
                    <Text style={styles.studentId}>{student.student_id}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                  <MaterialCommunityIcons
                    name={getStatusIcon(status)}
                    size={20}
                    color={COLORS.white}
                  />
                  <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitAttendance}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submit Attendance</Text>
            </>
          )}
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  backButton: {
    marginRight: SPACING.base,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS['2xl'],
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs / 2,
  },
  content: {
    padding: SPACING.lg,
  },
  sectionCard: {
    marginBottom: SPACING.base,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionCodeBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  sectionCode: {
    fontSize: FONTS.sm,
    fontWeight: '700' as any,
    color: COLORS.primary,
  },
  sectionName: {
    fontSize: FONTS.lg,
    fontWeight: '700' as any,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  sectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionInfo: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  emptyCard: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.lg,
    fontWeight: '600' as any,
    color: COLORS.black,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS['3xl'],
    fontWeight: '700' as any,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: FONTS.sm,
    fontWeight: '600' as any,
  },
  studentList: {
    flex: 1,
    paddingHorizontal: SPACING.base,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  studentId: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.base,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: FONTS.xs,
    fontWeight: '700' as any,
    color: COLORS.white,
  },
  submitContainer: {
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: '700' as any,
  },
});

export default AttendanceManagementScreen;
