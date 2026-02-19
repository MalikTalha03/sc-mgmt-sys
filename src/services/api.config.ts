// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/users/sign_in`,
  LOGOUT: `${API_BASE_URL}/users/sign_out`,
  REGISTER: `${API_BASE_URL}/users`,
  
  // Resources
  DEPARTMENTS: `${API_BASE_URL}/api/v1/departments`,
  STUDENTS: `${API_BASE_URL}/api/v1/students`,
  TEACHERS: `${API_BASE_URL}/api/v1/teachers`,
  COURSES: `${API_BASE_URL}/api/v1/courses`,
  ENROLLMENTS: `${API_BASE_URL}/api/v1/enrollments`,
  GRADES: `${API_BASE_URL}/api/v1/grades`,
  GRADE_ITEMS: `${API_BASE_URL}/api/v1/grade_items`,
};

// Token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};
