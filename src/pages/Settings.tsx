export function Settings() {
  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Settings</h1>
        <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>System configuration, integrations &amp; notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Integrations */}
          {[
            { section:'Email Integration', items:[
              { label:'Zoho Mail API',    icon:'mail',        status:'Connected',   detail:'zoho.mail.api@ardhi.go.ug' },
              { label:'SMTP/IMAP',        icon:'email',       status:'Connected',   detail:'smtp.ardhi.go.ug:587' },
            ]},
            { section:'Payment Gateways', items:[
              { label:'MTN MoMo',         icon:'smartphone',  status:'Active',      detail:'API v2 · Collection enabled' },
              { label:'Airtel Money',     icon:'smartphone',  status:'Active',      detail:'API v1 · Collection enabled' },
              { label:'Flutterwave',      icon:'credit_card', status:'Active',      detail:'Live mode · NGN/UGX' },
              { label:'Yo! Payments',     icon:'payments',    status:'Inactive',    detail:'Sandbox mode only' },
            ]},
            { section:'Storage & Search', items:[
              { label:'MinIO S3',         icon:'storage',     status:'Connected',   detail:'self-hosted · aims-bucket' },
              { label:'OpenSearch',       icon:'manage_search',status:'Connected',  detail:'v2.11 · full-text + OCR' },
            ]},
            { section:'Workflow Engine', items:[
              { label:'n8n Workflows',    icon:'device_hub',  status:'Running',     detail:'8 active workflows · port 5678' },
            ]},
          ].map((group) => (
            <div key={group.section} style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #c3c6d0', backgroundColor:'#f8f9ff' }}>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#002141' }}>{group.section}</p>
              </div>
              <div className="divide-y" style={{ borderColor:'#f0f0f0' }}>
                {group.items.map((item) => (
                  <div key={item.label} style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'#053664' }}>{item.icon}</span>
                      <div>
                        <p style={{ fontSize:'14px', fontWeight:600, color:'#0b1c30' }}>{item.label}</p>
                        <p style={{ fontSize:'12px', color:'#43474f' }}>{item.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize:'11px', fontWeight:700, backgroundColor: ['Connected','Active','Running'].includes(item.status) ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: ['Connected','Active','Running'].includes(item.status) ? '#286b25' : '#eb3b14', padding:'3px 12px', borderRadius:'9999px' }}>{item.status}</span>
                      <button style={{ color:'#43474f', background:'none', border:'none', cursor:'pointer' }} className="hover:text-[#053664]">
                        <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>settings</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: system info */}
        <div className="space-y-6">
          <div style={{ backgroundColor:'#053664', borderRadius:'12px', padding:'24px', color:'#ffffff', position:'relative', overflow:'hidden' }}>
            <span className="material-symbols-outlined" style={{ position:'absolute', bottom:'-20px', right:'-20px', fontSize:'120px', color:'rgba(255,255,255,0.06)' }}>info</span>
            <p style={{ fontSize:'14px', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', opacity:0.7, marginBottom:'16px' }}>System Information</p>
            {[
              ['AIMS Version',    'v1.0.0'],
              ['Frontend',        'React 18 + TypeScript'],
              ['Backend',         'FastAPI (Python 3.12)'],
              ['Database',        'PostgreSQL 15 + PostGIS'],
              ['Auth',            'Keycloak 24.x'],
              ['Storage',         'MinIO 2024-Q3'],
              ['Search',          'OpenSearch 2.11'],
              ['Workflow',        'n8n 1.48'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor:'rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize:'12px', opacity:0.7 }}>{k}</span>
                <span style={{ fontSize:'12px', fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', padding:'20px' }}>
            <p style={{ fontSize:'14px', fontWeight:700, color:'#002141', marginBottom:'14px' }}>Notification Preferences</p>
            {['Email alerts for approvals','SMS via MTN MoMo webhook','System maintenance notices','Research publication alerts'].map((pref) => (
              <label key={pref} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f0f0', cursor:'pointer' }}>
                <span style={{ fontSize:'13px', color:'#0b1c30' }}>{pref}</span>
                <div style={{ width:36, height:20, borderRadius:'9999px', backgroundColor:'#053664', position:'relative', flexShrink:0 }}>
                  <div style={{ width:16, height:16, borderRadius:'9999px', backgroundColor:'#ffffff', position:'absolute', right:2, top:2 }} />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
