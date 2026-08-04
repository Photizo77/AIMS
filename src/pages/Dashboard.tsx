import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner'

/* ── Mini calendar helper ── */
const DAYS = ['M','T','W','T','F','S','S']

const calendarDays = [
  { day: 28, fade: true },  { day: 29, fade: true },  { day: 30, fade: true },
  { day: 1  }, { day: 2  }, { day: 3  }, { day: 4  },
  { day: 5  }, { day: 6  }, { day: 7  }, { day: 8  }, { day: 9  }, { day: 10 }, { day: 11 },
  { day: 12, active: true },
  { day: 13 }, { day: 14, dot: true }, { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 },
  { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 },
  { day: 26 }, { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31 },
]

export function Dashboard() {
  const navigate = useNavigate()
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
    <div>
      {/* Announcement */}
      <AnnouncementBanner message="System maintenance scheduled for Sunday at 02:00 AM EAT. Some services may be intermittent." />

      {/* Header Greeting */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 style={{ fontSize: '32px', lineHeight: '40px', fontWeight: 600, letterSpacing: '-0.01em', color: '#002141' }}>
              Good morning, David!
            </h1>
            <p style={{ fontSize: '16px', lineHeight: '24px', color: '#43474f', marginTop: '4px' }}>
              Here's what's happening in the system today.
            </p>
          </div>
          <div className="flex gap-2">
            <span style={{ fontSize: '12px', fontWeight: 500, lineHeight: '16px', backgroundColor: '#e5eeff', color: '#002141', padding: '4px 16px', borderRadius: '9999px', border: '1px solid #c3c6d0' }}>
              Role: Regional Registrar
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: '16px', backgroundColor: '#053664', color: '#ffffff', padding: '4px 16px', borderRadius: '9999px' }}>
              {time}
            </span>
          </div>
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Attendance */}
        <div style={{ backgroundColor: '#c1dbc3', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}
          className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: '16px', letterSpacing: '0.05em', color: '#002141', textTransform: 'uppercase' }}>Attendance</span>
            <span className="material-symbols-outlined" style={{ color: 'rgba(0,33,65,0.4)', fontSize: '22px' }}>timer</span>
          </div>
          <div className="flex items-end justify-between">
            <span style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', color: '#002141' }}>Checked In</span>
            <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25', padding: '4px 16px', borderRadius: '9999px' }}>08:12 AM</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div style={{ backgroundColor: '#c1dbc3', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}
          className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: '16px', letterSpacing: '0.05em', color: '#002141', textTransform: 'uppercase' }}>Pending Tasks</span>
            <span className="material-symbols-outlined" style={{ color: 'rgba(0,33,65,0.4)', fontSize: '22px' }}>list_alt</span>
          </div>
          <div className="flex items-end justify-between">
            <span style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', color: '#002141' }}>12</span>
            <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14', padding: '4px 16px', borderRadius: '9999px' }} className="animate-pulse">Action Req.</span>
          </div>
        </div>

        {/* Leave Balance */}
        <div style={{ backgroundColor: '#c1dbc3', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}
          className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: '16px', letterSpacing: '0.05em', color: '#002141', textTransform: 'uppercase' }}>Leave Balance</span>
            <span className="material-symbols-outlined" style={{ color: 'rgba(0,33,65,0.4)', fontSize: '22px' }}>beach_access</span>
          </div>
          <div className="flex items-end justify-between">
            <span style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', color: '#002141' }}>14 Days</span>
            <span style={{ fontSize: '10px', color: '#43474f' }}>Annual cycle</span>
          </div>
        </div>

        {/* Approvals */}
        <div style={{ backgroundColor: '#c1dbc3', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}
          className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: '16px', letterSpacing: '0.05em', color: '#002141', textTransform: 'uppercase' }}>Approvals</span>
            <span className="material-symbols-outlined" style={{ color: 'rgba(0,33,65,0.4)', fontSize: '22px' }}>verified_user</span>
          </div>
          <div className="flex items-end justify-between">
            <span style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', color: '#002141' }}>05</span>
            <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14', padding: '4px 16px', borderRadius: '9999px' }} className="animate-pulse">Awaiting Sign</span>
          </div>
        </div>
      </section>

      {/* ── Dual Column Layout ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Tasks + Widgets (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Priority Tasks */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #c3c6d0' }}
            className="hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#002141' }}>Priority Tasks</h3>
              <button onClick={() => navigate('/tasks')} style={{ fontSize: '12px', fontWeight: 500, color: '#002141' }} className="hover:underline">View All</button>
            </div>
            <div className="space-y-4">

              {[
                { icon: 'priority_high', iconBg: '#ffdad6', iconColor: '#ba1a1a', title: 'Approve Land Parcel #4529-B', sub: 'Submitted by Regional Office • Due Today' },
                { icon: 'history_edu',   iconBg: '#cce6ce', iconColor: '#516855', title: 'Signature required for HR Contract #901', sub: 'Employee: Jane Doe • 2 days ago' },
                { icon: 'analytics',     iconBg: '#e5eeff', iconColor: '#002141', title: 'Monthly Procurement Audit', sub: 'Internal Review • Due Friday' },
              ].map((task) => (
                <div key={task.title}
                  className="group flex items-center gap-4 p-4 rounded-lg border border-transparent hover:bg-[#eff4ff] hover:border-[#c3c6d0] transition-all cursor-pointer"
                  onClick={() => navigate('/tasks')}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: task.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: task.iconColor, fontSize: '20px' }}>{task.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '14px', fontWeight: 700, lineHeight: '20px', color: '#0b1c30' }}>{task.title}</p>
                    <p style={{ fontSize: '12px', color: '#43474f' }}>{task.sub}</p>
                  </div>
                  <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#43474f', fontSize: '20px' }}>chevron_right</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lower widgets row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Staff Capacity */}
            <div style={{ backgroundColor: '#053664', padding: '24px', borderRadius: '12px', boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}
              className="group">
              <div style={{ position: 'relative', zIndex: 10 }}>
                <h4 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#ffffff', marginBottom: '8px' }}>Staff Capacity</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>Active deployment across sectors</p>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '8px', marginBottom: '8px' }}>
                  <div style={{ backgroundColor: '#abf59d', height: '8px', borderRadius: '9999px', width: '78%', transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff' }}>78% Utilization</span>
              </div>
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform" style={{ position: 'absolute', bottom: '-16px', right: '-16px', fontSize: '120px', color: 'rgba(255,255,255,0.1)' }}>monitoring</span>
            </div>

            {/* Active Surveys */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #c3c6d0', display: 'flex', alignItems: 'center', gap: '24px' }}
              className="hover:-translate-y-0.5 transition-transform">
              <div style={{ width: 64, height: 64, borderRadius: '9999px', border: '4px solid #cce6ce', borderTopColor: '#053664', flexShrink: 0 }}
                className="animate-spin-slow flex items-center justify-center">
                <span style={{ fontWeight: 700, color: '#002141', fontSize: '18px' }}>4</span>
              </div>
              <div>
                <h4 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#0b1c30' }}>Active Surveys</h4>
                <p style={{ fontSize: '14px', color: '#43474f' }}>Currently in field</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">

          {/* Mini Calendar */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #c3c6d0' }}
            className="hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#002141' }}>Calendar</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-[#e5eeff] rounded-lg transition-colors"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span></button>
                <button className="p-1 hover:bg-[#e5eeff] rounded-lg transition-colors"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span></button>
              </div>
            </div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#002141', textAlign: 'center', marginBottom: '12px' }}>October 2025</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 0', textAlign: 'center' }}>
              {DAYS.map((d, i) => (
                <span key={i} style={{ fontSize: '10px', fontWeight: 700, color: '#43474f' }}>{d}</span>
              ))}
              {calendarDays.map((c, i) => (
                <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '14px', lineHeight: '28px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', cursor: 'pointer',
                    backgroundColor: c.active ? '#053664' : 'transparent',
                    color: c.active ? '#ffffff' : c.fade ? 'rgba(0,0,0,0.2)' : '#0b1c30',
                  }}>
                    {c.day}
                  </span>
                  {c.dot && <span style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: '#ba1a1a', position: 'absolute', bottom: 0 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Documents */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #c3c6d0' }}
            className="hover:-translate-y-0.5 transition-transform">
            <h3 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#002141', marginBottom: '16px' }}>Recent Documents</h3>
            <div className="space-y-2">
              {[
                { icon: 'description',  name: 'Land_Title_Deed_001.pdf',          time: 'Modified 2h ago' },
                { icon: 'table_chart',  name: 'Quarterly_Financial_Report.xlsx',   time: 'Modified 5h ago' },
                { icon: 'policy',       name: 'HR_Policy_Updates_v2.docx',         time: 'Modified 1d ago' },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center gap-4 p-2 rounded-lg hover:bg-[#e5eeff] cursor-pointer transition-colors" onClick={() => navigate('/documents')}>
                  <span className="material-symbols-outlined" style={{ color: '#002141', fontSize: '22px' }}>{doc.icon}</span>
                  <div className="overflow-hidden">
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#0b1c30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                    <p style={{ fontSize: '11px', color: '#43474f' }}>{doc.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/documents')}
              className="w-full mt-4 hover:bg-[#e5eeff] transition-colors"
              style={{ padding: '8px', fontSize: '12px', fontWeight: 500, color: '#002141', border: '1px solid rgba(0,33,65,0.2)', borderRadius: '8px' }}>
              Go to File Explorer
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
