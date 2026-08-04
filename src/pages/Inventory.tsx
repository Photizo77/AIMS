import { useState } from 'react'

const items = [
  { id:'INV-001', name:'GPS Survey Unit',         category:'Field Equipment', qty:12, min:5,  location:'Store A', status:'In Stock',   unit:'pcs', lastUpdated:'Jul 30' },
  { id:'INV-002', name:'HP Laptop (i7)',           category:'ICT',             qty:18, min:10, location:'ICT Room',status:'In Stock',   unit:'pcs', lastUpdated:'Jul 28' },
  { id:'INV-003', name:'A4 Printing Paper',        category:'Stationery',      qty:80, min:20, location:'Store B', status:'In Stock',   unit:'reams',lastUpdated:'Jul 25' },
  { id:'INV-004', name:'Field Vehicle (Toyota LC)',category:'Transport',        qty:3,  min:2,  location:'Parking', status:'In Stock',  unit:'units',lastUpdated:'Jul 20' },
  { id:'INV-005', name:'Camera (DSLR)',            category:'Field Equipment', qty:4,  min:3,  location:'Store A', status:'Low Stock',  unit:'pcs', lastUpdated:'Jul 18' },
  { id:'INV-006', name:'Drone (DJI Phantom)',      category:'Field Equipment', qty:1,  min:2,  location:'Store A', status:'Low Stock',  unit:'pcs', lastUpdated:'Jul 15' },
  { id:'INV-007', name:'Toner Cartridge (HP)',     category:'Stationery',      qty:2,  min:5,  location:'Store B', status:'Low Stock',  unit:'pcs', lastUpdated:'Jul 10' },
  { id:'INV-008', name:'Generator (10KVA)',        category:'Infrastructure',  qty:0,  min:1,  location:'Store C', status:'Out of Stock',unit:'pcs',lastUpdated:'Jun 30' },
]

const statusStyle = (s: string): React.CSSProperties => {
  if (s === 'In Stock')     return { backgroundColor:'rgba(40,107,37,0.10)', color:'#286b25' }
  if (s === 'Low Stock')    return { backgroundColor:'rgba(235,59,20,0.10)', color:'#eb3b14' }
  return { backgroundColor:'#ffdad6', color:'#ba1a1a' }
}

export function Inventory() {
  const [search, setSearch] = useState('')
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Inventory</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Assets, equipment &amp; stock level management</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label:'Total Items',     value:'148',  icon:'inventory_2',  ok:true  },
          { label:'Categories',      value:'6',    icon:'category',     ok:true  },
          { label:'Low Stock',       value:'3',    icon:'warning',      ok:false },
          { label:'Out of Stock',    value:'1',    icon:'cancel',       ok:false },
        ].map((c) => (
          <div key={c.label}
            style={{ backgroundColor:'#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'128px' }}>
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color:'#002141', textTransform:'uppercase' }}>{c.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'rgba(0,33,65,0.4)' }}>{c.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize:'24px', fontWeight:600, color:'#002141' }}>{c.value}</span>
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor: c.ok ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: c.ok ? '#286b25' : '#eb3b14', padding:'4px 16px', borderRadius:'9999px' }}>{c.ok ? 'Normal' : 'Alert'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search + table */}
      <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #c3c6d0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
          <h3 style={{ fontSize:'16px', fontWeight:600, color:'#002141' }}>Stock Register</h3>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#f8f9ff', border:'1px solid #c3c6d0', borderRadius:'8px', padding:'8px 12px', minWidth:'200px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#43474f' }}>search</span>
            <input placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border:'none', outline:'none', fontSize:'13px', background:'transparent', color:'#0b1c30', width:'100%' }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table style={{ width:'100%', fontSize:'14px', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'#053664', color:'#ffffff' }}>
                {['Item ID','Name','Category','Qty','Min.Level','Location','Status','Last Updated','Actions'].map((h) => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                  <td style={{ padding:'12px 14px', fontWeight:700, color:'#053664', fontSize:'12px' }}>{item.id}</td>
                  <td style={{ padding:'12px 14px', fontWeight:600, color:'#0b1c30' }}>{item.name}</td>
                  <td style={{ padding:'12px 14px', fontSize:'12px', color:'#43474f' }}>{item.category}</td>
                  <td style={{ padding:'12px 14px', fontWeight:700, color: item.qty === 0 ? '#ba1a1a' : item.qty <= item.min ? '#eb3b14' : '#0b1c30', fontSize:'16px' }}>{item.qty}</td>
                  <td style={{ padding:'12px 14px', color:'#43474f', fontSize:'12px' }}>{item.min} {item.unit}</td>
                  <td style={{ padding:'12px 14px', color:'#43474f', fontSize:'12px' }}>{item.location}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ ...statusStyle(item.status), fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'9999px' }}>{item.status}</span>
                  </td>
                  <td style={{ padding:'12px 14px', color:'#43474f', fontSize:'12px' }}>{item.lastUpdated}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <div className="flex items-center gap-1">
                      <button style={{ color:'#002141', background:'none', border:'none', cursor:'pointer', padding:'4px' }} className="hover:text-[#053664]">
                        <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>edit</span>
                      </button>
                      <button style={{ color:'#43474f', background:'none', border:'none', cursor:'pointer', padding:'4px' }} className="hover:text-[#eb3b14]">
                        <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>delete</span>
                      </button>
                    </div>
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
