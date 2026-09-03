// src/components/layout/AppShell.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';
import { SideNavBar } from './SideNavBar';
import { Toaster } from '@/components/ui/Toaster';
import { GrantsAssistant } from '@/components/grants/GrantsAssistant';
import { FlagForEDModal } from '@/components/grants/FlagForEDModal';
import { FormLibraryModal } from '@/components/forms/FormLibraryModal';
import { EmployeeOnboardingModal } from '@/components/hr/EmployeeOnboardingForm';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { cn } from '@/lib/utils';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNavBar />

      <div className="hidden md:block fixed left-0 top-16 h-[calc(100vh-64px)] z-20">
        <SideNavBar />
      </div>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-16 h-[calc(100vh-64px)] z-40">
            <SideNavBar />
          </div>
        </>
      )}

      <button
        className="md:hidden fixed top-3.5 left-4 z-[60] p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle sidebar"
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>

      <main className={cn('pt-16 min-h-screen transition-all', 'md:pl-64')}>
        <div className="p-6 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>

      <Toaster />

      {/* Floating ARDHI Grants Assistant — available on every page */}
      <GrantsAssistant />

      {/* Flag-for-ED modal — available on every page (CD capability) */}
      <FlagForEDModal />

      {/* ARDHI Forms Library modal — opens any form in context */}
      <FormLibraryModal />

      {/* ARDHI Employee Information Form — HR adds employee data (onboarding) */}
      <EmployeeOnboardingModal />

      {/* Global search (Ctrl+K) */}
      <GlobalSearch />
    </div>
  );
}