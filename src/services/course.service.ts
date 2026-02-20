import { API_ENDPOINTS, getAuthHeaders } from './api.config';
import type { Department } from './department.service';
import type { Teacher } from './teacher.service';

export interface Course {
  id: number;
  title: string;
  credit_hours: number;
  department_id: number;
  teacher_id: number;
  created_at: string;
  updated_at: string;
  department?: Department;
  teacher?: Teacher;
}

class CourseService {
  async getAll(): Promise<Course[]> {
    const response = await fetch(API_ENDPOINTS.COURSES, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }

    return response.json();
  }

  async getById(id: number): Promise<Course> {
    const response = await fetch(`${API_ENDPOINTS.COURSES}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch course');
    }

    return response.json();
  }

  async create(data: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const response = await fetch(API_ENDPOINTS.COURSES, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to create course');
    }

    return response.json();
  }

  async update(id: number, data: Partial<Course>): Promise<Course> {
    const response = await fetch(`${API_ENDPOINTS.COURSES}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to update course');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_ENDPOINTS.COURSES}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete course');
    }
  }
}

export const courseService = new CourseService();
