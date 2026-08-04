import { useState } from 'react'

const tabs = ['Profile', 'Leave', 'Payslips', 'Contracts', 'Performance']

const leaveHistory = [
  { type: 'Annual Leave',   from: 'Jun 2 2025',  to: 'Jun 6 2025',  days: 5, status: 'Approved' },
  { type: 'Sick Leave',     from: 'Apr 14 2025', to: 'Apr 15 2025', days: 2, status: 'Approved' },
  { type: 'Annual Leave',   from: 'Dec 23 2024', to: 'Jan 2 2025',  days: 8, status: 'Approved' },
  { type: 'Study Leave',    from: 'Mar 3 2025',  to: 'Mar 7 2025',  days: 5, status: 'Pending'  },
]

const payslips = [
  { month: 'July 2025',  net: 'UGX 4,820,000', status: 'Posted'  },
  { month: 'June 2025',  net: 'UGX 4,820,000', status: 'Posted'  },
  { month: 'May 2025',   net: 'UGX 4,750,000', status: 'Posted'  },
  { month: 'April 2025', net: 'UGX 4,750,000', status: 'Posted'  },
]

function statusStyle(s: string): React.CSSProperties {
  if (s === 'Approved' || s === 'Posted') return { backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25' }
  return { backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14' }
}

export function HR() {
  const [active, setActive] = useState('Profile')

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.01em', color: '#002141' }}>HR Self-Service</h1>
          <p style={{ fontSize: '16px', lineHeight: '24px', color: '#43474f', marginTop: '4px' }}>Employee profile, leave, payslips &amp; contracts</p>
        </div>
        <button style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', backgroundColor: '#053664', color: '#ffffff', alignSelf: 'flex-start' }}
          className="hover:opacity-90 transition-opacity flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>Apply for Leave
        </button>
      </div>

      {/* Profile card + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div style={{ backgroundColor: '#053664', borderRadius: '12px', padding: '28px', color: '#ffffff', position: 'relative', overflow: 'hidden' }}
          className="lg:col-span-1 group">
          <span className="material-symbols-outlined" style={{ position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '130px', color: 'rgba(255,255,255,0.05)' }}>person</span>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div style={{ width: 64, height: 64, borderRadius: '9999px', backgroundColor: '#d4e3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#002141' }}>DM</span>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px' }}>David Mugisha</p>
              <p style={{ fontSize: '13px', opacity: 0.7 }}>Senior Land Registrar</p>
              <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#abf59d', color: '#002202', padding: '2px 10px', borderRadius: '9999px', marginTop: '4px', display: 'inline-block' }}>Active</span>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            {[
              { icon: 'badge',         label: 'Staff ID',        value: 'ARDHI-2019-041' },
              { icon: 'business',      label: 'Department',      value: 'Land Registry' },
              { icon: 'location_on',   label: 'Station',         value: 'Kampala HQ' },
              { icon: 'email',         label: 'Email',           value: 'd.mugisha@ardhi.go.ug' },
              { icon: 'phone',         label: 'Phone',           value: '+256 700 123 456' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', opacity: 0.6 }}>{row.icon}</span>
                <span style={{ fontSize: '12px', opacity: 0.6, minWidth: 80 }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          {[
            { label: 'Leave Balance',  value: '14 Days', icon: 'beach_access', badge: 'Annual', badgeOk: true },
            { label: 'Sick Days Used', value: '4 / 21',  icon: 'medical_services', badge: '2025', badgeOk: true },
            { label: 'Contract Type',  value: 'Permanent', icon: 'description', badge: 'Active', badgeOk: true },
            { label: 'Next Appraisal', value: 'Sep 2025', icon: 'assessment', badge: 'Upcoming', badgeOk: false },
          ].map((c) => (
            <div key={c.label}
              style={{ backgroundColor: '#c1dbc3', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px' }}>
              <div className="flex justify-between items-start">
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#002141', textTransform: 'uppercase' }}>{c.label}</span>
                <span className="material-symbols-outlined" style={{ color: 'rgba(0,33,65,0.4)', fontSize: '22px' }}>{c.icon}</span>
              </div>
              <div className="flex items-end justify-between">
                <span style={{ fontSize: '22px', fontWeight: 600, color: '#002141' }}>{c.value}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: c.badgeOk ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: c.badgeOk ? '#286b25' : '#eb3b14', padding: '3px 12px', borderRadius: '9999px' }}>{c.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #c3c6d0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #c3c6d0', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActive(tab)}
              style={{ padding: '12px 20px', fontSize: '13px', fontWeight: active === tab ? 700 : 500, color: active === tab ? '#002141' : '#43474f', borderBottom: active === tab ? '2px solid #053664' : '2px solid transparent', whiteSpace: 'nowrap', background: 'none', cursor: 'pointer', transition: 'color 0.15s' }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {/* Leave tab */}
          {active === 'Leave' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#002141', marginBottom: '16px' }}>Leave History</h3>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#053664', color: '#ffffff' }}>
                    {['Type','From','To','Days','Status'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((l, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                      <td style={{ padding: '10px 16px', color: '#0b1c30', fontWeight: 500 }}>{l.type}</td>
                      <td style={{ padding: '10px 16px', color: '#43474f' }}>{l.from}</td>
                      <td style={{ padding: '10px 16px', color: '#43474f' }}>{l.to}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#002141' }}>{l.days}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ ...statusStyle(l.status), fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px' }}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payslips tab */}
          {active === 'Payslips' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#002141', marginBottom: '16px' }}>Payslip History</h3>
              <div className="space-y-3">
                {payslips.map((p) => (
                  <div key={p.month} className="flex items-center justify-between p-4 rounded-lg hover:bg-[#eff4ff] transition-colors" style={{ border: '1px solid #c3c6d0' }}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ color: '#053664', fontSize: '24px' }}>picture_as_pdf</span>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0b1c30' }}>Payslip — {p.month}</p>
                        <p style={{ fontSize: '12px', color: '#43474f' }}>Net Pay: {p.net}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ ...statusStyle(p.status), fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px' }}>{p.status}</span>
                      <button style={{ color: '#002141' }} className="hover:text-[#053664]"><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile / Contracts / Performance placeholder tabs */}
          {(active === 'Profile' || active === 'Contracts' || active === 'Performance') && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c3c6d0' }}>
                {active === 'Profile' ? 'manage_accounts' : active === 'Contracts' ? 'description' : 'bar_chart'}
              </span>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#43474f' }}>{active} section</p>
              <p style={{ fontSize: '14px', color: '#43474f' }}>Full data view coming from HR API integration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
