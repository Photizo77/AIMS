const kpis = [
  { label:'Land Parcels Registered', value:'14,820', change:'+312 this month', up:true,  icon:'landscape'    },
  { label:'Active Staff',            value:'187',    change:'+5 since Jul',    up:true,  icon:'group'        },
  { label:'Grants Disbursed',        value:'UGX 2.1B', change:'FY 2025',       up:true,  icon:'savings'      },
  { label:'Compliance Rate',         value:'94.2%',  change:'-0.8% vs Q2',    up:false, icon:'verified'     },
]

const regionalData = [
  { region:'Kampala',  parcels:4820, pct:82, staff:62 },
  { region:'Gulu',     parcels:2140, pct:65, staff:28 },
  { region:'Mbarara',  parcels:3010, pct:74, staff:34 },
  { region:'Jinja',    parcels:1950, pct:58, staff:22 },
  { region:'Fort Portal', parcels:1640, pct:51, staff:18 },
  { region:'Arua',     parcels:1260, pct:44, staff:14 },
]

const monthlyReg = [52,64,48,71,83,90,76,88,95,102,87,78]
const months     = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul']
const maxReg     = Math.max(...monthlyReg)

export function Analytics() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Analytics &amp; Reports</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Strategic insights — FY 2025 performance dashboard</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>download</span>Export PDF
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((k) => (
          <div key={k.label}
            style={{ backgroundColor:'#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'128px' }}
            className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color:'#002141', textTransform:'uppercase' }}>{k.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'rgba(0,33,65,0.4)' }}>{k.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize:'24px', fontWeight:600, lineHeight:'32px', color:'#002141' }}>{k.value}</span>
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor: k.up ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: k.up ? '#286b25' : '#eb3b14', padding:'4px 16px', borderRadius:'9999px', whiteSpace:'nowrap' }}>
                {k.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Bar chart — monthly registrations */}
        <div className="lg:col-span-2"
          style={{ backgroundColor:'#ffffff', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #c3c6d0' }}>
          <h3 style={{ fontSize:'20px', fontWeight:600, lineHeight:'28px', color:'#002141', marginBottom:'20px' }}>Monthly Land Registrations (Aug 2024 – Jul 2025)</h3>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', height:'180px', paddingBottom:'8px' }}>
            {monthlyReg.map((val, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontSize:'10px', color:'#43474f', fontWeight:600 }}>{val}</span>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', backgroundColor: i === 11 ? '#053664' : '#c1dbc3', border:'1px solid #a8c4aa', height:`${(val/maxReg)*140}px`, transition:'height 0.5s ease', minHeight:'8px' }} />
                <span style={{ fontSize:'9px', color:'#43474f' }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doughnut-style compliance */}
        <div style={{ backgroundColor:'#ffffff', padding:'24px', borderRadius:'12px', border:'1px solid #c3c6d0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px' }}>
          <h3 style={{ fontSize:'20px', fontWeight:600, color:'#002141', alignSelf:'flex-start' }}>Compliance Rate</h3>
          <div style={{ position:'relative', width:'160px', height:'160px' }}>
            <svg viewBox="0 0 36 36" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5eeff" strokeWidth="3.5"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#053664" strokeWidth="3.5"
                strokeDasharray={`${94.2} ${100 - 94.2}`} strokeLinecap="round"/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:'28px', fontWeight:800, color:'#002141', lineHeight:1 }}>94.2%</span>
              <span style={{ fontSize:'11px', color:'#43474f', marginTop:'2px' }}>Overall</span>
            </div>
          </div>
          <div className="space-y-2 w-full">
            {[['Registrations','98%','#286b25'],['HR Compliance','91%','#053664'],['Financial','96%','#286b25'],['Procurement','88%','#eb3b14']].map(([l,v,c]) => (
              <div key={l} className="flex items-center gap-2">
                <span style={{ width:10, height:10, borderRadius:'9999px', backgroundColor:c, flexShrink:0 }} />
                <span style={{ fontSize:'12px', flex:1, color:'#0b1c30' }}>{l}</span>
                <span style={{ fontSize:'12px', fontWeight:700, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional breakdown table */}
      <div style={{ backgroundColor:'#ffffff', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #c3c6d0' }}>
        <h3 style={{ fontSize:'20px', fontWeight:600, color:'#002141', marginBottom:'16px' }}>Regional Performance</h3>
        <table style={{ width:'100%', fontSize:'14px', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ backgroundColor:'#053664', color:'#ffffff' }}>
              {['Region','Parcels Registered','Target Progress','Active Staff'].map((h) => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'12px', fontWeight:700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regionalData.map((row, i) => (
              <tr key={row.region} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                <td style={{ padding:'10px 16px', fontWeight:600, color:'#0b1c30' }}>{row.region}</td>
                <td style={{ padding:'10px 16px', color:'#43474f' }}>{row.parcels.toLocaleString()}</td>
                <td style={{ padding:'10px 16px', width:'240px' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ flex:1, backgroundColor:'#e5eeff', borderRadius:'9999px', height:'8px' }}>
                      <div style={{ width:`${row.pct}%`, height:'8px', borderRadius:'9999px', backgroundColor: row.pct >= 80 ? '#286b25' : row.pct >= 60 ? '#053664' : '#eb3b14' }} />
                    </div>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#43474f', minWidth:'32px' }}>{row.pct}%</span>
                  </div>
                </td>
                <td style={{ padding:'10px 16px', color:'#43474f' }}>{row.staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
