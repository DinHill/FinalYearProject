import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🌐 API Base URL configured:', API_BASE_URL);

// Token management
let authToken: string | null = null;

export const setAuthToken = async (token: string) => {
  authToken = token;
  await AsyncStorage.setItem('auth_token', token);
};

export const getAuthToken = async (): Promise<string | null> => {
  if (authToken) return authToken;
  const stored = await AsyncStorage.getItem('auth_token');
  if (stored) authToken = stored;
  return stored;
};

export const clearAuthToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem('auth_token');
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { message: 'No response body' };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network request failed',
      };
    }
  }

  // ============================================================================
  // Generic HTTP Methods
  // ============================================================================
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // Authentication
  // ============================================================================
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request<{ token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // ============================================================================
  // Student Portal APIs
  // ============================================================================
  async getStudentDashboard(): Promise<ApiResponse<StudentDashboardStats>> {
    return this.request<StudentDashboardStats>('/api/v1/student-portal/dashboard');
  }

  async getMyCourses(status?: string): Promise<ApiResponse<EnrolledCourseInfo[]>> {
    const params = status ? `?status=${status}` : '';
    return this.request<EnrolledCourseInfo[]>(`/api/v1/student-portal/my-courses${params}`);
  }

  async getCourseDetails(courseId: number): Promise<ApiResponse<CourseDetailInfo>> {
    return this.request<CourseDetailInfo>(`/api/v1/student-portal/course/${courseId}`);
  }

  async getMyGrades(semester?: string): Promise<ApiResponse<GradeSummary[]>> {
    const params = semester ? `?semester=${semester}` : '';
    return this.request<GradeSummary[]>(`/api/v1/student-portal/grades${params}`);
  }

  async getUpcomingClasses(days: number = 7): Promise<ApiResponse<UpcomingClass[]>> {
    return this.request<UpcomingClass[]>(`/api/v1/student-portal/upcoming-classes?days=${days}`);
  }

  // ============================================================================
  // Teacher APIs (Academic Management)
  // ============================================================================
  async getSections(page: number = 1, limit: number = 100): Promise<ApiResponse<PaginatedResponse<Section>>> {
    return this.request<PaginatedResponse<Section>>(`/api/v1/academic/sections?page=${page}&limit=${limit}`);
  }

  async getSectionGrades(sectionId: number): Promise<ApiResponse<Grade[]>> {
    return this.request<Grade[]>(`/api/v1/academic/sections/${sectionId}/grades`);
  }

  async createGrade(data: CreateGradeRequest): Promise<ApiResponse<Grade>> {
    return this.request<Grade>('/api/v1/academic/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGrade(gradeId: number, data: UpdateGradeRequest): Promise<ApiResponse<Grade>> {
    return this.request<Grade>(`/api/v1/academic/grades/${gradeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAttendance(sectionId?: number, studentId?: number): Promise<ApiResponse<PaginatedResponse<Attendance>>> {
    const params = new URLSearchParams();
    if (sectionId) params.append('section_id', sectionId.toString());
    if (studentId) params.append('student_id', studentId.toString());
    return this.request<PaginatedResponse<Attendance>>(`/api/v1/academic/attendance?${params.toString()}`);
  }

  async createAttendance(data: CreateAttendanceRequest): Promise<ApiResponse<Attendance>> {
    return this.request<Attendance>('/api/v1/academic/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // User Profile
  // ============================================================================
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/v1/me/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/v1/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // My Data APIs (Dedicated /me endpoints)
  // ============================================================================
  async getMyEnrollments(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/me/enrollments');
  }

  async getMyGradesFromMe(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/me/grades');
  }

  async getMyAttendance(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/me/attendance');
  }

  async getMyInvoices(status?: string): Promise<ApiResponse<any>> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/v1/me/invoices${params}`);
  }

  async getMyDocuments(status?: string): Promise<ApiResponse<any>> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/v1/me/documents${params}`);
  }

  async getMyGPA(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/me/gpa');
  }

  async getMySchedule(days?: number): Promise<ApiResponse<any>> {
    const params = days ? `?days=${days}` : '';
    return this.request(`/api/v1/me/schedule${params}`);
  }

  async getMyTranscript(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/me/transcript');
  }

  async getMyMaterials(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/me/materials');
  }

  // ============================================================================
  // Grade Workflow APIs (Teacher)
  // ============================================================================
  async submitGradesForReview(sectionId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/grades/submit/${sectionId}`, {
      method: 'POST',
    });
  }

  async markGradesUnderReview(sectionId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/grades/review/${sectionId}`, {
      method: 'POST',
    });
  }

  async approveGrades(sectionId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/grades/approve/${sectionId}`, {
      method: 'POST',
    });
  }

  async rejectGrades(sectionId: number, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/grades/reject/${sectionId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async publishGrades(sectionId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/grades/publish/${sectionId}`, {
      method: 'POST',
    });
  }

  async getGradesSummary(sectionId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/grades/summary/${sectionId}`);
  }

  // ============================================================================
  // Finance APIs
  // ============================================================================
  async getStudentFinancialSummary(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/finance/students/my/summary');
  }

  async getStudentInvoices(page: number = 1, pageSize: number = 20): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/finance/invoices?page=${page}&page_size=${pageSize}`);
  }

  async getInvoiceDetail(invoiceId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/finance/invoices/${invoiceId}`);
  }

  // ============================================================================
  // Announcements APIs
  // ============================================================================
  async getAnnouncements(page: number = 1, pageSize: number = 20): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/announcements?page=${page}&page_size=${pageSize}`);
  }

  async getAnnouncementDetail(announcementId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/announcements/${announcementId}`);
  }

  // ============================================================================
  // Course & Enrollment APIs
  // ============================================================================
  async getCourses(page: number = 1, pageSize: number = 50, search?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (search) params.append('search', search);
    return this.request(`/api/v1/academic/courses?${params.toString()}`);
  }

  async enrollInCourse(sectionId: number): Promise<ApiResponse<any>> {
    return this.request('/api/v1/academic/enrollments', {
      method: 'POST',
      body: JSON.stringify({ section_id: sectionId }),
    });
  }

  async dropCourse(enrollmentId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/academic/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // Document Request APIs
  // ============================================================================
  async getDocumentRequests(page: number = 1, pageSize: number = 20): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/documents/requests?page=${page}&page_size=${pageSize}`);
  }

  async createDocumentRequest(data: { document_type: string; purpose: string; notes?: string }): Promise<ApiResponse<any>> {
    return this.request('/api/v1/documents/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // Support Tickets APIs
  // ============================================================================
  async createSupportTicket(data: { subject: string; message: string; category: string }): Promise<ApiResponse<any>> {
    return this.request('/api/v1/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: data.subject,
        description: data.message,
        category: data.category,
        priority: 'medium'
      }),
    });
  }
}

// Type definitions
export interface User {
  id: number;
  firebase_uid: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  phone_number?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  campus_id?: number;
  major_id?: number;
  year_entered?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentDashboardStats {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  pending_enrollments: number;
  current_gpa: number | null;
  total_credits: number;
}

export interface EnrolledCourseInfo {
  enrollment_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  course_credits: number;
  section_id: number;
  section_code: string;
  teacher_name: string | null;
  enrollment_status: string;
  current_grade: number | null;
  grade_score?: number | null;
  attendance_rate?: number | null;
  schedule_summary: string;
}

export interface CourseDetailInfo {
  enrollment_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  course_description: string | null;
  credits: number;
  section_id: number;
  section_code: string;
  instructor_name: string | null;
  enrollment_status: string;
  grade_score: number | null;
  grade_letter: string | null;
  total_classes: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number | null;
  schedules: any[];
  materials: any[];
}

export interface GradeSummary {
  course_code: string;
  course_name: string;
  section_code: string;
  grade_score?: number | null;
  max_score: number;
  grade_letter?: string | null;
  status: string;
  semester?: string | null;
  academic_year?: string | null;
}

export interface UpcomingClass {
  enrollment_id: number;
  schedule_id: number;
  course_code: string;
  course_name: string;
  section_code: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_name: string | null;
  building_name: string | null;
  next_occurrence: string;
}

export interface Section {
  id: number;
  course_id: number;
  semester_id: number;
  section_code: string;
  instructor_id: number | null;
  room: string | null;
  max_students: number;
  enrolled_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: number;
  enrollment_id: number;
  assignment_name: string;
  grade_value: number;
  max_grade: number;
  weight: number | null;
  graded_at: string | null;
  graded_by: number | null;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  enrollment_id: number;
  date: string;
  status: string;
  notes: string | null;
  marked_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGradeRequest {
  enrollment_id: number;
  assignment_name: string;
  grade_value: number;
  max_grade: number;
  weight?: number;
}

export interface UpdateGradeRequest {
  grade_value?: number;
  max_grade?: number;
  weight?: number;
  approval_status?: string;
}

export interface CreateAttendanceRequest {
  enrollment_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
