import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: string
  label: string
  to: string
}

const mainNav: NavItem[] = [
  { icon: 'dashboard',      label: 'Dashboard',    to: '/dashboard' },
  { icon: 'calendar_today', label: 'Attendance',   to: '/attendance' },
  { icon: 'assignment',     label: 'Tasks',        to: '/tasks' },
  { icon: 'description',    label: 'Documents',    to: '/documents' },
  { icon: 'group',          label: 'HR',           to: '/hr' },
  { icon: 'payments',       label: 'Finance',      to: '/finance' },
  { icon: 'shopping_cart',  label: 'Procurement',  to: '/procurement' },
  { icon: 'science',        label: 'Research',     to: '/research' },
  { icon: 'handshake',      label: 'CRM',          to: '/crm' },
  { icon: 'analytics',      label: 'Analytics',    to: '/analytics' },
  { icon: 'forum',          label: 'Chat',         to: '/chat' },
  { icon: 'savings',        label: 'Grants',       to: '/grants' },
  { icon: 'inventory_2',    label: 'Inventory',    to: '/inventory' },
  { icon: 'menu_book',      label: 'Knowledge',    to: '/knowledge' },
]

const bottomNav: NavItem[] = [
  { icon: 'shield_person',  label: 'RBAC / Roles', to: '/rbac' },
  { icon: 'settings',       label: 'Settings',     to: '/settings' },
]

export function SideNavBar() {
  const navigate = useNavigate()

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-40 flex flex-col py-md bg-surface-container-lowest border-r border-outline-variant shadow-sm">
      {/* New Request CTA */}
      <div className="px-md mb-lg">
        <button
          onClick={() => navigate('/approvals')}
          className="w-full bg-primary-container text-white py-sm rounded-xl font-label-md flex items-center justify-center gap-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Request
        </button>
      </div>

      {/* Main nav links */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 px-xs">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-md px-md py-sm mx-2 rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold translate-x-1'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-label-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="pt-md border-t border-outline-variant mt-auto">
        {bottomNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-md px-md py-sm mx-2 rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold translate-x-1'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-label-md">{item.label}</span>
          </NavLink>
        ))}

        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center gap-md px-md py-sm mx-2 rounded-lg text-error hover:bg-error-container/30 transition-all text-label-md"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
