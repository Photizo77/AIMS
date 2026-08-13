// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Auth
import { LoginMFA } from '@/pages/auth/LoginMFA';

// App Pages
import { Dashboard }     from '@/pages/Dashboard';
import { Feed }          from '@/pages/Feed';
import { Email }         from '@/pages/Email';
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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginMFA />} />

        {/* PROTECTED ROUTES */}
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute module="feed"><Feed /></ProtectedRoute>} />
          <Route path="/chat" element={<Navigate to="/feed" replace />} />
          <Route path="/email" element={<ProtectedRoute module="feed"><Email /></ProtectedRoute>} />
          <Route path="/innovations" element={<ProtectedRoute module="innovations"><Tasks /></ProtectedRoute>} />
          <Route path="/tasks" element={<Navigate to="/innovations" replace />} />
          <Route path="/attendance" element={<ProtectedRoute module="attendance"><Attendance /></ProtectedRoute>} />
          <Route path="/hr" element={<ProtectedRoute module="hr_admin"><HR /></ProtectedRoute>} />
          <Route path="/grants" element={<ProtectedRoute module="grants"><Grants /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute module="grants"><AIAssistant /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute module="finance"><Finance /></ProtectedRoute>} />
          <Route path="/procurement" element={<ProtectedRoute module="procurement"><Procurement /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute module="approvals"><Approvals /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute module="documents"><Documents /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute module="inventory"><Inventory /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute module="analytics"><Analytics /></ProtectedRoute>} />
          <Route path="/research" element={<ProtectedRoute module="research"><Research /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute module="knowledge"><Knowledge /></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute module="crm"><CRM /></ProtectedRoute>} />
          <Route path="/rbac" element={<ProtectedRoute module="rbac"><RBAC /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}