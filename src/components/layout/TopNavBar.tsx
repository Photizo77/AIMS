import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArdhiLogo } from './ArdhiLogo'

interface TopNavBarProps {
  searchPlaceholder?: string
}

export function TopNavBar({ searchPlaceholder = 'Search tasks, documents or requests…' }: TopNavBarProps) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 flex items-center justify-between px-lg bg-primary-container text-white shadow-md">
      {/* ── Left: Logo + Search ── */}
      <div className="flex items-center gap-md">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <ArdhiLogo variant="compact" inverted className="scale-90 -ml-1" />
          <span className="hidden lg:block h-5 w-px bg-white/30 mx-1" />
          <span className="hidden lg:block text-[11px] font-semibold tracking-widest text-white/70 uppercase">
            AIMS
          </span>
        </Link>

        <div className="hidden md:flex ml-4 items-center bg-white/10 border border-white/20 rounded-lg px-md py-1.5 w-80 xl:w-96 gap-2 focus-within:bg-white/15 transition-colors">
          <span className="material-symbols-outlined text-white/60 text-[20px]">search</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="bg-transparent border-none outline-none text-white placeholder-white/50 text-body-md w-full"
          />
        </div>
      </div>

      {/* ── Right: Notifications + User ── */}
      <div className="flex items-center gap-md">
        {/* Mobile search */}
        <button className="md:hidden p-sm rounded-full hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[22px]">search</span>
        </button>

        {/* Notifications */}
        <button className="relative p-sm rounded-full hover:bg-white/10 transition-colors" aria-label="Notifications">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-aims-orange rounded-full border-2 border-primary-container" />
        </button>

        {/* Live clock — desktop */}
        <span className="hidden lg:block bg-white/15 text-white text-label-md font-bold px-md py-1 rounded-full border border-white/20">
          {time}
        </span>

        {/* Help */}
        <button className="hidden md:block text-label-md border border-white/30 px-md py-1 rounded-lg hover:bg-white/10 transition-colors">
          Help
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-sm cursor-pointer hover:bg-white/10 px-sm py-1 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
            AU
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-[13px] font-bold leading-none">Admin User</p>
            <p className="text-[10px] text-white/60 mt-0.5">Senior Registrar</p>
          </div>
          <span className="material-symbols-outlined text-[18px] text-white/50">expand_more</span>
        </div>
      </div>
    </header>
  )
}
