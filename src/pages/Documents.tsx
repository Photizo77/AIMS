import { useState } from 'react'

type ViewMode = 'grid' | 'list'

interface Doc {
  id: string
  name: string
  type: string
  size: string
  modified: string
  owner: string
  tags: string[]
  icon: string
  iconColor: string
}

const docs: Doc[] = [
  { id:'d1', name:'Land_Title_Deed_001.pdf',           type:'PDF',  size:'2.4 MB',  modified:'2h ago',   owner:'D. Mugisha', tags:['Land','Legal'],       icon:'picture_as_pdf',  iconColor:'#eb3b14' },
  { id:'d2', name:'Quarterly_Financial_Report.xlsx',   type:'XLSX', size:'1.1 MB',  modified:'5h ago',   owner:'J. Doe',     tags:['Finance','Q3'],       icon:'table_chart',     iconColor:'#286b25' },
  { id:'d3', name:'HR_Policy_Updates_v2.docx',         type:'DOCX', size:'480 KB',  modified:'1d ago',   owner:'HR Dept',    tags:['HR','Policy'],        icon:'description',     iconColor:'#053664' },
  { id:'d4', name:'Procurement_Tender_2025-04.pdf',    type:'PDF',  size:'3.8 MB',  modified:'2d ago',   owner:'P. Okello',  tags:['Procurement'],        icon:'picture_as_pdf',  iconColor:'#eb3b14' },
  { id:'d5', name:'GIS_SurveyMap_KLA-Q3.geojson',     type:'GEO',  size:'14.2 MB', modified:'3d ago',   owner:'GIS Unit',   tags:['Survey','GIS'],       icon:'map',             iconColor:'#4caf50' },
  { id:'d6', name:'Board_Resolution_Jul2025.pdf',      type:'PDF',  size:'320 KB',  modified:'4d ago',   owner:'Secretariat',tags:['Governance'],         icon:'picture_as_pdf',  iconColor:'#eb3b14' },
  { id:'d7', name:'Research_Baseline_Report.pdf',      type:'PDF',  size:'6.1 MB',  modified:'5d ago',   owner:'G. Atim',    tags:['Research'],           icon:'science',         iconColor:'#4caf50' },
  { id:'d8', name:'Staff_Roster_July2025.xlsx',        type:'XLSX', size:'540 KB',  modified:'1w ago',   owner:'HR Dept',    tags:['HR','Roster'],        icon:'table_chart',     iconColor:'#286b25' },
  { id:'d9', name:'Meeting_Minutes_ExecComm.docx',     type:'DOCX', size:'210 KB',  modified:'1w ago',   owner:'Secretariat',tags:['Governance','Exec'],  icon:'description',     iconColor:'#053664' },
]

const folders = ['Land Registry', 'Finance', 'HR', 'Procurement', 'Research', 'Legal', 'Field Operations']

export function Documents() {
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.01em', color: '#002141' }}>Document Library</h1>
          <p style={{ fontSize: '16px', lineHeight: '24px', color: '#43474f', marginTop: '4px' }}>MinIO S3 · Full-text search via OpenSearch · OCR enabled</p>
        </div>
        <button style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', backgroundColor: '#053664', color: '#ffffff', alignSelf: 'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>Upload File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: folders */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #c3c6d0', padding: '20px', height: 'fit-content' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Folders</p>
          <div className="space-y-1">
            {folders.map((f) => (
              <button key={f} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-[#eff4ff] transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#053664' }}>folder</span>
                <span style={{ fontSize: '13px', color: '#0b1c30', fontWeight: 500 }}>{f}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #c3c6d0', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Storage</p>
            <div style={{ backgroundColor: '#e5eeff', borderRadius: '9999px', height: '8px', marginBottom: '6px' }}>
              <div style={{ width: '62%', height: '8px', borderRadius: '9999px', backgroundColor: '#053664' }} />
            </div>
            <p style={{ fontSize: '11px', color: '#43474f' }}>62 GB of 100 GB used</p>
          </div>
        </div>

        {/* Main area */}
        <div className="lg:col-span-3">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ border: '1px solid #c3c6d0', backgroundColor: '#ffffff' }}>
              <span className="material-symbols-outlined" style={{ color: '#43474f', fontSize: '18px' }}>search</span>
              <input type="text" placeholder="Search documents, tags, OCR content…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#0b1c30', width: '100%', background: 'transparent' }} />
            </div>
            <div className="flex gap-1 items-center">
              {(['grid','list'] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '8px', borderRadius: '8px', backgroundColor: view === v ? '#e5eeff' : 'transparent', color: view === v ? '#002141' : '#43474f', border: '1px solid ' + (view === v ? '#c3c6d0' : 'transparent') }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{v === 'grid' ? 'grid_view' : 'view_list'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid view */}
          {view === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <div key={doc.id} onClick={() => setSelected(doc.id === selected ? null : doc.id)}
                  style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: `2px solid ${doc.id === selected ? '#053664' : '#c3c6d0'}`, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0px 1px 3px rgba(0,0,0,0.05)' }}
                  className="hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: doc.iconColor }}>{doc.icon}</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#0b1c30', textAlign: 'center', wordBreak: 'break-word', lineHeight: '16px' }}>{doc.name}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {doc.tags.map((t) => (
                        <span key={t} style={{ fontSize: '10px', backgroundColor: '#e5eeff', color: '#002141', padding: '1px 8px', borderRadius: '9999px' }}>{t}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: '#43474f' }}>{doc.size} · {doc.modified}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #c3c6d0', overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#053664', color: '#ffffff' }}>
                    {['Name','Type','Size','Modified','Owner','Tags',''].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc, i) => (
                    <tr key={doc.id} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                      <td style={{ padding: '10px 14px' }}>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: doc.iconColor }}>{doc.icon}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0b1c30' }}>{doc.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#43474f' }}>{doc.type}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#43474f' }}>{doc.size}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#43474f' }}>{doc.modified}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#43474f' }}>{doc.owner}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((t) => <span key={t} style={{ fontSize: '10px', backgroundColor: '#e5eeff', color: '#002141', padding: '1px 8px', borderRadius: '9999px' }}>{t}</span>)}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button style={{ color: '#002141' }} className="hover:text-[#053664] transition-colors">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
