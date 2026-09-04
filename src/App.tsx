// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AttendanceProvider } from '@/context/AttendanceContext';
import { roleLanding } from '@/config/navigation';

// Auth & Layout
import { LoginMFA } from '@/pages/auth/LoginMFA';

// Core Pages
import { Dashboard } from '@/pages/Dashboard';
import { UserManagement } from '@/pages/UserManagement';
import { Calendar } from '@/pages/Calendar';
import { Reports } from '@/pages/Reports';
import { Feed } from '@/pages/Feed';
import { EmailPage } from '@/pages/Email';
import { Tasks } from '@/pages/Tasks'; // The Innovator "My Work" Module
import { ProjectDetail } from '@/pages/ProjectDetail'; // The Detailed View
import { Attendance } from '@/pages/Attendance';
import { HR } from '@/pages/HR';
import { Grants } from '@/pages/Grants';
import { GrantDetail } from '@/pages/GrantDetail';
import { Finance } from '@/pages/Finance';
import { Procurement } from '@/pages/Procurement';
import { Approvals } from '@/pages/Approvals';
import { Documents } from '@/pages/Documents';
import { Inventory } from '@/pages/Inventory';
import { Analytics } from '@/pages/Analytics';
import { Research } from '@/pages/Research';
import { Knowledge } from '@/pages/Knowledge';
import { CRM } from '@/pages/CRM';
import { RBAC } from '@/pages/RBAC';
import { Settings } from '@/pages/Settings';
import { AIAssistant } from '@/pages/AIAssistant';
import { FormsLibrary } from '@/pages/FormsLibrary';

/** Role-aware home: signed-out users go to /login, everyone else to their role landing */
function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={user ? roleLanding(user.role) : '/login'} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AttendanceProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public Route ── */}
              <Route path="/login" element={<LoginMFA />} />

              {/* ── Protected Routes (wrapped in AppShell layout) ── */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/user-management" element={<ProtectedRoute module="hr_admin"><UserManagement /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute module="calendar"><Calendar /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
                <Route path="/feed" element={<ProtectedRoute module="feed"><Feed /></ProtectedRoute>} />
                <Route path="/email" element={<ProtectedRoute><EmailPage /></ProtectedRoute>} />
                
                {/* Innovations Module Routes */}
                <Route path="/tasks" element={<ProtectedRoute module="innovations"><Tasks /></ProtectedRoute>} />
                <Route path="/innovations" element={<ProtectedRoute module="innovations"><Tasks /></ProtectedRoute>} />
                <Route path="/innovations/:id" element={<ProtectedRoute module="innovations"><ProjectDetail /></ProtectedRoute>} />
                
                <Route path="/attendance" element={<ProtectedRoute module="attendance"><Attendance /></ProtectedRoute>} />
                <Route path="/hr" element={<ProtectedRoute module="hr_admin"><HR /></ProtectedRoute>} />
                <Route path="/hr/:userId" element={<ProtectedRoute module="hr_admin"><HR /></ProtectedRoute>} />
                <Route path="/grants" element={<ProtectedRoute module="grants"><Grants /></ProtectedRoute>} />
                <Route path="/grants/:grantId" element={<ProtectedRoute module="grants"><GrantDetail /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute module="finance"><Finance /></ProtectedRoute>} />
                <Route path="/procurement" element={<ProtectedRoute module="procurement"><Procurement /></ProtectedRoute>} />
                <Route path="/approvals" element={<ProtectedRoute module="approvals"><Approvals /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute module="documents"><Documents /></ProtectedRoute>} />
                <Route path="/documents/:docId" element={<ProtectedRoute module="documents"><Documents /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute module="inventory"><Inventory /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute module="analytics"><Analytics /></ProtectedRoute>} />
                <Route path="/research" element={<ProtectedRoute module="research"><Research /></ProtectedRoute>} />
                <Route path="/knowledge" element={<ProtectedRoute module="knowledge"><Knowledge /></ProtectedRoute>} />
                <Route path="/crm" element={<ProtectedRoute module="crm"><CRM /></ProtectedRoute>} />
                <Route path="/rbac" element={<ProtectedRoute module="rbac"><RBAC /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
                <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/forms" element={<ProtectedRoute module="forms"><FormsLibrary /></ProtectedRoute>} />

                {/* ── Catch-all: role-aware landing ── */}
                <Route path="*" element={<RoleHome />} />
              </Route>

              {/* ── Root redirect: role-aware landing ── */}
              <Route path="/" element={<RoleHome />} />
            </Routes>
          </BrowserRouter>
        </AttendanceProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}