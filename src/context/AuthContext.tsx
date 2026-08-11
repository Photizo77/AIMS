// src/context/AuthContext.tsx
// ============================================================
// AIMS — Authentication Context
// Login-first architecture with profile photos
// ============================================================

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';

const MOCK_USERS: Record<string, User> = {
  'cd@aims.org': {
    id: 'user-cd-001',
    name: 'Nassir Mwanje',
    email: 'cd@aims.org',
    role: 'CD',
    department: 'Executive',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Nassir&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-01-15',
  },
  'ed@aims.org': {
    id: 'user-ed-001',
    name: 'Peter Byamugisha',
    email: 'ed@aims.org',
    role: 'ED',
    department: 'Executive',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Peter&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-01-15',
  },
  'sysadmin@aims.org': {
    id: 'user-sysadmin-001',
    name: 'Okello Komakech',
    email: 'sysadmin@aims.org',
    role: 'SYS_ADMIN',
    department: 'IT',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Okello&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-01-15',
  },
  'admin@aims.org': {
    id: 'user-admin-001',
    name: 'Grace Aceng',
    email: 'admin@aims.org',
    role: 'COMPANY_ADMIN',
    department: 'Administration',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Grace&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-02-01',
  },
  'finance@aims.org': {
    id: 'user-finance-001',
    name: 'Amos Ojok',
    email: 'finance@aims.org',
    role: 'FINANCE',
    department: 'Finance',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Amos&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-03-10',
  },
  'grants@aims.org': {
    id: 'user-grant-001',
    name: 'Sarah Aciro',
    email: 'grants@aims.org',
    role: 'GRANT_WRITER',
    department: 'Grants',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sarah&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-04-20',
  },
  'innovation@aims.org': {
    id: 'user-innov-001',
    name: 'Pius Odong',
    email: 'innovation@aims.org',
    role: 'INNOVATOR',
    department: 'Innovation',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Pius&backgroundColor=c1dbc3',
    status: 'active',
    createdAt: '2025-05-05',
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  getRoleLabel: (role: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}