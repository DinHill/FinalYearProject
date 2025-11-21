import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, RefreshControl } from 'react-native';
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
  current_grade?: number;
}

interface GradeEntry {
  enrollment_id: number;
  score: string;
  max_score: number;
  assessment_type: string;
  assessment_name: string;
  notes?: string;
}

const ASSESSMENT_TYPES = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Midterm Exam' },
  { value: 'final', label: 'Final Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'participation', label: 'Participation' },
];

const GradeEntryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Map<number, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  
  // Assessment configuration modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [assessmentType, setAssessmentType] = useState('quiz');
  const [assessmentName, setAssessmentName] = useState('');
  const [maxScore, setMaxScore] = useState('100');

  useEffect(() => {
    loadTeacherSections();
  }, []);

  const loadTeacherSections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/me/teaching-sections');
      if (response.success && response.data) {
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
      const response = await api.get(`/api/v1/academic/sections/${section.id}/students`);
      console.log('📡 Students API response:', response);
      if (response.success && response.data) {
        const studentsData = Array.isArray(response.data) 
          ? response.data 
          : ((response.data as any)?.data || []);
        console.log('👥 Students loaded:', studentsData.length, studentsData);
        setStudents(studentsData);
        // Initialize empty grades
        const newGrades = new Map<number, string>();
        studentsData.forEach((student: Student) => {
          newGrades.set(student.enrollment_id, '');
        });
        setGrades(newGrades);
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
    setShowConfigModal(true);
    loadSectionStudents(section);
  };

  const handleGradeChange = (enrollmentId: number, value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const newGrades = new Map(grades);
      newGrades.set(enrollmentId, value);
      setGrades(newGrades);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedSection) return;

    Alert.alert(
      'Submit for Review',
      'Submit all grades for this section to admin for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await api.submitGradesForReview(selectedSection.id);
              if (response.success) {
                Alert.alert('Success', 'Grades submitted for review successfully');
                setSelectedSection(null);
                setStudents([]);
                setGrades(new Map());
                setAssessmentName('');
              } else {
                Alert.alert('Error', response.error || 'Failed to submit for review');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit for review');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const validateGrades = (): boolean => {
    const max = parseFloat(maxScore);
    for (const [_, score] of grades) {
      if (score !== '') {
        const numScore = parseFloat(score);
        if (isNaN(numScore) || numScore < 0 || numScore > max) {
          Alert.alert('Invalid Grade', `All grades must be between 0 and ${max}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmitGrades = async () => {
    if (!selectedSection || !assessmentName.trim()) {
      Alert.alert('Error', 'Please configure assessment details');
      return;
    }

    if (!validateGrades()) return;

    const gradeEntries: GradeEntry[] = [];
    students.forEach(student => {
      const score = grades.get(student.enrollment_id);
      if (score && score.trim() !== '') {
        gradeEntries.push({
          enrollment_id: student.enrollment_id,
          score: score,
          max_score: parseFloat(maxScore),
          assessment_type: assessmentType,
          assessment_name: assessmentName,
        });
      }
    });

    if (gradeEntries.length === 0) {
      Alert.alert('No Grades', 'Please enter at least one grade');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      `Submit ${gradeEntries.length} grades for ${assessmentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await api.post('/api/v1/academic/grades/bulk', {
                section_id: selectedSection.id,
                grades: gradeEntries,
              });

              if (response.success) {
                Alert.alert(
                  'Success',
                  'Grades submitted successfully. You can now submit them for review.',
                  [
                    {
                      text: 'Submit for Review',
                      onPress: () => handleSubmitForReview(),
                    },
                    {
                      text: 'Done',
                      onPress: () => {
                        setSelectedSection(null);
                        setStudents([]);
                        setGrades(new Map());
                        setAssessmentName('');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', response.error || 'Failed to submit grades');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit grades');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeacherSections();
    setRefreshing(false);
  };

  const gradeStats = {
    entered: Array.from(grades.values()).filter(g => g !== '').length,
    total: students.length,
    average: (() => {
      const validGrades = Array.from(grades.values())
        .filter(g => g !== '')
        .map(g => parseFloat(g));
      if (validGrades.length === 0) return 0;
      return validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
    })(),
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
              <MaterialCommunityIcons name="file-document-edit" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>Grade Entry</Text>
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
      {/* Assessment Config Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment Details</Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Assessment Type</Text>
              <View style={styles.typeGrid}>
                {ASSESSMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      assessmentType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setAssessmentType(type.value)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        assessmentType === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Assessment Name</Text>
              <TextInput
                style={styles.input}
                value={assessmentName}
                onChangeText={setAssessmentName}
                placeholder="e.g., Quiz 1, Midterm Exam"
                placeholderTextColor={COLORS.gray}
              />

              <Text style={styles.inputLabel}>Maximum Score</Text>
              <TextInput
                style={styles.input}
                value={maxScore}
                onChangeText={setMaxScore}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray}
              />

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowConfigModal(false)}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{selectedSection.course_code}</Text>
          <Text style={styles.headerSubtitle}>
            {assessmentName || 'Configure assessment'} (Max: {maxScore})
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowConfigModal(true)}>
          <MaterialCommunityIcons name="cog" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Grade Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.statValue}>{gradeStats.entered}/{gradeStats.total}</Text>
          <Text style={styles.statLabel}>Entered</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.info }]}>
          <Text style={styles.statValue}>{gradeStats.average.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>

      {/* Student Grade List */}
      <ScrollView style={styles.studentList}>
        {students.map((student) => {
          const grade = grades.get(student.enrollment_id) || '';
          return (
            <Card key={student.enrollment_id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <MaterialCommunityIcons name="account" size={24} color={COLORS.gray} />
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{student.full_name}</Text>
                  <Text style={styles.studentId}>{student.student_id}</Text>
                </View>
              </View>
              <View style={styles.gradeInputContainer}>
                <TextInput
                  style={styles.gradeInput}
                  value={grade}
                  onChangeText={(value) => handleGradeChange(student.enrollment_id, value)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.gray}
                />
                <Text style={styles.maxScoreText}>/ {maxScore}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitGrades}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submit Grades</Text>
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
  gradeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.base,
    textAlign: 'center',
    width: 80,
    color: COLORS.black,
  },
  maxScoreText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.base,
    color: COLORS.gray,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  typeButton: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  typeButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600' as any,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: '700' as any,
  },
});

export default GradeEntryScreen;
