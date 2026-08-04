import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNavBar } from './TopNavBar'
import { SideNavBar } from './SideNavBar'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-aims-mint">
      {/* Top bar */}
      <TopNavBar />

      {/* Sidebar — hidden on mobile, always visible md+ */}
      <div className="hidden md:block">
        <SideNavBar />
      </div>

      {/* Mobile sidebar overlay */}
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

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3.5 left-4 z-[60] p-sm rounded-lg text-white hover:bg-white/10 transition-colors"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle sidebar"
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>

      {/* Main content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all',
          'md:pl-64'          // offset for sidebar on desktop
        )}
      >
        <div className="p-lg max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
