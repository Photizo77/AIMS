// src/context/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';

const MOCK_USERS: Record<string, User> = {
  'cd@aims.org': { id: 'user-cd-001', name: 'Nassir Mwanje', email: 'cd@aims.org', role: 'CD', department: 'Executive', status: 'active', createdAt: '2025-01-15' },
  'ed@aims.org': { id: 'user-ed-001', name: 'Peter Byamugisha', email: 'ed@aims.org', role: 'ED', department: 'Executive', status: 'active', createdAt: '2025-01-15' },
  'sysadmin@aims.org': { id: 'user-sysadmin-001', name: 'Okello Komakech', email: 'sysadmin@aims.org', role: 'SYS_ADMIN', department: 'IT', status: 'active', createdAt: '2025-01-15' },
  'admin@aims.org': { id: 'user-admin-001', name: 'Grace Aceng', email: 'admin@aims.org', role: 'COMPANY_ADMIN', department: 'Administration', status: 'active', createdAt: '2025-02-01' },
  'finance@aims.org': { id: 'user-finance-001', name: 'Amos Ojok', email: 'finance@aims.org', role: 'FINANCE', department: 'Finance', status: 'active', createdAt: '2025-03-10' },
  'grants@aims.org': { id: 'user-grant-001', name: 'Sarah Aciro', email: 'grants@aims.org', role: 'GRANT_WRITER', department: 'Grants', status: 'active', createdAt: '2025-04-20' },
  'innovation@aims.org': { id: 'user-innov-001', name: 'Pius Odong', email: 'innovation@aims.org', role: 'INNOVATOR', department: 'Innovation', status: 'active', createdAt: '2025-05-05' },
};

interface AuthContextType {
  user: User | null; 
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void; 
  getRoleLabel: (role: Role) => string;
  updateAvatar: (url: string) => void; // NEW: Allows updating the photo
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = (email: string, _password: string): boolean => {
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser) { setUser(foundUser); return true; }
    return false;
  };
  
  const logout = () => setUser(null);
  const getRoleLabel = (role: Role) => ROLE_LABELS[role];
  
  const updateAvatar = (url: string) => {
    if (user) {
      setUser({ ...user, avatarUrl: url });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, getRoleLabel, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}