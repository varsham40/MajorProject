import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'ADMIN';
  entity_id?: string;
  must_change_password?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setMustChangePassword: (val: boolean) => void;
}

const savedToken = localStorage.getItem('access_token');
const savedUser = localStorage.getItem('user_data');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticated: !!savedToken,

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setMustChangePassword: (val: boolean) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, must_change_password: val };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
