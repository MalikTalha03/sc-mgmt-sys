import { API_ENDPOINTS, getAuthHeaders } from './api.config';

export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
}

class EnrollmentService {
  async getAll(): Promise<Enrollment[]> {
    const response = await fetch(API_ENDPOINTS.ENROLLMENTS, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }

    return response.json();
  }

  async getById(id: number): Promise<Enrollment> {
    const response = await fetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch enrollment');
    }

    return response.json();
  }

  async create(data: Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>): Promise<Enrollment> {
    const response = await fetch(API_ENDPOINTS.ENROLLMENTS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enrollment: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to create enrollment');
    }

    return response.json();
  }

  async update(id: number, data: Partial<Enrollment>): Promise<Enrollment> {
    const response = await fetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enrollment: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to update enrollment');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_ENDPOINTS.ENROLLMENTS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete enrollment');
    }
  }
}

export const enrollmentService = new EnrollmentService();
