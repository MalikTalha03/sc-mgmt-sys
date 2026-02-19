import { API_ENDPOINTS, getAuthHeaders, setAuthToken, removeAuthToken } from './api.config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: 'student' | 'teacher' | 'admin';
  };
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirmation: string;
  role: 'student' | 'teacher';
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ user: credentials }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Extract JWT token from Authorization header
    const authHeader = response.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      setAuthToken(token);
    } else {
      throw new Error('No authentication token received');
    }

    return data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } finally {
      removeAuthToken();
    }
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ user: userData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.join(', ') || 'Registration failed');
    }

    const data = await response.json();
    
    // Extract JWT token from Authorization header
    const authHeader = response.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      setAuthToken(token);
    } else {
      throw new Error('No authentication token received');
    }

    return data;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getCurrentUser(): LoginResponse['user'] | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: LoginResponse['user']): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  clearCurrentUser(): void {
    localStorage.removeItem('currentUser');
  }
}

export const authService = new AuthService();
