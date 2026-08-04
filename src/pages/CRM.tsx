import { useState } from 'react'

const stakeholders = [
  { id:'s1', name:'Ministry of Lands, Housing & Urban Dev.',  type:'Government',   contact:'commissioner@molhud.go.ug',    phone:'+256 414 373 511', status:'Active',     lastContact:'Jul 30 2025' },
  { id:'s2', name:'UN-Habitat Uganda',                        type:'Development',  contact:'habitat.ug@unhabitat.org',     phone:'+256 312 265 000', status:'Active',     lastContact:'Jul 28 2025' },
  { id:'s3', name:'Kampala Capital City Authority',           type:'Government',   contact:'info@kcca.go.ug',              phone:'+256 417 771 100', status:'Active',     lastContact:'Jul 25 2025' },
  { id:'s4', name:'World Bank – Land Governance Program',     type:'Development',  contact:'lgaf@worldbank.org',           phone:'+1 202 473 1000',  status:'Active',     lastContact:'Jul 20 2025' },
  { id:'s5', name:'Uganda Land Alliance',                     type:'Civil Society',contact:'info@ulaug.org',               phone:'+256 414 531 419', status:'Active',     lastContact:'Jul 15 2025' },
  { id:'s6', name:'Makerere University – Faculty of Law',     type:'Academic',     contact:'lawfaculty@mak.ac.ug',         phone:'+256 414 542 700', status:'Inactive',   lastContact:'Jun 10 2025' },
]

const typeColors: Record<string,{bg:string,col:string}> = {
  Government:   { bg:'#e5eeff',                        col:'#002141' },
  Development:  { bg:'rgba(40,107,37,0.10)',            col:'#286b25' },
  'Civil Society':{ bg:'rgba(235,59,20,0.10)',          col:'#eb3b14' },
  Academic:     { bg:'#ffdad6',                         col:'#ba1a1a' },
}

const interactions = [
  { date:'Jul 30', type:'Meeting',   note:'Quarterly review of land registration targets with MoLHUD.',       stakeholder:'Ministry of Lands' },
  { date:'Jul 28', type:'Email',     note:'Shared Q2 progress report and upcoming field mission schedule.',    stakeholder:'UN-Habitat Uganda' },
  { date:'Jul 25', type:'Call',      note:'Discussed KCCA boundary harmonisation protocol.',                  stakeholder:'KCCA' },
  { date:'Jul 20', type:'Workshop',  note:'Land governance framework co-design session — 3 ARDHI staff.',     stakeholder:'World Bank' },
]

export function CRM() {
  const [selected, setSelected] = useState<typeof stakeholders[0] | null>(null)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>CRM &amp; Stakeholders</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Partners, government bodies &amp; engagement history</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>Add Stakeholder
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label:'Total Stakeholders', value:'24',   icon:'groups',       ok:true },
          { label:'Government Bodies',  value:'8',    icon:'account_balance', ok:true },
          { label:'Development Partners',value:'6',   icon:'handshake',    ok:true },
          { label:'Pending Follow-ups', value:'5',    icon:'schedule',     ok:false },
        ].map((c) => (
          <div key={c.label}
            style={{ backgroundColor:'#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'128px' }}>
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color:'#002141', textTransform:'uppercase' }}>{c.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'rgba(0,33,65,0.4)' }}>{c.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize:'24px', fontWeight:600, color:'#002141' }}>{c.value}</span>
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor: c.ok ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: c.ok ? '#286b25' : '#eb3b14', padding:'4px 16px', borderRadius:'9999px' }}>{c.ok ? 'On track' : 'Action req.'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stakeholder list */}
        <div className="lg:col-span-2">
          <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #c3c6d0' }}>
              <h3 style={{ fontSize:'16px', fontWeight:600, color:'#002141' }}>Stakeholder Directory</h3>
            </div>
            <div className="divide-y" style={{ borderColor:'#f0f0f0' }}>
              {stakeholders.map((s) => (
                <div key={s.id} onClick={() => setSelected(s)}
                  style={{ padding:'16px 20px', cursor:'pointer', backgroundColor: selected?.id === s.id ? '#eff4ff' : '#ffffff', transition:'background 0.1s' }}
                  className="hover:bg-[#eff4ff]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div style={{ width:40, height:40, borderRadius:'10px', backgroundColor: typeColors[s.type]?.bg || '#e5eeff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize:'20px', color: typeColors[s.type]?.col || '#002141' }}>business</span>
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontSize:'14px', fontWeight:600, color:'#0b1c30', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span style={{ ...typeColors[s.type], fontSize:'10px', fontWeight:700, padding:'1px 8px', borderRadius:'9999px' }}>{s.type}</span>
                          <span style={{ fontSize:'11px', color:'#43474f' }}>Last contact: {s.lastContact}</span>
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:700, backgroundColor: s.status === 'Active' ? 'rgba(40,107,37,0.10)' : '#f8f9ff', color: s.status === 'Active' ? '#286b25' : '#43474f', padding:'3px 10px', borderRadius:'9999px', flexShrink:0 }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail + interactions */}
        <div className="space-y-6">
          {selected ? (
            <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
              <div style={{ backgroundColor:'#053664', padding:'16px 20px' }}>
                <p style={{ fontSize:'15px', fontWeight:700, color:'#ffffff' }}>{selected.name}</p>
                <span style={{ ...typeColors[selected.type], fontSize:'10px', fontWeight:700, padding:'2px 10px', borderRadius:'9999px', marginTop:'4px', display:'inline-block' }}>{selected.type}</span>
              </div>
              <div style={{ padding:'16px 20px' }} className="space-y-3">
                {[['email',selected.contact],['phone',selected.phone],['calendar_today','Last: '+selected.lastContact]].map(([icon,val]) => (
                  <div key={icon} className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#43474f' }}>{icon}</span>
                    <span style={{ fontSize:'13px', color:'#0b1c30' }}>{val}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button style={{ flex:1, padding:'8px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer' }} className="hover:opacity-90 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>mail</span>Email
                  </button>
                  <button style={{ flex:1, padding:'8px', borderRadius:'8px', border:'1px solid #053664', color:'#053664', fontSize:'12px', fontWeight:700, background:'transparent', cursor:'pointer' }} className="hover:bg-[#e5eeff] flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>Log
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor:'#f8f9ff', borderRadius:'12px', border:'2px dashed #c3c6d0', padding:'32px', textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'40px', color:'#c3c6d0' }}>touch_app</span>
              <p style={{ fontSize:'13px', color:'#43474f', marginTop:'8px' }}>Select a stakeholder to view details</p>
            </div>
          )}

          {/* Recent interactions */}
          <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #c3c6d0' }}>
              <h3 style={{ fontSize:'15px', fontWeight:600, color:'#002141' }}>Recent Interactions</h3>
            </div>
            <div className="divide-y" style={{ borderColor:'#f0f0f0' }}>
              {interactions.map((n, i) => (
                <div key={i} style={{ padding:'12px 20px' }}>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize:'18px', color:'#053664', flexShrink:0, marginTop:'1px' }}>
                      {n.type === 'Meeting' ? 'groups' : n.type === 'Email' ? 'mail' : n.type === 'Call' ? 'call' : 'event'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize:'11px', fontWeight:700, color:'#053664' }}>{n.type}</span>
                        <span style={{ fontSize:'11px', color:'#43474f' }}>{n.date}</span>
                      </div>
                      <p style={{ fontSize:'12px', color:'#43474f', marginTop:'2px', lineHeight:'16px' }}>{n.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
