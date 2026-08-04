const pipeline = [
  { id:'G-2025-01', title:'EU Land Rights Programme — Phase 3',     funder:'European Union',       amount:'EUR 480,000',    stage:'Implementation', pct:38, due:'Dec 2026', status:'Active'    },
  { id:'G-2025-02', title:'USAID Customary Land Documentation',      funder:'USAID',               amount:'USD 320,000',    stage:'Reporting',      pct:71, due:'Aug 2025', status:'Active'    },
  { id:'G-2024-04', title:'World Bank Land Governance Support',       funder:'World Bank',          amount:'USD 210,000',    stage:'Closeout',       pct:95, due:'Sep 2025', status:'Closing'   },
  { id:'G-2025-03', title:'DFID Climate & Land Use Study',           funder:'UK FCDO',             amount:'GBP 175,000',    stage:'Contracting',    pct:12, due:'Apr 2027', status:'Active'    },
  { id:'G-2025-04', title:'Nordic Fund — Women Land Rights',         funder:'Nordic Cooperation',  amount:'NOK 1,200,000',  stage:'Proposal',       pct:5,  due:'Mar 2026', status:'Pipeline'  },
  { id:'G-2024-02', title:'GIZ Urban Planning Support',              funder:'GIZ Germany',         amount:'EUR 95,000',     stage:'Completed',      pct:100,due:'Jun 2025', status:'Completed' },
]

const statusStyle = (s: string): React.CSSProperties => {
  if (s === 'Active')    return { backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25' }
  if (s === 'Completed') return { backgroundColor:'#e5eeff', color:'#002141' }
  if (s === 'Closing')   return { backgroundColor:'rgba(235,59,20,0.10)', color:'#eb3b14' }
  return { backgroundColor:'#f8f9ff', color:'#43474f' }
}

const stageSteps = ['Proposal','Contracting','Implementation','Reporting','Closeout','Completed']

export function Grants() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Grants Pipeline</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Donor funding, milestones and disbursement tracking</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>New Grant
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label:'Active Grants',     value:'4',         icon:'savings',         ok:true  },
          { label:'Total Portfolio',   value:'~UGX 5.1B', icon:'account_balance', ok:true  },
          { label:'Disbursed YTD',     value:'UGX 2.1B',  icon:'payments',        ok:true  },
          { label:'Due Reports',       value:'2',         icon:'assignment_late', ok:false },
        ].map((c) => (
          <div key={c.label}
            style={{ backgroundColor:'#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'128px' }}>
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color:'#002141', textTransform:'uppercase' }}>{c.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'rgba(0,33,65,0.4)' }}>{c.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize:'22px', fontWeight:600, color:'#002141' }}>{c.value}</span>
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor: c.ok ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: c.ok ? '#286b25' : '#eb3b14', padding:'4px 16px', borderRadius:'9999px' }}>{c.ok ? 'On track' : 'Action req.'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grant cards */}
      <div className="space-y-4">
        {pipeline.map((g) => {
          const stageIdx = stageSteps.indexOf(g.stage)
          return (
            <div key={g.id} style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', padding:'20px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05)' }}
              className="hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#053664' }}>{g.id}</span>
                    <span style={{ ...statusStyle(g.status), fontSize:'10px', fontWeight:700, padding:'2px 10px', borderRadius:'9999px' }}>{g.status}</span>
                  </div>
                  <p style={{ fontSize:'16px', fontWeight:600, color:'#0b1c30', marginBottom:'6px' }}>{g.title}</p>
                  <div className="flex flex-wrap gap-4">
                    {[['business',g.funder],['payments',g.amount],['calendar_today','Deadline: '+g.due]].map(([icon,val]) => (
                      <span key={icon as string} style={{ fontSize:'12px', color:'#43474f', display:'flex', alignItems:'center', gap:'4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>{icon}</span>{val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stage stepper */}
                <div style={{ minWidth:'300px' }}>
                  <div className="flex items-center gap-0">
                    {stageSteps.map((step, i) => {
                      const done   = i < stageIdx
                      const active = i === stageIdx
                      return (
                        <div key={step} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                          {i > 0 && <div style={{ position:'absolute', left:'-50%', right:'50%', top:'10px', height:'2px', backgroundColor: done ? '#053664' : '#c3c6d0', zIndex:0 }} />}
                          <div style={{ width:20, height:20, borderRadius:'9999px', backgroundColor: done ? '#053664' : active ? '#eb3b14' : '#c3c6d0', border:`2px solid ${done ? '#053664' : active ? '#eb3b14' : '#c3c6d0'}`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, flexShrink:0 }}>
                            {done && <span className="material-symbols-outlined" style={{ fontSize:'12px', color:'#ffffff' }}>check</span>}
                          </div>
                          <span style={{ fontSize:'9px', color: active ? '#eb3b14' : done ? '#053664' : '#43474f', fontWeight: active ? 700 : 400, textAlign:'center', marginTop:'3px', lineHeight:'12px' }}>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop:'14px' }}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize:'11px', color:'#43474f' }}>Implementation Progress</span>
                  <span style={{ fontSize:'11px', fontWeight:700, color: g.pct === 100 ? '#286b25' : '#002141' }}>{g.pct}%</span>
                </div>
                <div style={{ backgroundColor:'#e5eeff', borderRadius:'9999px', height:'8px' }}>
                  <div style={{ width:`${g.pct}%`, height:'8px', borderRadius:'9999px', backgroundColor: g.pct === 100 ? '#286b25' : g.pct >= 70 ? '#053664' : '#eb3b14', transition:'width 0.5s' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
