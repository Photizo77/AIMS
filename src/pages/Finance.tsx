import { useNavigate } from 'react-router-dom'

const budgetLines = [
  { department: 'Research & Advocacy', allocated: 45000000, spent: 31500000, pct: 70 },
  { department: 'Human Resources',     allocated: 28000000, spent: 26600000, pct: 95 },
  { department: 'Procurement',         allocated: 15000000, spent:  7500000, pct: 50 },
  { department: 'ICT & Systems',       allocated: 12000000, spent:  9600000, pct: 80 },
  { department: 'Field Operations',    allocated: 20000000, spent: 19000000, pct: 95 },
  { department: 'Administration',      allocated:  8000000, spent:  3200000, pct: 40 },
]

const recentTx = [
  { ref: 'TXN-2025-0841', desc: 'Field Survey Equipment',      amount: 4_200_000, date: 'Jul 28 2025', status: 'Approved'  },
  { ref: 'TXN-2025-0840', desc: 'Staff Training Workshop',      amount: 1_500_000, date: 'Jul 27 2025', status: 'Pending'   },
  { ref: 'TXN-2025-0839', desc: 'Software License Renewal',     amount:   860_000, date: 'Jul 25 2025', status: 'Approved'  },
  { ref: 'TXN-2025-0838', desc: 'Office Supplies Q3',           amount:   340_000, date: 'Jul 24 2025', status: 'Approved'  },
  { ref: 'TXN-2025-0837', desc: 'External Consultant Fee',      amount: 2_750_000, date: 'Jul 22 2025', status: 'Review'    },
]

const fmt = (n: number) => 'UGX ' + n.toLocaleString()

function barColor(pct: number) {
  if (pct >= 90) return '#eb3b14'
  if (pct >= 75) return '#053664'
  return '#286b25'
}

function statusStyle(s: string): React.CSSProperties {
  if (s === 'Approved') return { backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25' }
  if (s === 'Pending')  return { backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14' }
  return { backgroundColor: '#e5eeff', color: '#002141' }
}

export function Finance() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.01em', color: '#002141' }}>Finance &amp; Budget</h1>
          <p style={{ fontSize: '16px', lineHeight: '24px', color: '#43474f', marginTop: '4px' }}>Fiscal Year 2025 — Budget utilisation overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/finance')}
            style={{ fontSize: '12px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,33,65,0.3)', color: '#002141', backgroundColor: '#ffffff' }}
            className="hover:bg-[#eff4ff] transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Export
          </button>
          <button style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', backgroundColor: '#053664', color: '#ffffff' }}
            className="hover:opacity-90 transition-opacity flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>New Expense
          </button>
        </div>
      </div>

      {/* ── KPI stat cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Budget',    value: 'UGX 128M',  icon: 'account_balance',  badge: null,       badgeTxt: '' },
          { label: 'Total Spent',     value: 'UGX 97.4M', icon: 'payments',         badge: 'warning',  badgeTxt: '76%' },
          { label: 'Remaining',       value: 'UGX 30.6M', icon: 'savings',          badge: 'ok',       badgeTxt: '24% left' },
          { label: 'Pending Approvals', value: '7',       icon: 'pending_actions',  badge: 'error',    badgeTxt: 'Action Req.' },
        ].map((card) => (
          <div key={card.label}
            style={{ backgroundColor: '#c1dbc3', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #a8c4aa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}
            className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#002141', textTransform: 'uppercase' }}>{card.label}</span>
              <span className="material-symbols-outlined" style={{ color: 'rgba(0,33,65,0.4)', fontSize: '22px' }}>{card.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', color: '#002141' }}>{card.value}</span>
              {card.badge === 'error' && <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14', padding: '4px 16px', borderRadius: '9999px' }}>{card.badgeTxt}</span>}
              {card.badge === 'ok'    && <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25', padding: '4px 16px', borderRadius: '9999px' }}>{card.badgeTxt}</span>}
              {card.badge === 'warning' && <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#e5eeff', color: '#002141', padding: '4px 16px', borderRadius: '9999px' }}>{card.badgeTxt}</span>}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Budget utilisation bars (2/3) ── */}
        <div className="lg:col-span-2"
          style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #c3c6d0' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#002141', marginBottom: '20px' }}>Budget Utilisation by Department</h3>
          <div className="space-y-5">
            {budgetLines.map((line) => (
              <div key={line.department}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#0b1c30' }}>{line.department}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: line.pct >= 90 ? '#eb3b14' : '#43474f' }}>{line.pct}%</span>
                </div>
                <div style={{ backgroundColor: '#e5eeff', borderRadius: '9999px', height: '10px' }}>
                  <div style={{ width: `${line.pct}%`, height: '10px', borderRadius: '9999px', backgroundColor: barColor(line.pct), transition: 'width 0.6s ease' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '11px', color: '#43474f' }}>Spent: {fmt(line.spent)}</span>
                  <span style={{ fontSize: '11px', color: '#43474f' }}>Budget: {fmt(line.allocated)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick stats (1/3) ── */}
        <div className="space-y-6">
          <div style={{ backgroundColor: '#053664', padding: '24px', borderRadius: '12px', color: '#ffffff', position: 'relative', overflow: 'hidden' }}
            className="group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform"
              style={{ position: 'absolute', bottom: '-16px', right: '-16px', fontSize: '100px', color: 'rgba(255,255,255,0.08)' }}>account_balance_wallet</span>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>Overall Burn Rate</p>
            <p style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px' }}>76%</p>
            <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>of annual budget utilised</p>
            <div style={{ marginTop: '16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '8px' }}>
              <div style={{ width: '76%', height: '8px', borderRadius: '9999px', backgroundColor: '#abf59d' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #c3c6d0' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#002141', marginBottom: '16px' }}>Payment Methods</h4>
            {[
              { method: 'MTN MoMo',     icon: 'smartphone', pct: 38, color: '#eb3b14' },
              { method: 'Airtel Money', icon: 'smartphone', pct: 22, color: '#053664' },
              { method: 'Bank Transfer',icon: 'account_balance', pct: 30, color: '#286b25' },
              { method: 'Flutterwave',  icon: 'credit_card', pct: 10, color: '#43474f' },
            ].map((pm) => (
              <div key={pm.method} className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined" style={{ color: pm.color, fontSize: '18px' }}>{pm.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#0b1c30' }}>{pm.method}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: pm.color }}>{pm.pct}%</span>
                  </div>
                  <div style={{ backgroundColor: '#e5eeff', borderRadius: '9999px', height: '6px' }}>
                    <div style={{ width: `${pm.pct}%`, height: '6px', borderRadius: '9999px', backgroundColor: pm.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions table ── */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #c3c6d0', marginTop: '32px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#002141' }}>Recent Transactions</h3>
          <button style={{ fontSize: '12px', fontWeight: 500, color: '#002141' }} className="hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#053664', color: '#ffffff' }}>
                {['Reference', 'Description', 'Amount (UGX)', 'Date', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx, i) => (
                <tr key={tx.ref} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }}
                  className="hover:bg-[#eff4ff] transition-colors">
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#002141', fontSize: '13px' }}>{tx.ref}</td>
                  <td style={{ padding: '10px 16px', color: '#0b1c30' }}>{tx.desc}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0b1c30' }}>{tx.amount.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', color: '#43474f', fontSize: '12px' }}>{tx.date}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ ...statusStyle(tx.status), fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '9999px' }}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
