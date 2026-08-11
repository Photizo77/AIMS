// src/App.tsx
// ============================================================
// AIMS — Main App Router
// Phase 1: Protected Routes with RBAC
// Phase 2: Feed replaces Chat
// Phase 5: Tasks route renamed to Innovations
// Phase 6: AI Assistant full-page route added
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// ─── Auth ───
import { LoginMFA } from '@/pages/auth/LoginMFA';

// ─── App Pages ───
import { Dashboard }     from '@/pages/Dashboard';
import { Feed }          from '@/pages/Feed';
import { Tasks }         from '@/pages/Tasks';
import { Attendance }    from '@/pages/Attendance';
import { HR }            from '@/pages/HR';
import { Grants }        from '@/pages/Grants';
import { Finance }       from '@/pages/Finance';
import { Procurement }   from '@/pages/Procurement';
import { Approvals }     from '@/pages/Approvals';
import { Documents }     from '@/pages/Documents';
import { Inventory }     from '@/pages/Inventory';
import { Analytics }     from '@/pages/Analytics';
import { Research }      from '@/pages/Research';
import { Knowledge }     from '@/pages/Knowledge';
import { CRM }           from '@/pages/CRM';
import { RBAC }          from '@/pages/RBAC';
import { Settings }      from '@/pages/Settings';
import { AIAssistant }   from '@/pages/AIAssistant';

// ─── Main App Component ───
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ═══════════════════════════════════════════
            PUBLIC ROUTES (No authentication required)
            ═══════════════════════════════════════════ */}
        <Route path="/login" element={<LoginMFA />} />

        {/* ═══════════════════════════════════════════
            PROTECTED ROUTES (Wrapped in AppShell)
            Each route checks role-based permissions
            ═══════════════════════════════════════════ */}
        <Route element={<AppShell />}>
          {/* Root redirects to Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* ─── Dashboard ─── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute module="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ─── Feed (replaces Chat) ─── */}
          <Route
            path="/feed"
            element={
              <ProtectedRoute module="feed">
                <Feed />
              </ProtectedRoute>
            }
          />
          {/* Redirect old /chat to /feed for backwards compatibility */}
          <Route path="/chat" element={<Navigate to="/feed" replace />} />

          {/* ─── Innovations (formerly Tasks) ─── */}
          <Route
            path="/innovations"
            element={
              <ProtectedRoute module="innovations">
                <Tasks />
              </ProtectedRoute>
            }
          />
          {/* Redirect old /tasks path to /innovations */}
          <Route path="/tasks" element={<Navigate to="/innovations" replace />} />

          {/* ─── Attendance ─── */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute module="attendance">
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* ─── HR & Admin (merged) ─── */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute module="hr_admin">
                <HR />
              </ProtectedRoute>
            }
          />

          {/* ─── Grants ─── */}
          <Route
            path="/grants"
            element={
              <ProtectedRoute module="grants">
                <Grants />
              </ProtectedRoute>
            }
          />

          {/* ─── AI Assistant (Full Page) ─── */}
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute module="grants">
                <AIAssistant />
              </ProtectedRoute>
            }
          />

          {/* ─── Finance ─── */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute module="finance">
                <Finance />
              </ProtectedRoute>
            }
          />

          {/* ─── Procurement ─── */}
          <Route
            path="/procurement"
            element={
              <ProtectedRoute module="procurement">
                <Procurement />
              </ProtectedRoute>
            }
          />

          {/* ─── Approvals (ED/CD action center) ─── */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute module="approvals">
                <Approvals />
              </ProtectedRoute>
            }
          />

          {/* ─── Documents (restricted) ─── */}
          <Route
            path="/documents"
            element={
              <ProtectedRoute module="documents">
                <Documents />
              </ProtectedRoute>
            }
          />

          {/* ─── Inventory (admin only) ─── */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute module="inventory">
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* ─── Analytics ─── */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute module="analytics">
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* ─── Research ─── */}
          <Route
            path="/research"
            element={
              <ProtectedRoute module="research">
                <Research />
              </ProtectedRoute>
            }
          />

          {/* ─── Knowledge Base ─── */}
          <Route
            path="/knowledge"
            element={
              <ProtectedRoute module="knowledge">
                <Knowledge />
              </ProtectedRoute>
            }
          />

          {/* ─── CRM ─── */}
          <Route
            path="/crm"
            element={
              <ProtectedRoute module="crm">
                <CRM />
              </ProtectedRoute>
            }
          />

          {/* ─── RBAC (System Admin role manager) ─── */}
          <Route
            path="/rbac"
            element={
              <ProtectedRoute module="rbac">
                <RBAC />
              </ProtectedRoute>
            }
          />

          {/* ─── Settings ─── */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute module="settings">
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* ─── Catch-all: redirect unknown routes to Dashboard ─── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}