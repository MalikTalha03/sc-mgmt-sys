import { API_ENDPOINTS, apiFetch } from './api.config';

export interface Department {
  id: number;
  name: string;
  code: string;
  isActive?: boolean;
  courses_count?: number;
  teachers_count?: number;
  students_count?: number;
  created_at: string;
  updated_at: string;
}

class DepartmentService {
  async getAll(): Promise<Department[]> {
    const response = await apiFetch(API_ENDPOINTS.DEPARTMENTS);

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    return response.json();
  }

  async getById(id: number): Promise<Department> {
    const response = await apiFetch(`${API_ENDPOINTS.DEPARTMENTS}/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch department');
    }

    return response.json();
  }

  async create(data: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const response = await apiFetch(API_ENDPOINTS.DEPARTMENTS, {
      method: 'POST',
      body: JSON.stringify({ department: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Failed to create department');
    }

    return response.json();
  }

  async update(id: number, data: Partial<Department>): Promise<Department> {
    const response = await apiFetch(`${API_ENDPOINTS.DEPARTMENTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ department: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Failed to update department');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await apiFetch(`${API_ENDPOINTS.DEPARTMENTS}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete department');
    }
  }
}

export const departmentService = new DepartmentService();
