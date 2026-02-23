import { API_ENDPOINTS, apiFetch } from './api.config';
import type { Student } from './student.service';
import type { Course } from './course.service';

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'dropped' | 'withdrawn';

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  status: EnrollmentStatus;
  semester?: number;
  created_at: string;
  updated_at: string;
  student?: Student;
  course?: Course;
}

class EnrollmentService {
  async getAll(): Promise<Enrollment[]> {
    const response = await apiFetch(API_ENDPOINTS.ENROLLMENTS);

    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }

    return response.json();
  }

  async getById(id: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch enrollment');
    }

    return response.json();
  }

  // Student requests enrollment (creates pending enrollment)
  async requestEnrollment(courseId: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/request_enrollment`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to request enrollment');
    }

    return response.json();
  }

  // Admin creates enrollment directly (approved status)
  async create(data: Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>): Promise<Enrollment> {
    const response = await apiFetch(API_ENDPOINTS.ENROLLMENTS, {
      method: 'POST',
      body: JSON.stringify({ enrollment: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to create enrollment');
    }

    return response.json();
  }

  // Admin approves pending enrollment
  async approve(id: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}/approve`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to approve enrollment');
    }

    return response.json();
  }

  // Admin rejects pending enrollment
  async reject(id: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}/reject`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to reject enrollment');
    }

    return response.json();
  }

  // Admin marks enrollment as completed
  async complete(id: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}/complete`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to complete enrollment');
    }

    return response.json();
  }

  // Admin drops student from course
  async drop(id: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}/drop`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to drop enrollment');
    }

    return response.json();
  }

  // Student withdraws from enrollment
  async withdraw(id: number): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}/withdraw`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to withdraw from enrollment');
    }

    return response.json();
  }

  async update(id: number, data: Partial<Enrollment>): Promise<Enrollment> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enrollment: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to update enrollment');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await apiFetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete enrollment');
    }
  }

  async announceResults(): Promise<AnnounceResultsResponse> {
    const response = await apiFetch(API_ENDPOINTS.ANNOUNCE_RESULTS, {
      method: 'POST',
    });
    return response.json();
  }
}

export interface AnnounceResultsResponse {
  success: boolean;
  message: string;
  // success fields
  promoted_count?: number;
  completed_count?: number;
  // failure fields
  incomplete_courses?: { id: number; title: string; incomplete_count: number }[];
}

export const enrollmentService = new EnrollmentService();
