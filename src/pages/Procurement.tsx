import { useState } from 'react'

const tenders = [
  { ref:'TDR-2025-041', title:'GIS Field Equipment Supply',         category:'ICT & Equipment',  value:'UGX 42,000,000',  deadline:'Aug 15 2025', status:'Open',   bids:6 },
  { ref:'TDR-2025-040', title:'Office Furniture & Fittings',        category:'Administration',   value:'UGX 18,500,000',  deadline:'Aug 10 2025', status:'Open',   bids:9 },
  { ref:'TDR-2025-039', title:'Research Data Collection Services',  category:'Professional Svcs',value:'UGX 85,000,000',  deadline:'Sep 1 2025',  status:'Open',   bids:3 },
  { ref:'TDR-2025-038', title:'Vehicle Hire — Field Operations',    category:'Transport',        value:'UGX 24,000,000',  deadline:'Jul 30 2025', status:'Closed', bids:11 },
  { ref:'TDR-2025-037', title:'IT Consultancy & Systems Audit',     category:'ICT & Equipment',  value:'UGX 55,000,000',  deadline:'Jul 20 2025', status:'Awarded',bids:5 },
]

const lpos = [
  { lpo:'LPO-2025-0089', supplier:'TechVision Uganda Ltd',    item:'Survey GPS Units x4',        amount:'UGX 4,200,000', date:'Jul 28', status:'Approved' },
  { lpo:'LPO-2025-0088', supplier:'Stationery House Ltd',     item:'Office Supplies Q3',          amount:'UGX 340,000',  date:'Jul 24', status:'Approved' },
  { lpo:'LPO-2025-0087', supplier:'Green Transport Co.',      item:'Vehicle hire July',           amount:'UGX 1,800,000',date:'Jul 20', status:'Pending'  },
  { lpo:'LPO-2025-0086', supplier:'Kampala Printing Press',   item:'Annual Reports 500 copies',   amount:'UGX 920,000',  date:'Jul 15', status:'Approved' },
]

const statusStyle = (s: string): React.CSSProperties => {
  if (s === 'Open')     return { backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25' }
  if (s === 'Approved') return { backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25' }
  if (s === 'Awarded')  return { backgroundColor:'#e5eeff', color:'#002141' }
  if (s === 'Closed')   return { backgroundColor:'#f8f9ff', color:'#43474f' }
  return { backgroundColor:'rgba(235,59,20,0.10)', color:'#eb3b14' }
}

export function Procurement() {
  const [tab, setTab] = useState<'Tenders'|'LPOs'>('Tenders')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Procurement</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Tenders, LPOs and supplier management</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>New Tender
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label:'Open Tenders',    value:'3',         icon:'gavel',          badge:'Active',   ok:true  },
          { label:'Total LPOs YTD',  value:'89',        icon:'receipt_long',   badge:'FY 2025',  ok:true  },
          { label:'Pending Approval',value:'7',         icon:'pending_actions',badge:'Req. Action', ok:false },
          { label:'Budget Committed',value:'UGX 228M',  icon:'payments',       badge:'68% used', ok:true  },
        ].map((c) => (
          <div key={c.label}
            style={{ backgroundColor:'#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'128px' }}
            className="hover:shadow-md">
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color:'#002141', textTransform:'uppercase' }}>{c.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'rgba(0,33,65,0.4)' }}>{c.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize:'24px', fontWeight:600, color:'#002141' }}>{c.value}</span>
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor: c.ok ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: c.ok ? '#286b25' : '#eb3b14', padding:'4px 16px', borderRadius:'9999px' }}>{c.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:'1px solid #c3c6d0' }}>
          {(['Tenders','LPOs'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'12px 24px', fontSize:'14px', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#002141' : '#43474f', borderBottom: tab === t ? '2px solid #053664' : '2px solid transparent', background:'none', cursor:'pointer', transition:'color 0.15s' }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding:'0' }}>
          {tab === 'Tenders' && (
            <table style={{ width:'100%', fontSize:'14px', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ backgroundColor:'#053664', color:'#ffffff' }}>
                  {['Reference','Title','Category','Estimated Value','Deadline','Bids','Status'].map((h) => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'12px', fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenders.map((t, i) => (
                  <tr key={t.ref} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#053664', fontSize:'13px' }}>{t.ref}</td>
                    <td style={{ padding:'12px 16px', fontWeight:500, color:'#0b1c30' }}>{t.title}</td>
                    <td style={{ padding:'12px 16px', color:'#43474f', fontSize:'12px' }}>{t.category}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#0b1c30' }}>{t.value}</td>
                    <td style={{ padding:'12px 16px', color:'#43474f', fontSize:'12px' }}>{t.deadline}</td>
                    <td style={{ padding:'12px 16px', textAlign:'center', fontWeight:700, color:'#002141' }}>{t.bids}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ ...statusStyle(t.status), fontSize:'11px', fontWeight:700, padding:'3px 12px', borderRadius:'9999px' }}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'LPOs' && (
            <table style={{ width:'100%', fontSize:'14px', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ backgroundColor:'#053664', color:'#ffffff' }}>
                  {['LPO No.','Supplier','Item / Service','Amount','Date','Status'].map((h) => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'12px', fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lpos.map((l, i) => (
                  <tr key={l.lpo} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#053664', fontSize:'13px' }}>{l.lpo}</td>
                    <td style={{ padding:'12px 16px', fontWeight:500, color:'#0b1c30' }}>{l.supplier}</td>
                    <td style={{ padding:'12px 16px', color:'#43474f' }}>{l.item}</td>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'#0b1c30' }}>{l.amount}</td>
                    <td style={{ padding:'12px 16px', color:'#43474f', fontSize:'12px' }}>{l.date}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ ...statusStyle(l.status), fontSize:'11px', fontWeight:700, padding:'3px 12px', borderRadius:'9999px' }}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
