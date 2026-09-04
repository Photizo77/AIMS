// src/components/layout/AppShell.tsx
import { useEffect, useState } from 'react';
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
import { armFlashSync, flashAllSystemData } from '@/lib/storage';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Boot-time wiring: cross-tab flash sync, a browser-console flash hook and a
  // ?flash=1 URL trigger so the reset can run straight from any browser.
  useEffect(() => {
    // Expose window.aimsFlash() for console / automation use in the browser
    (window as unknown as { aimsFlash?: () => void }).aimsFlash = () => {
      flashAllSystemData();
      window.location.reload();
    };

    // URL trigger: append ?flash=1 to flash from the address bar
    const params = new URLSearchParams(window.location.search);
    if (params.get('flash') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      flashAllSystemData();
      window.location.reload();
      return;
    }

    // Any other open AIMS tab flashes → wipe this tab too and reload together
    armFlashSync();
  }, []);

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