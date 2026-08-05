// src/context/AuthContext.tsx
// ============================================================
// AIMS — Authentication Context
// Login-first architecture (no default user)
// ============================================================

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';

// ─────────────────────────────────────────────
// MOCK USERS (Replace with real API later)
// ─────────────────────────────────────────────
const MOCK_USERS: Record<string, User> = {
  'cd@aims.org': {
    id: 'user-cd-001',
    name: 'Amara Okafor',
    email: 'cd@aims.org',
    role: 'CD',
    department: 'Executive',
    status: 'active',
    createdAt: '2025-01-15',
  },
  'ed@aims.org': {
    id: 'user-ed-001',
    name: 'David Mwangi',
    email: 'ed@aims.org',
    role: 'ED',
    department: 'Executive',
    status: 'active',
    createdAt: '2025-01-15',
  },
  'sysadmin@aims.org': {
    id: 'user-sysadmin-001',
    name: 'Tech Admin',
    email: 'sysadmin@aims.org',
    role: 'SYS_ADMIN',
    department: 'IT',
    status: 'active',
    createdAt: '2025-01-15',
  },
  'admin@aims.org': {
    id: 'user-admin-001',
    name: 'Sarah Kimani',
    email: 'admin@aims.org',
    role: 'COMPANY_ADMIN',
    department: 'Administration',
    status: 'active',
    createdAt: '2025-02-01',
  },
  'finance@aims.org': {
    id: 'user-finance-001',
    name: 'James Odhiambo',
    email: 'finance@aims.org',
    role: 'FINANCE',
    department: 'Finance',
    status: 'active',
    createdAt: '2025-03-10',
  },
  'grants@aims.org': {
    id: 'user-grant-001',
    name: 'Fatima Hassan',
    email: 'grants@aims.org',
    role: 'GRANT_WRITER',
    department: 'Grants',
    status: 'active',
    createdAt: '2025-04-20',
  },
  'innovation@aims.org': {
    id: 'user-innov-001',
    name: 'Kevin Njoroge',
    email: 'innovation@aims.org',
    role: 'INNOVATOR',
    department: 'Innovation',
    status: 'active',
    createdAt: '2025-05-05',
  },
};

// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  getRoleLabel: (role: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with NO user — must login first
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string): boolean => {
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const getRoleLabel = (role: Role) => ROLE_LABELS[role];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        getRoleLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// CUSTOM HOOK
// ─────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}