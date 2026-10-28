import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/api';

export const DEMO_USERS: Record<UserRole, User> = {
  STUDENT: {
    id: 'usr_std_001',
    email: 'aarav_raj@srmap.edu.in',
    full_name: 'Aarav Raj',
    role: 'STUDENT',
    ap_number: 'AP22110010045',
    department: 'Computer Science & Engineering',
    batch: '2022-2026',
    is_active: true,
    created_at: '2026-08-01T00:00:00Z',
  },
  STAFF: {
    id: 'usr_stf_002',
    email: 'rajesh_trainer@srmap.edu.in',
    full_name: 'Coach Rajesh Kumar',
    role: 'STAFF',
    department: 'Department of Physical Education',
    is_active: true,
    created_at: '2025-06-15T00:00:00Z',
  },
  TRAINER: {
    id: 'usr_trn_005',
    email: 'ananya_trainer@srmap.edu.in',
    full_name: 'Ananya Verma',
    role: 'TRAINER',
    department: 'Central Fitness Center',
    is_active: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  ADMIN: {
    id: 'usr_adm_003',
    email: 'sports_admin@srmap.edu.in',
    full_name: 'Dr. K. Sharma',
    role: 'ADMIN',
    department: 'Sports Council Administration',
    is_active: true,
    created_at: '2024-01-10T00:00:00Z',
  },
  SUPER_ADMIN: {
    id: 'usr_sad_004',
    email: 'it_director@srmap.edu.in',
    full_name: 'Prof. M. Ramana (IT Director)',
    role: 'SUPER_ADMIN',
    department: 'University Systems & Network Operations',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
  },
};

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setError: (error: string | null) => void;
  logout: () => void;

  // Developer & local testing quick switcher
  devSwitchRole: (role: UserRole) => void;

  // Role verification helper methods
  hasRole: (allowedRoles: UserRole[]) => boolean;
  isStudent: () => boolean;
  isStaff: () => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          error: null,
        }),

      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      setError: (error) => set({ error }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),

      devSwitchRole: (role: UserRole) => {
        const demoUser = DEMO_USERS[role];
        const mockToken = `mock_jwt_${role.toLowerCase()}_${Date.now()}`;
        set({
          user: demoUser,
          token: mockToken,
          refreshToken: `mock_refresh_${Date.now()}`,
          isAuthenticated: true,
          error: null,
        });
      },

      hasRole: (allowedRoles: UserRole[]) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        return allowedRoles.includes(currentUser.role);
      },

      isStudent: () => get().user?.role === 'STUDENT',
      isStaff: () => get().user?.role === 'STAFF' || get().user?.role === 'TRAINER',
      isAdmin: () => get().user?.role === 'ADMIN' || get().user?.role === 'SUPER_ADMIN',
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
    }),
    {
      name: 'gymslot_auth_session',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
