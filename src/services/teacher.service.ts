import { API_ENDPOINTS, apiFetch } from './api.config';
import type { Department } from './department.service';
import type { User } from './student.service';

export type TeacherDesignation = 'visiting_faculty' | 'lecturer' | 'assistant_professor' | 'associate_professor' | 'professor';

export interface Teacher {
  id: number;
  user_id: number;
  department_id: number;
  designation: TeacherDesignation;
  created_at: string;
  updated_at: string;
  user?: User;
  department?: Department;
}

class TeacherService {
  async getAll(): Promise<Teacher[]> {
    const response = await apiFetch(API_ENDPOINTS.TEACHERS);

    if (!response.ok) {
      throw new Error('Failed to fetch teachers');
    }

    return response.json();
  }

  async getById(id: number): Promise<Teacher> {
    const response = await apiFetch(`${API_ENDPOINTS.TEACHERS}/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch teacher');
    }

    return response.json();
  }

  async getByUserId(userId: number): Promise<Teacher | null> {
    const teachers = await this.getAll();
    return teachers.find(t => t.user_id === userId) || null;
  }

  async create(data: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>): Promise<Teacher> {
    const response = await apiFetch(API_ENDPOINTS.TEACHERS, {
      method: 'POST',
      body: JSON.stringify({ teacher: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Failed to create teacher');
    }

    return response.json();
  }

  async update(id: number, data: Partial<Teacher>): Promise<Teacher> {
    const response = await apiFetch(`${API_ENDPOINTS.TEACHERS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ teacher: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Failed to update teacher');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await apiFetch(`${API_ENDPOINTS.TEACHERS}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete teacher');
    }
  }
}

export const teacherService = new TeacherService();
