import { API_ENDPOINTS, getAuthHeaders } from './api.config';
import type { Department } from './department.service';

export interface User {
  id: number;
  email: string;
  name?: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface Student {
  id: number;
  user_id: number;
  department_id: number;
  semester: number;
  max_credit_hours?: number;
  max_credit_per_semester?: number;
  created_at: string;
  updated_at: string;
  user?: User;
  department?: Department;
}

class StudentService {
  async getAll(): Promise<Student[]> {
    const response = await fetch(API_ENDPOINTS.STUDENTS, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }

    return response.json();
  }

  async getById(id: number): Promise<Student> {
    const response = await fetch(`${API_ENDPOINTS.STUDENTS}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch student');
    }

    return response.json();
  }

  async getByUserId(userId: number): Promise<Student | null> {
    const students = await this.getAll();
    return students.find(s => s.user_id === userId) || null;
  }

  async create(data: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    const response = await fetch(API_ENDPOINTS.STUDENTS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ student: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Failed to create student');
    }

    return response.json();
  }

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const response = await fetch(`${API_ENDPOINTS.STUDENTS}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ student: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Failed to update student');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_ENDPOINTS.STUDENTS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete student');
    }
  }

  async promoteSemester(id: number): Promise<Student> {
    const response = await fetch(`${API_ENDPOINTS.STUDENTS}/${id}/promote_semester`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.join(', ') || 'Failed to promote student');
    }

    return response.json();
  }
}

export const studentService = new StudentService();
