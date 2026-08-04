import { useState } from 'react'

const projects = [
  { id:'R-2025-01', title:'Land Rights & Tenure Security in Northern Uganda',     lead:'Dr. Grace Atim',   funder:'EU',           budget:'UGX 480M', start:'Jan 2025', end:'Dec 2026', status:'Active',   pct:38 },
  { id:'R-2025-02', title:'Urban Land Use Patterns — Kampala Metropolitan Area',  lead:'Dr. Peter Oryem',  funder:'World Bank',   budget:'UGX 210M', start:'Mar 2025', end:'Feb 2026', status:'Active',   pct:22 },
  { id:'R-2024-05', title:'GIS Mapping of Wetland Encroachments',                 lead:'Alice Nakato',     funder:'NEMA/ARDHI',  budget:'UGX 95M',  start:'Jun 2024', end:'Jun 2025', status:'Completed',pct:100 },
  { id:'R-2024-04', title:'Customary Land Ownership Documentation Project',       lead:'Mark Tumwine',     funder:'USAID',        budget:'UGX 320M', start:'Sep 2024', end:'Aug 2025', status:'Active',   pct:71 },
  { id:'R-2025-03', title:'Climate Change & Agricultural Land Use Study',          lead:'Dr. Sarah Odur',   funder:'DFID',         budget:'UGX 175M', start:'May 2025', end:'Apr 2027', status:'Planning', pct:5  },
]

const publications = [
  { title:'Tenure Insecurity and Agricultural Productivity in Uganda', journal:'Land Use Policy', year:2025, authors:'Atim, G. et al.' },
  { title:'Urban Sprawl and Informal Settlements in Kampala', journal:'ARDHI Research Papers', year:2024, authors:'Oryem, P. & Nakato, A.' },
  { title:'Customary vs Statutory Land Rights: A Comparative Study', journal:'African Land Studies', year:2024, authors:'Tumwine, M.' },
]

const statusStyle = (s: string): React.CSSProperties => {
  if (s === 'Active')     return { backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25' }
  if (s === 'Completed')  return { backgroundColor:'#e5eeff', color:'#002141' }
  return { backgroundColor:'rgba(235,59,20,0.10)', color:'#eb3b14' }
}

export function Research() {
  const [tab, setTab] = useState<'Projects'|'Publications'|'GIS'>('Projects')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Research</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Research projects, publications &amp; spatial mapping data</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>New Project
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label:'Active Projects',    value:'4',   icon:'science',      ok:true,  badge:'2025' },
          { label:'Total Budget',       value:'UGX 1.08B', icon:'savings', ok:true, badge:'All sources' },
          { label:'Publications',       value:'12',  icon:'menu_book',    ok:true,  badge:'Since 2022' },
          { label:'GIS Datasets',       value:'28',  icon:'map',          ok:true,  badge:'PostGIS' },
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
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25', padding:'4px 16px', borderRadius:'9999px' }}>{c.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:'1px solid #c3c6d0' }}>
          {(['Projects','Publications','GIS'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'12px 24px', fontSize:'14px', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#002141' : '#43474f', borderBottom: tab === t ? '2px solid #053664' : '2px solid transparent', background:'none', cursor:'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Projects' && (
          <div style={{ padding:'24px' }} className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} style={{ border:'1px solid #c3c6d0', borderRadius:'10px', padding:'18px', backgroundColor:'#f8f9ff' }} className="hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize:'12px', fontWeight:700, color:'#053664' }}>{p.id}</span>
                      <span style={{ ...statusStyle(p.status), fontSize:'10px', fontWeight:700, padding:'2px 10px', borderRadius:'9999px' }}>{p.status}</span>
                    </div>
                    <p style={{ fontSize:'15px', fontWeight:600, color:'#0b1c30', marginBottom:'6px' }}>{p.title}</p>
                    <div className="flex flex-wrap gap-4">
                      {[['person',p.lead],['business',p.funder],['savings',p.budget],['calendar_today',`${p.start} – ${p.end}`]].map(([icon,val]) => (
                        <span key={icon as string} style={{ fontSize:'12px', color:'#43474f', display:'flex', alignItems:'center', gap:'4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>{icon}</span>{val}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ minWidth:'120px', textAlign:'right' }}>
                    <span style={{ fontSize:'20px', fontWeight:700, color: p.pct === 100 ? '#286b25' : '#002141' }}>{p.pct}%</span>
                    <div style={{ backgroundColor:'#e5eeff', borderRadius:'9999px', height:'6px', marginTop:'6px' }}>
                      <div style={{ width:`${p.pct}%`, height:'6px', borderRadius:'9999px', backgroundColor: p.pct === 100 ? '#286b25' : p.pct >= 50 ? '#053664' : '#eb3b14' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Publications' && (
          <div style={{ padding:'24px' }} className="space-y-4">
            {publications.map((pub, i) => (
              <div key={i} style={{ border:'1px solid #c3c6d0', borderRadius:'10px', padding:'18px', backgroundColor:'#f8f9ff' }} className="hover:bg-[#eff4ff] cursor-pointer transition-colors">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'#053664', flexShrink:0 }}>article</span>
                  <div>
                    <p style={{ fontSize:'15px', fontWeight:600, color:'#0b1c30', marginBottom:'4px' }}>{pub.title}</p>
                    <p style={{ fontSize:'13px', color:'#43474f' }}>{pub.authors}</p>
                    <div className="flex gap-3 mt-2">
                      <span style={{ fontSize:'11px', backgroundColor:'#e5eeff', color:'#002141', padding:'2px 10px', borderRadius:'9999px', fontWeight:600 }}>{pub.journal}</span>
                      <span style={{ fontSize:'11px', backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25', padding:'2px 10px', borderRadius:'9999px', fontWeight:600 }}>{pub.year}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'GIS' && (
          <div style={{ padding:'24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'280px', gap:'16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'64px', color:'#c3c6d0' }}>map</span>
            <p style={{ fontSize:'16px', fontWeight:600, color:'#43474f' }}>PostGIS Spatial Data Viewer</p>
            <p style={{ fontSize:'14px', color:'#43474f', textAlign:'center', maxWidth:'400px' }}>Interactive mapping powered by PostGIS. 28 active datasets including land parcels, wetlands, urban boundaries and survey waypoints.</p>
            <button style={{ padding:'10px 24px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', fontSize:'13px', fontWeight:700 }} className="hover:opacity-90">
              Launch Map Viewer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
