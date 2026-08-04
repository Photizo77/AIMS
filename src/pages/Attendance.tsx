import { useState, useEffect } from 'react'

const weekLog = [
  { date: 'Mon Jul 28', checkIn: '08:05 AM', checkOut: '05:12 PM', hours: '9h 07m', status: 'Present' },
  { date: 'Tue Jul 29', checkIn: '07:58 AM', checkOut: '05:00 PM', hours: '9h 02m', status: 'Present' },
  { date: 'Wed Jul 30', checkIn: '08:22 AM', checkOut: '04:45 PM', hours: '8h 23m', status: 'Present' },
  { date: 'Thu Jul 31', checkIn: '09:10 AM', checkOut: '05:30 PM', hours: '8h 20m', status: 'Late'    },
  { date: 'Fri Aug 01', checkIn: '08:12 AM', checkOut: '—',        hours: 'Active', status: 'Present' },
]

function statusStyle(s: string): React.CSSProperties {
  if (s === 'Present') return { backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25' }
  if (s === 'Late')    return { backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14' }
  return { backgroundColor: '#e5eeff', color: '#002141' }
}

export function Attendance() {
  const [checkedIn, setCheckedIn] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.01em', color: '#002141' }}>Attendance</h1>
          <p style={{ fontSize: '16px', lineHeight: '24px', color: '#43474f', marginTop: '4px' }}>Daily check-in / check-out and attendance log</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clock-in card */}
        <div className="lg:col-span-1">
          <div style={{ backgroundColor: '#053664', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#ffffff', boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '140px', color: 'rgba(255,255,255,0.05)' }}>schedule</span>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px' }}>Current Time</p>
            <p style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px' }}>{timeStr}</p>
            <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '28px' }}>{dateStr}</p>

            {/* Status badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: checkedIn ? 'rgba(171,245,157,0.2)' : 'rgba(235,59,20,0.2)', padding: '6px 20px', borderRadius: '9999px', marginBottom: '24px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '9999px', backgroundColor: checkedIn ? '#abf59d' : '#eb3b14', display: 'inline-block' }} className="animate-pulse" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: checkedIn ? '#abf59d' : '#eb3b14' }}>{checkedIn ? 'Checked In — 08:12 AM' : 'Not Checked In'}</span>
            </div>

            {/* Check-in / out button */}
            <button
              onClick={() => setCheckedIn((v) => !v)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, backgroundColor: checkedIn ? '#eb3b14' : '#abf59d', color: checkedIn ? '#ffffff' : '#002202', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
              className="hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 mx-auto">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{checkedIn ? 'logout' : 'login'}</span>
              {checkedIn ? 'Check Out' : 'Check In'}
            </button>

            {checkedIn && (
              <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '12px' }}>Duration today: <strong>9h 22m</strong></p>
            )}
          </div>

          {/* Location */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #c3c6d0', marginTop: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Check-In Location</p>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: '#eb3b14', fontSize: '24px' }}>location_on</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0b1c30' }}>ARDHI HQ — Kampala</p>
                <p style={{ fontSize: '12px', color: '#43474f' }}>0.4° N, 32.6° E · Verified GPS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: weekly log + summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Month summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Days Present', value: '18',    icon: 'check_circle',  ok: true  },
              { label: 'Days Absent',  value: '2',     icon: 'cancel',        ok: false },
              { label: 'Late Arrivals',value: '3',     icon: 'schedule',      ok: false },
              { label: 'Hours Logged', value: '162h',  icon: 'timer',         ok: true  },
            ].map((c) => (
              <div key={c.label}
                style={{ backgroundColor: '#c1dbc3', padding: '16px', borderRadius: '12px', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#002141', textTransform: 'uppercase' }}>{c.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'rgba(0,33,65,0.4)' }}>{c.icon}</span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 600, color: '#002141' }}>{c.value}</span>
              </div>
            ))}
          </div>

          {/* Weekly log table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #c3c6d0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #c3c6d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#002141' }}>This Week's Log</h3>
              <button style={{ fontSize: '12px', fontWeight: 500, color: '#002141' }} className="hover:underline">Full History</button>
            </div>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#053664', color: '#ffffff' }}>
                  {['Date','Check-In','Check-Out','Hours','Status'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekLog.map((row, i) => (
                  <tr key={row.date} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: '#0b1c30' }}>{row.date}</td>
                    <td style={{ padding: '10px 16px', color: '#43474f' }}>{row.checkIn}</td>
                    <td style={{ padding: '10px 16px', color: '#43474f' }}>{row.checkOut}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: '#002141' }}>{row.hours}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ ...statusStyle(row.status), fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px' }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
