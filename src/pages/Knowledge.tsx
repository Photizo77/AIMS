import { useState } from 'react'

const categories = [
  { name:'Land Law & Policy',      icon:'gavel',        count:24 },
  { name:'HR Procedures',          icon:'badge',        count:18 },
  { name:'Financial Regulations',  icon:'account_balance', count:15 },
  { name:'Field Operations',       icon:'map',          count:21 },
  { name:'ICT & Systems',          icon:'computer',     count:12 },
  { name:'Research Methods',       icon:'science',      count:9  },
]

const articles = [
  { id:'KB-101', title:'How to Register a Land Parcel — Step-by-Step Guide',  cat:'Land Law & Policy',     views:428, updated:'Jul 28 2025', tags:['Registration','Title Deed']          },
  { id:'KB-102', title:'Leave Application Procedure & Approval Workflow',      cat:'HR Procedures',         views:312, updated:'Jul 20 2025', tags:['Leave','HR','Keycloak']              },
  { id:'KB-103', title:'Budget Reallocation Request Process',                   cat:'Financial Regulations', views:198, updated:'Jul 15 2025', tags:['Finance','Budget']                   },
  { id:'KB-104', title:'Using the GPS Survey Equipment — Operator Guide',      cat:'Field Operations',      views:367, updated:'Jul 10 2025', tags:['GPS','Survey','Equipment']           },
  { id:'KB-105', title:'AIMS System Login & MFA Setup',                        cat:'ICT & Systems',         views:544, updated:'Jun 30 2025', tags:['Login','MFA','Keycloak','Security']  },
  { id:'KB-106', title:'Data Collection Protocol for Research Projects',       cat:'Research Methods',      views:215, updated:'Jun 25 2025', tags:['Research','Data','Protocol']         },
  { id:'KB-107', title:'Procurement Threshold Limits & Approvals Matrix',      cat:'Financial Regulations', views:176, updated:'Jun 20 2025', tags:['Procurement','Finance']              },
  { id:'KB-108', title:'Vehicle & Transport Request Procedure',                 cat:'Field Operations',      views:143, updated:'Jun 15 2025', tags:['Transport','Field','LPO']            },
]

export function Knowledge() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string|null>(null)

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = !activeCat || a.cat === activeCat
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Knowledge Base</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Guides, policies and procedures — indexed with OpenSearch</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>New Article
        </button>
      </div>

      {/* Search bar */}
      <div style={{ backgroundColor:'#053664', borderRadius:'12px', padding:'28px', marginBottom:'32px', position:'relative', overflow:'hidden' }}>
        <span className="material-symbols-outlined" style={{ position:'absolute', bottom:'-16px', right:'-16px', fontSize:'120px', color:'rgba(255,255,255,0.06)' }}>menu_book</span>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'#ffffff', marginBottom:'16px' }}>Search the Knowledge Base</h2>
        <div style={{ backgroundColor:'#ffffff', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', maxWidth:'560px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'#43474f' }}>search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, tags, policies…"
            style={{ border:'none', outline:'none', fontSize:'15px', color:'#0b1c30', width:'100%', background:'transparent' }} />
        </div>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'8px' }}>Powered by OpenSearch full-text indexing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories */}
        <div>
          <p style={{ fontSize:'12px', fontWeight:700, color:'#43474f', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>Browse by Category</p>
          <div className="space-y-2">
            <button onClick={() => setActiveCat(null)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:'8px', backgroundColor: !activeCat ? '#e5eeff' : 'transparent', border: !activeCat ? '1px solid #c3c6d0' : '1px solid transparent', cursor:'pointer', transition:'all 0.1s' }}
              className="hover:bg-[#eff4ff]">
              <span style={{ fontSize:'13px', fontWeight: !activeCat ? 700 : 400, color:'#0b1c30' }}>All Categories</span>
              <span style={{ fontSize:'11px', fontWeight:700, backgroundColor:'#e5eeff', color:'#002141', padding:'1px 8px', borderRadius:'9999px' }}>{articles.length}</span>
            </button>
            {categories.map((cat) => (
              <button key={cat.name} onClick={() => setActiveCat(cat.name === activeCat ? null : cat.name)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:'8px', backgroundColor: activeCat === cat.name ? '#e5eeff' : 'transparent', border: activeCat === cat.name ? '1px solid #c3c6d0' : '1px solid transparent', cursor:'pointer', transition:'all 0.1s' }}
                className="hover:bg-[#eff4ff]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#053664' }}>{cat.icon}</span>
                  <span style={{ fontSize:'13px', fontWeight: activeCat === cat.name ? 700 : 400, color:'#0b1c30' }}>{cat.name}</span>
                </div>
                <span style={{ fontSize:'11px', fontWeight:700, backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25', padding:'1px 8px', borderRadius:'9999px' }}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Articles list */}
        <div className="lg:col-span-3 space-y-4">
          {filtered.length === 0 ? (
            <div style={{ backgroundColor:'#f8f9ff', borderRadius:'12px', border:'2px dashed #c3c6d0', padding:'48px', textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'48px', color:'#c3c6d0' }}>search_off</span>
              <p style={{ fontSize:'14px', color:'#43474f', marginTop:'12px' }}>No articles found. Try a different search term.</p>
            </div>
          ) : filtered.map((art) => (
            <div key={art.id} style={{ backgroundColor:'#ffffff', borderRadius:'10px', border:'1px solid #c3c6d0', padding:'18px', cursor:'pointer', boxShadow:'0px 1px 3px rgba(0,0,0,0.05)' }}
              className="hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span style={{ fontSize:'11px', fontWeight:700, color:'#053664' }}>{art.id}</span>
                    <span style={{ fontSize:'10px', backgroundColor:'#e5eeff', color:'#002141', padding:'1px 8px', borderRadius:'9999px' }}>{art.cat}</span>
                  </div>
                  <p style={{ fontSize:'15px', fontWeight:600, color:'#0b1c30', marginBottom:'8px' }}>{art.title}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {art.tags.map((t) => (
                      <span key={t} style={{ fontSize:'10px', backgroundColor:'#f8f9ff', color:'#43474f', border:'1px solid #c3c6d0', padding:'1px 8px', borderRadius:'9999px' }}>{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize:'11px', color:'#43474f', display:'flex', alignItems:'center', gap:'3px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>visibility</span>{art.views} views
                    </span>
                    <span style={{ fontSize:'11px', color:'#43474f' }}>Updated {art.updated}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize:'20px', color:'#43474f', flexShrink:0 }}>arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
