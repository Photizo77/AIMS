import { useState } from 'react'

type Filter = 'All' | 'Pending' | 'Approved' | 'Rejected'

interface Request {
  id: string
  ref: string
  type: string
  submittedBy: string
  department: string
  date: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Pending' | 'Approved' | 'Rejected' | 'Review'
  description: string
}

const requests: Request[] = [
  { id:'a1', ref:'REQ-2025-0441', type:'Land Transfer Deed',    submittedBy:'Peter Okello',    department:'Land Registry',  date:'Aug 1 2025',  priority:'High',   status:'Pending',  description:'Transfer of Title for Parcel #4529-B, Gulu District.' },
  { id:'a2', ref:'REQ-2025-0440', type:'Leave Application',     submittedBy:'Grace Atim',      department:'Research',       date:'Jul 31 2025', priority:'Medium', status:'Pending',  description:'Annual leave request — 10 days from Aug 11.' },
  { id:'a3', ref:'REQ-2025-0439', type:'Procurement LPO',       submittedBy:'Mark Tumwine',    department:'Procurement',    date:'Jul 30 2025', priority:'High',   status:'Review',   description:'LPO #0089 for field survey equipment supply — UGX 4.2M.' },
  { id:'a4', ref:'REQ-2025-0438', type:'Budget Reallocation',   submittedBy:'Jane Doe',        department:'Finance',        date:'Jul 29 2025', priority:'High',   status:'Pending',  description:'Reallocation of UGX 1.5M from Admin to ICT line item.' },
  { id:'a5', ref:'REQ-2025-0437', type:'HR Contract Extension',  submittedBy:'Admin User',      department:'HR',             date:'Jul 28 2025', priority:'Medium', status:'Approved', description:'2-year contract renewal for consultant engagement.' },
  { id:'a6', ref:'REQ-2025-0436', type:'Research Grant Release', submittedBy:'David Mugisha',   department:'Research',       date:'Jul 25 2025', priority:'Low',    status:'Approved', description:'Phase 2 grant disbursement — EU Land Rights Programme.' },
  { id:'a7', ref:'REQ-2025-0435', type:'Travel Advance',        submittedBy:'Alice Nakato',    department:'Field Ops',      date:'Jul 22 2025', priority:'Medium', status:'Rejected', description:'Travel advance for Mbarara field mission — UGX 850K.' },
]

const priorityStyle = (p: string): React.CSSProperties => {
  if (p === 'High')   return { backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14' }
  if (p === 'Medium') return { backgroundColor: '#e5eeff', color: '#002141' }
  return { backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25' }
}

const statusStyle = (s: string): React.CSSProperties => {
  if (s === 'Approved') return { backgroundColor: 'rgba(40,107,37,0.10)', color: '#286b25' }
  if (s === 'Pending')  return { backgroundColor: 'rgba(235,59,20,0.10)', color: '#eb3b14' }
  if (s === 'Rejected') return { backgroundColor: '#ffdad6', color: '#ba1a1a' }
  return { backgroundColor: '#e5eeff', color: '#002141' }
}

export function Approvals() {
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<Request | null>(null)
  const [data, setData]     = useState(requests)

  const filtered = filter === 'All' ? data : data.filter((r) => r.status === filter)

  function act(id: string, action: 'Approved' | 'Rejected') {
    setData((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r))
    setSelected(null)
  }

  const counts = {
    All:      data.length,
    Pending:  data.filter((r) => r.status === 'Pending').length,
    Approved: data.filter((r) => r.status === 'Approved').length,
    Rejected: data.filter((r) => r.status === 'Rejected').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Approval Request Center</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Review, approve or reject pending requests</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>New Request
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {([['All','inbox','#e5eeff','#002141'],['Pending','pending_actions','rgba(235,59,20,0.10)','#eb3b14'],['Approved','check_circle','rgba(40,107,37,0.10)','#286b25'],['Rejected','cancel','#ffdad6','#ba1a1a']] as const).map(([lbl,icon]) => (
          <div key={lbl}
            onClick={() => setFilter(lbl as Filter)}
            style={{ backgroundColor: filter === lbl ? '#053664' : '#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', cursor:'pointer', transition:'all 0.15s', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'112px' }}
            className="hover:shadow-md">
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color: filter === lbl ? '#ffffff' : '#002141', textTransform:'uppercase' }}>{lbl}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color: filter === lbl ? 'rgba(255,255,255,0.6)' : 'rgba(0,33,65,0.4)' }}>{icon}</span>
            </div>
            <span style={{ fontSize:'28px', fontWeight:600, color: filter === lbl ? '#ffffff' : '#002141' }}>{counts[lbl as Filter]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request list */}
        <div className="lg:col-span-2">
          <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #c3c6d0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontSize:'16px', fontWeight:600, color:'#002141' }}>
                {filter} Requests <span style={{ fontSize:'12px', fontWeight:500, color:'#43474f', marginLeft:'8px' }}>({filtered.length})</span>
              </h3>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ border:'1px solid #c3c6d0', backgroundColor:'#f8f9ff' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#43474f' }}>search</span>
                <input placeholder="Search…" style={{ border:'none', outline:'none', fontSize:'13px', background:'transparent', color:'#0b1c30', width:'140px' }} />
              </div>
            </div>

            <div className="divide-y" style={{ borderColor:'#f0f0f0' }}>
              {filtered.map((req) => (
                <div key={req.id}
                  onClick={() => setSelected(req)}
                  style={{ padding:'16px 20px', cursor:'pointer', backgroundColor: selected?.id === req.id ? '#eff4ff' : '#ffffff', transition:'background 0.1s' }}
                  className="hover:bg-[#eff4ff]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span style={{ fontSize:'12px', fontWeight:700, color:'#053664' }}>{req.ref}</span>
                        <span style={{ ...priorityStyle(req.priority), fontSize:'10px', fontWeight:700, padding:'2px 10px', borderRadius:'9999px' }}>{req.priority}</span>
                      </div>
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#0b1c30', marginBottom:'3px' }}>{req.type}</p>
                      <p style={{ fontSize:'12px', color:'#43474f' }}>{req.submittedBy} · {req.department} · {req.date}</p>
                    </div>
                    <span style={{ ...statusStyle(req.status), fontSize:'11px', fontWeight:700, padding:'3px 12px', borderRadius:'9999px', flexShrink:0 }}>{req.status}</span>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding:'48px', textAlign:'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'40px', color:'#c3c6d0' }}>inbox</span>
                  <p style={{ fontSize:'14px', color:'#43474f', marginTop:'8px' }}>No {filter.toLowerCase()} requests</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden', position:'sticky', top:'80px' }}>
              <div style={{ backgroundColor:'#053664', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#ffffff' }}>{selected.ref}</span>
                <button onClick={() => setSelected(null)} style={{ color:'rgba(255,255,255,0.6)', background:'none', border:'none', cursor:'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'20px' }}>close</span>
                </button>
              </div>
              <div style={{ padding:'20px' }}>
                <p style={{ fontSize:'18px', fontWeight:600, color:'#002141', marginBottom:'4px' }}>{selected.type}</p>
                <span style={{ ...statusStyle(selected.status), fontSize:'11px', fontWeight:700, padding:'3px 12px', borderRadius:'9999px' }}>{selected.status}</span>

                <div className="space-y-3 mt-5">
                  {[
                    { label:'Submitted By', value: selected.submittedBy },
                    { label:'Department',   value: selected.department  },
                    { label:'Date',         value: selected.date        },
                    { label:'Priority',     value: selected.priority    },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span style={{ fontSize:'12px', color:'#43474f' }}>{row.label}</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#0b1c30' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor:'#f8f9ff', borderRadius:'8px', padding:'14px', marginTop:'16px', border:'1px solid #e5eeff' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'#43474f', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Description</p>
                  <p style={{ fontSize:'14px', color:'#0b1c30', lineHeight:'20px' }}>{selected.description}</p>
                </div>

                {selected.status === 'Pending' || selected.status === 'Review' ? (
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => act(selected.id, 'Approved')}
                      style={{ flex:1, padding:'10px', borderRadius:'8px', backgroundColor:'#286b25', color:'#ffffff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}
                      className="hover:opacity-90 active:scale-95 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>check</span>Approve
                    </button>
                    <button onClick={() => act(selected.id, 'Rejected')}
                      style={{ flex:1, padding:'10px', borderRadius:'8px', backgroundColor:'#ba1a1a', color:'#ffffff', fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer' }}
                      className="hover:opacity-90 active:scale-95 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>close</span>Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop:'16px', padding:'12px', borderRadius:'8px', border:'1px solid #c3c6d0', textAlign:'center' }}>
                    <span style={{ fontSize:'13px', color:'#43474f' }}>This request has been <strong style={{ color: selected.status === 'Approved' ? '#286b25' : '#ba1a1a' }}>{selected.status.toLowerCase()}</strong>.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor:'#f8f9ff', borderRadius:'12px', border:'2px dashed #c3c6d0', padding:'40px', textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'48px', color:'#c3c6d0' }}>touch_app</span>
              <p style={{ fontSize:'14px', color:'#43474f', marginTop:'12px' }}>Select a request to review details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
