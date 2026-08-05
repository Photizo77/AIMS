// src/components/auth/ProtectedRoute.tsx
// ============================================================
// AIMS — Route Protection Component (Phase 1)
// Checks if the logged-in user has access to a specific module
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasModuleAccess, type ModuleKey } from '@/config/roles';
import type { ReactNode } from 'react';

// ─────────────────────────────────────────────
// ROUTE → MODULE MAPPING
// Maps each route path to its module key for permission checking
// ─────────────────────────────────────────────
const ROUTE_MODULE_MAP: Record<string, ModuleKey> = {
  '/dashboard': 'dashboard',
  '/feed': 'feed',
  '/chat': 'feed',
  '/innovations': 'innovations',
  '/tasks': 'innovations',
  '/attendance': 'attendance',
  '/hr-admin': 'hr_admin',
  '/hr': 'hr_admin',
  '/finance': 'finance',
  '/procurement': 'procurement',
  '/grants': 'grants',
  '/documents': 'documents',
  '/inventory': 'inventory',
  '/approvals': 'approvals',
  '/analytics': 'analytics',
  '/crm': 'crm',
  '/research': 'research',
  '/knowledge': 'knowledge',
  '/rbac': 'rbac',
  '/settings': 'settings',
};

// ─────────────────────────────────────────────
// PROTECTED ROUTE COMPONENT
// ─────────────────────────────────────────────
interface ProtectedRouteProps {
  children: ReactNode;
  module?: ModuleKey;  // Optional: specify module for granular control
}

export function ProtectedRoute({ children, module }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check 1: Is the user logged in?
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check 2: Determine the module from the route or prop
  const currentPath = location.pathname;
  const targetModule = module || ROUTE_MODULE_MAP[currentPath];

  // If we can't determine the module, allow access (fallback)
  if (!targetModule) {
    return <>{children}</>;
  }

  // Check 3: Does the user's role have access to this module?
  if (user && !hasModuleAccess(user.role, targetModule)) {
    // Redirect to dashboard if no access
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ All checks passed — render the content
  return <>{children}</>;
}