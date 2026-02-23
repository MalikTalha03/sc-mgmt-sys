import { API_ENDPOINTS, apiFetch } from './api.config';

export type GradeCategory = 'assignment' | 'quiz' | 'midterm' | 'final';

export interface Grade {
  id: number;
  student_id: number;
  course_id: number;
  created_at: string;
  updated_at: string;
}

export interface GradeItem {
  id: number;
  grade_id: number;
  category: GradeCategory;
  max_marks: number;
  obtained_marks: number;
  created_at: string;
  updated_at: string;
}

class GradeService {
  async getAll(): Promise<Grade[]> {
    const response = await apiFetch(API_ENDPOINTS.GRADES);

    if (!response.ok) {
      throw new Error('Failed to fetch grades');
    }

    return response.json();
  }

  async getById(id: number): Promise<Grade> {
    const response = await apiFetch(`${API_ENDPOINTS.GRADES}/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch grade');
    }

    return response.json();
  }

  async create(data: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade> {
    const response = await apiFetch(API_ENDPOINTS.GRADES, {
      method: 'POST',
      body: JSON.stringify({ grade: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to create grade');
    }

    return response.json();
  }

  async delete(id: number): Promise<void> {
    const response = await apiFetch(`${API_ENDPOINTS.GRADES}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete grade');
    }
  }

  // Grade Items
  async getAllGradeItems(): Promise<GradeItem[]> {
    const response = await apiFetch(API_ENDPOINTS.GRADE_ITEMS);

    if (!response.ok) {
      throw new Error('Failed to fetch grade items');
    }

    return response.json();
  }

  async getGradeItemById(id: number): Promise<GradeItem> {
    const response = await apiFetch(`${API_ENDPOINTS.GRADE_ITEMS}/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch grade item');
    }

    return response.json();
  }

  async createGradeItem(data: Omit<GradeItem, 'id' | 'created_at' | 'updated_at'>): Promise<GradeItem> {
    const response = await apiFetch(API_ENDPOINTS.GRADE_ITEMS, {
      method: 'POST',
      body: JSON.stringify({ grade_item: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to create grade item');
    }

    return response.json();
  }

  async updateGradeItem(id: number, data: Partial<GradeItem>): Promise<GradeItem> {
    const response = await apiFetch(`${API_ENDPOINTS.GRADE_ITEMS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ grade_item: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || error.error || 'Failed to update grade item');
    }

    return response.json();
  }

  async deleteGradeItem(id: number): Promise<void> {
    const response = await apiFetch(`${API_ENDPOINTS.GRADE_ITEMS}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete grade item');
    }
  }
}

export const gradeService = new GradeService();
