import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { api, GradeSummary, StudentDashboardStats } from '../../services/api';
import { commonStyles } from '../../styles/commonStyles';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';
import PDFViewer from '../../components/PDFViewer';

interface AttendanceRecord {
  id: number;
  enrollment_id: number;
  date: string;
  status: string;
  notes: string | null;
  course_name?: string;
  course_code?: string;
}

interface TranscriptSemester {
  semester_id: number;
  semester_name: string;
  start_date: string;
  end_date: string;
  courses: TranscriptCourse[];
  semester_credits: number;
  semester_gpa: number;
  cumulative_gpa: number;
}

interface TranscriptCourse {
  course_code: string;
  course_name: string;
  credits: number;
  grade: string;
  gpa_points: number;
  percentage: number;
  section_code: string;
}

interface TranscriptData {
  transcript: TranscriptSemester[];
  total_credits: number;
  cumulative_gpa: number;
}

const AcademicScreen = () => {
  const responsive = useResponsive();
  const [activeTab, setActiveTab] = useState('Grades');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<GradeSummary[]>([]);
  const [dashboardData, setDashboardData] = useState<StudentDashboardStats | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'Transcript' && !transcriptData) {
      loadTranscript();
    }
    if (activeTab === 'Materials' && materials.length === 0) {
      loadMaterials();
    }
  }, [activeTab]);

  const loadTranscript = async () => {
    setLoadingTranscript(true);
    try {
      const response = await api.getMyTranscript();
      if (response.success && response.data) {
        setTranscriptData(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load transcript:', err);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const loadMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const response = await api.getMyMaterials();
      if (response.success && response.data) {
        setMaterials(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleViewMaterial = (material: any) => {
    if (!material.file_url) {
      Alert.alert('Error', 'No file URL available for this material');
      return;
    }

    const isPdf = material.file_type?.toLowerCase().includes('pdf') || 
                  material.file_name?.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      // Open PDF in in-app viewer
      setSelectedPdf({
        url: material.file_url,
        name: material.file_name || material.title || 'Document'
      });
      setPdfViewerVisible(true);
    } else {
      // For non-PDF files, download/open externally
      handleDownloadMaterial(material);
    }
  };

  const handleDownloadMaterial = async (material: any) => {
    try {
      if (!material.file_url) {
        Alert.alert('Error', 'No download URL available for this material');
        return;
      }

      const supported = await Linking.canOpenURL(material.file_url);
      if (supported) {
        await Linking.openURL(material.file_url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${material.file_url}`);
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      Alert.alert('Error', 'Failed to download material');
    }
  };

  const handleClosePdfViewer = () => {
    setPdfViewerVisible(false);
    setSelectedPdf(null);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load grades using dedicated /me endpoint
      const gradesResponse = await api.getMyGradesFromMe();
      if (!gradesResponse.success) {
        throw new Error(gradesResponse.error || 'Failed to load grades');
      }
      setGrades(gradesResponse.data || []);

      // Load GPA using dedicated /me endpoint
      const gpaResponse = await api.getMyGPA();
      if (gpaResponse.success && gpaResponse.data) {
        // Set GPA in dashboard data format
        setDashboardData({
          ...dashboardData,
          current_gpa: gpaResponse.data.current_gpa || null,
          total_credits: gpaResponse.data.total_credits || 0,
        } as any);
      }

      // Load enrolled courses using /me endpoint
      const coursesResponse = await api.getMyEnrollments();
      if (coursesResponse.success && coursesResponse.data) {
        setEnrolledCourses(Array.isArray(coursesResponse.data) ? coursesResponse.data : coursesResponse.data.items || []);
      }

      // Load attendance records using dedicated /me endpoint
      const attendanceResponse = await api.getMyAttendance();
      if (attendanceResponse.success && attendanceResponse.data) {
        setAttendanceRecords(Array.isArray(attendanceResponse.data) ? attendanceResponse.data : attendanceResponse.data.items || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (index: number) => {
    const colors = [COLORS.secondary, COLORS.primary, COLORS.accent, COLORS.info, COLORS.warning];
    return colors[index % colors.length];
  };

  const calculateGradePercentage = (grade: GradeSummary): string => {
    if (!grade.grade_score || grade.max_score === 0) return 'N/A';
    return ((grade.grade_score / grade.max_score) * 100).toFixed(1) + '%';
  };

  const getSemesters = (): string[] => {
    const semesters = new Set<string>();
    grades.forEach(grade => {
      if (grade.semester) {
        semesters.add(grade.semester);
      }
    });
    return ['All', ...Array.from(semesters).sort()];
  };

  const getFilteredGrades = (): GradeSummary[] => {
    if (selectedSemester === 'All') {
      return grades;
    }
    return grades.filter(grade => grade.semester === selectedSemester);
  };

  const tabs = ['Grades', 'Attendance', 'Transcript', 'Materials'];

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={commonStyles.loadingText}>Loading grades...</Text>
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
          <TouchableOpacity style={commonStyles.primaryButton} onPress={loadData}>
            <Text style={commonStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const overviewData = {
    gpa: dashboardData?.current_gpa?.toFixed(2) || 'N/A',
    credits: dashboardData?.total_credits?.toString() || '0',
  };

  const actionButtons = [
    { icon: 'trophy', title: 'View Achievements' },
    { icon: 'target', title: 'Grade Calculator' },
  ];

  return (
    <SafeAreaView style={commonStyles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="school" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>Academic Overview</Text>
          </View>
        </View>

        {/* Overview Cards */}
        <View style={[commonStyles.overviewContainer, { marginTop: adaptiveSpacing.lg }]}>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewNumber, { fontSize: adaptiveFontSize.title }]}>{overviewData.gpa}</Text>
            <Text style={[styles.overviewLabel, { fontSize: adaptiveFontSize.small }]}>Current GPA</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewNumber, { fontSize: adaptiveFontSize.title }]}>{grades.length}</Text>
            <Text style={[styles.overviewLabel, { fontSize: adaptiveFontSize.small }]}>Courses</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewNumber, { fontSize: adaptiveFontSize.title }]}>{overviewData.credits}</Text>
            <Text style={[styles.overviewLabel, { fontSize: adaptiveFontSize.small }]}>Credits</Text>
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
              <Text 
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
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
                <Text style={styles.gradesTitle}>My Grades</Text>
                <View style={styles.gpaIndicator}>
                  <MaterialCommunityIcons name="trending-up" size={16} color={COLORS.success} />
                  <Text style={styles.gpaIndicatorText}>{overviewData.gpa} GPA</Text>
                </View>
              </View>

              {/* Semester Filter */}
              {getSemesters().length > 1 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.semesterFilter}
                >
                  {getSemesters().map((semester, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.semesterButton,
                        selectedSemester === semester && styles.semesterButtonActive,
                      ]}
                      onPress={() => setSelectedSemester(semester)}
                    >
                      <Text style={[
                        styles.semesterButtonText,
                        selectedSemester === semester && styles.semesterButtonTextActive,
                      ]}>
                        {semester}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {getFilteredGrades().length === 0 ? (
                <View style={styles.emptyGrades}>
                  <MaterialCommunityIcons name="school" size={48} color={COLORS.gray} />
                  <Text style={styles.emptyGradesText}>No grades available for this semester</Text>
                </View>
              ) : (
                getFilteredGrades().map((grade, index) => (
                  <View key={`${grade.course_code}-${index}`} style={styles.courseItem}>
                    <View style={[styles.courseLine, { backgroundColor: getGradeColor(index) }]} />
                    <View style={styles.courseContent}>
                      <Text style={styles.courseName}>{grade.course_name}</Text>
                      <Text style={styles.courseCredits}>
                        {grade.section_code} • {grade.semester || 'Current Semester'}
                      </Text>
                    </View>
                    <View style={styles.courseGrade}>
                      <Text style={styles.gradeText}>{grade.grade_letter || calculateGradePercentage(grade)}</Text>
                      <Text style={[
                        styles.statusText,
                        grade.status === 'approved' && styles.statusApproved,
                        grade.status === 'pending' && styles.statusPending,
                      ]}>
                        {grade.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
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
          <View style={styles.contentContainer}>
            {attendanceRecords.length === 0 ? (
              <Card style={styles.placeholderCard}>
                <MaterialCommunityIcons name="calendar-check" size={48} color={COLORS.gray} />
                <Text style={styles.placeholderText}>No attendance records yet</Text>
              </Card>
            ) : (
              <Card style={styles.attendanceCard}>
                <Text style={styles.sectionTitle}>Attendance Summary</Text>
                {enrolledCourses.map((course, index) => {
                  const courseAttendance = attendanceRecords.filter(
                    (att: any) => att.enrollment_id === course.enrollment_id
                  );
                  const presentCount = courseAttendance.filter((att: any) => att.status === 'present').length;
                  const totalCount = courseAttendance.length;
                  const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0';
                  
                  return (
                    <View key={index} style={styles.attendanceItem}>
                      <View style={styles.attendanceHeader}>
                        <Text style={styles.attendanceCourse}>{course.course_name}</Text>
                        <Text style={[styles.attendancePercentage, { color: parseFloat(percentage) >= 75 ? COLORS.success : COLORS.error }]}>
                          {percentage}%
                        </Text>
                      </View>
                      <View style={styles.attendanceStats}>
                        <Text style={styles.attendanceStat}>
                          Present: {presentCount} | Total: {totalCount}
                        </Text>
                      </View>
                      <View style={styles.attendanceProgress}>
                        <View style={[styles.attendanceProgressBar, { width: `${percentage}%`, backgroundColor: parseFloat(percentage) >= 75 ? COLORS.success : COLORS.error }]} />
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}
          </View>
        )}

        {activeTab === 'Transcript' && (
          <View style={styles.contentContainer}>
            {loadingTranscript ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading transcript...</Text>
              </Card>
            ) : transcriptData ? (
              <>
                <Card style={styles.transcriptCard}>
                  <Text style={styles.sectionTitle}>Academic Transcript</Text>
                  <View style={styles.transcriptSummary}>
                    <View style={styles.transcriptSummaryItem}>
                      <Text style={styles.transcriptLabel}>Cumulative GPA</Text>
                      <Text style={styles.transcriptValue}>{transcriptData.cumulative_gpa?.toFixed(2) || 'N/A'}</Text>
                    </View>
                    <View style={styles.transcriptSummaryItem}>
                      <Text style={styles.transcriptLabel}>Total Credits</Text>
                      <Text style={styles.transcriptValue}>{transcriptData.total_credits || 0}</Text>
                    </View>
                    <View style={styles.transcriptSummaryItem}>
                      <Text style={styles.transcriptLabel}>Semesters</Text>
                      <Text style={styles.transcriptValue}>{transcriptData.transcript?.length || 0}</Text>
                    </View>
                  </View>
                </Card>

                {transcriptData.transcript?.map((semester, semesterIndex) => (
                  <Card key={semester.semester_id} style={[styles.transcriptCard, { marginTop: SPACING.md }]}>
                    <View style={styles.semesterHeader}>
                      <View>
                        <Text style={styles.semesterName}>{semester.semester_name}</Text>
                        <Text style={styles.semesterDates}>
                          {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.semesterStats}>
                        <Text style={styles.semesterGPA}>GPA: {semester.semester_gpa?.toFixed(2) || 'N/A'}</Text>
                        <Text style={styles.semesterCredits}>{semester.semester_credits || 0} credits</Text>
                      </View>
                    </View>

                    {semester.courses.map((course, courseIndex) => (
                      <View key={`${semester.semester_id}-${course.course_code}-${courseIndex}`} style={styles.transcriptCourseItem}>
                        <View style={styles.transcriptCourseInfo}>
                          <Text style={styles.transcriptCourseName}>{course.course_name}</Text>
                          <Text style={styles.transcriptCourseCode}>
                            {course.course_code} • Section {course.section_code} • {course.credits} credits
                          </Text>
                          <Text style={styles.transcriptPercentage}>{course.percentage}%</Text>
                        </View>
                        <View style={styles.transcriptGradeInfo}>
                          <Text style={[styles.transcriptGrade, { color: (course.gpa_points || 0) >= 3.0 ? COLORS.success : (course.gpa_points || 0) >= 2.0 ? COLORS.warning : COLORS.error }]}>
                            {course.grade || 'N/A'}
                          </Text>
                          <Text style={styles.transcriptGPA}>{course.gpa_points?.toFixed(1) || '0.0'} pts</Text>
                        </View>
                      </View>
                    ))}

                    <View style={styles.semesterFooter}>
                      <Text style={styles.semesterFooterText}>Cumulative GPA: {semester.cumulative_gpa?.toFixed(2) || 'N/A'}</Text>
                    </View>
                  </Card>
                ))}
              </>
            ) : (
              <Card style={styles.placeholderCard}>
                <MaterialCommunityIcons name="file-document" size={48} color={COLORS.gray} />
                <Text style={styles.placeholderText}>No transcript data available</Text>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'Materials' && (
          <View style={styles.contentContainer}>
            {loadingMaterials ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading materials...</Text>
              </Card>
            ) : materials.length > 0 ? (
              materials.map((material) => (
                <Card key={material.id} style={[commonStyles.card, { marginBottom: SPACING.md }]}>
                  <View style={styles.materialItem}>
                    <View style={styles.materialIcon}>
                      <MaterialCommunityIcons 
                        name={
                          material.file_type?.includes('pdf') ? 'file-pdf-box' :
                          material.file_type?.includes('doc') ? 'file-word-box' :
                          material.file_type?.includes('ppt') ? 'file-powerpoint-box' :
                          material.file_type?.includes('xls') ? 'file-excel-box' :
                          'file-document'
                        } 
                        size={32} 
                        color={COLORS.primary} 
                      />
                    </View>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialTitle}>{material.title}</Text>
                      {material.course_name && (
                        <Text style={styles.materialCourse}>
                          {material.course_code} - {material.course_name}
                        </Text>
                      )}
                      {material.description && (
                        <Text style={styles.materialDescription} numberOfLines={2}>
                          {material.description}
                        </Text>
                      )}
                      <View style={styles.materialMeta}>
                        <Text style={styles.materialMetaText}>
                          {material.file_size ? `${(material.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                        </Text>
                        <Text style={styles.materialMetaText}> • </Text>
                        <Text style={styles.materialMetaText}>
                          {material.uploaded_at ? new Date(material.uploaded_at).toLocaleDateString() : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => handleViewMaterial(material)}
                    >
                      <MaterialCommunityIcons 
                        name={material.file_type?.includes('pdf') ? "eye" : "download"} 
                        size={24} 
                        color={COLORS.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            ) : (
              <Card style={styles.placeholderCard}>
                <MaterialCommunityIcons name="folder-open" size={48} color={COLORS.gray} />
                <Text style={styles.placeholderText}>No course materials available</Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PDFViewer
          visible={pdfViewerVisible}
          fileUrl={selectedPdf.url}
          fileName={selectedPdf.name}
          onClose={handleClosePdfViewer}
          onDownload={() => {
            if (selectedPdf) {
              handleDownloadMaterial({ file_url: selectedPdf.url });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
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
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
    fontWeight: FONTS.medium as any,
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: FONTS.bold as any,
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
  semesterFilter: {
    marginBottom: SPACING.base,
  },
  semesterButton: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: COLORS.grayLight,
    marginRight: SPACING.sm,
  },
  semesterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  semesterButtonText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    fontWeight: FONTS.medium as any,
  },
  semesterButtonTextActive: {
    color: COLORS.white,
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
  statusText: {
    fontSize: FONTS.xs,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statusApproved: {
    color: COLORS.success,
  },
  statusPending: {
    color: COLORS.warning,
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
  loadingCard: {
    padding: SPACING.xl,
    alignItems: 'center',
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
  emptyGrades: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyGradesText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.gray,
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
  attendanceCard: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  attendanceItem: {
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray + '30',
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  attendanceCourse: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    flex: 1,
  },
  attendancePercentage: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold as any,
  },
  attendanceStats: {
    marginBottom: SPACING.sm,
  },
  attendanceStat: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  attendanceProgress: {
    height: 6,
    backgroundColor: COLORS.gray + '20',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  attendanceProgressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  transcriptCard: {
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  transcriptSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray + '30',
  },
  transcriptSummaryItem: {
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  transcriptValue: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
  },
  transcriptCourseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray + '20',
  },
  transcriptCourseInfo: {
    flex: 1,
  },
  transcriptCourseName: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  transcriptCourseCode: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  transcriptSemester: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  transcriptGradeInfo: {
    alignItems: 'flex-end',
  },
  transcriptGrade: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  transcriptStatus: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    textTransform: 'capitalize' as any,
  },
  transcriptStatusApproved: {
    color: COLORS.success,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  semesterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary + '30',
  },
  semesterName: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  semesterDates: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  semesterStats: {
    alignItems: 'flex-end',
  },
  semesterGPA: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  semesterCredits: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  transcriptPercentage: {
    fontSize: FONTS.sm,
    color: COLORS.info,
  },
  transcriptGPA: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  semesterFooter: {
    marginTop: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray + '20',
    alignItems: 'flex-end',
  },
  semesterFooterText: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.primary,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialIcon: {
    marginRight: SPACING.base,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  materialCourse: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  materialDescription: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialMetaText: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
  },
  viewButton: {
    padding: SPACING.sm,
  },
});

export default AcademicScreen;
