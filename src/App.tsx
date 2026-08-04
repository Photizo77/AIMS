import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

// Auth
import { LoginMFA }    from '@/pages/auth/LoginMFA'

// App pages
import { Dashboard }   from '@/pages/Dashboard'
import { Finance }     from '@/pages/Finance'
import { Tasks }       from '@/pages/Tasks'
import { HR }          from '@/pages/HR'
import { Documents }   from '@/pages/Documents'
import { Attendance }  from '@/pages/Attendance'
import { Approvals }   from '@/pages/Approvals'
import { Analytics }   from '@/pages/Analytics'
import { Procurement } from '@/pages/Procurement'
import { Research }    from '@/pages/Research'
import { CRM }         from '@/pages/CRM'
import { Chat }        from '@/pages/Chat'
import { RBAC }        from '@/pages/RBAC'
import { Grants }      from '@/pages/Grants'
import { Inventory }   from '@/pages/Inventory'
import { Knowledge }   from '@/pages/Knowledge'
import { Settings }    from '@/pages/Settings'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginMFA />} />

        {/* Protected — all pages share the AppShell layout */}
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/attendance"  element={<Attendance />} />
          <Route path="/tasks"       element={<Tasks />} />
          <Route path="/documents"   element={<Documents />} />
          <Route path="/hr"          element={<HR />} />
          <Route path="/finance"     element={<Finance />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/research"    element={<Research />} />
          <Route path="/crm"         element={<CRM />} />
          <Route path="/analytics"   element={<Analytics />} />
          <Route path="/chat"        element={<Chat />} />
          <Route path="/approvals"   element={<Approvals />} />
          <Route path="/rbac"        element={<RBAC />} />
          <Route path="/grants"      element={<Grants />} />
          <Route path="/inventory"   element={<Inventory />} />
          <Route path="/knowledge"   element={<Knowledge />} />
          <Route path="/settings"    element={<Settings />} />

          {/* Catch-all inside shell */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
