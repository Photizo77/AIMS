import { useState } from 'react'

const roles = [
  { id:'r1', name:'Super Admin',       users:2,  permissions:['All'],                          color:'#053664' },
  { id:'r2', name:'Senior Registrar',  users:8,  permissions:['View','Edit','Approve','Report'],color:'#002141' },
  { id:'r3', name:'Land Officer',      users:24, permissions:['View','Edit','Submit'],          color:'#286b25' },
  { id:'r4', name:'Finance Officer',   users:6,  permissions:['View','Finance','Submit'],       color:'#286b25' },
  { id:'r5', name:'HR Manager',        users:4,  permissions:['View','HR','Approve'],           color:'#002141' },
  { id:'r6', name:'Research Officer',  users:12, permissions:['View','Research','Submit'],      color:'#286b25' },
  { id:'r7', name:'Viewer / ReadOnly', users:31, permissions:['View'],                          color:'#43474f' },
]

const users = [
  { name:'David Mugisha',  email:'d.mugisha@ardhi.go.ug',  role:'Senior Registrar', status:'Active',   mfa:true  },
  { name:'Grace Atim',     email:'g.atim@ardhi.go.ug',     role:'Research Officer', status:'Active',   mfa:true  },
  { name:'Jane Doe',       email:'j.doe@ardhi.go.ug',      role:'HR Manager',       status:'Active',   mfa:false },
  { name:'Mark Tumwine',   email:'m.tumwine@ardhi.go.ug',  role:'Finance Officer',  status:'Active',   mfa:true  },
  { name:'Peter Okello',   email:'p.okello@ardhi.go.ug',   role:'Land Officer',     status:'Active',   mfa:false },
  { name:'Alice Nakato',   email:'a.nakato@ardhi.go.ug',   role:'Land Officer',     status:'Inactive', mfa:false },
]

const modules = ['Dashboard','Attendance','Tasks','Documents','HR','Finance','Procurement','Research','CRM','Analytics','Chat','Settings']
const permMatrix: Record<string, Record<string,boolean>> = {
  'Super Admin':      Object.fromEntries(modules.map((m) => [m,true])),
  'Senior Registrar': Object.fromEntries(modules.map((m) => [m, !['Settings'].includes(m)])),
  'Land Officer':     Object.fromEntries(modules.map((m) => [m, ['Dashboard','Tasks','Documents','Research','Attendance'].includes(m)])),
  'Finance Officer':  Object.fromEntries(modules.map((m) => [m, ['Dashboard','Finance','Tasks','Documents','Analytics'].includes(m)])),
  'HR Manager':       Object.fromEntries(modules.map((m) => [m, ['Dashboard','HR','Tasks','Documents','Attendance'].includes(m)])),
  'Research Officer': Object.fromEntries(modules.map((m) => [m, ['Dashboard','Research','Documents','Tasks','CRM'].includes(m)])),
  'Viewer / ReadOnly':Object.fromEntries(modules.map((m) => [m, ['Dashboard'].includes(m)])),
}

export function RBAC() {
  const [tab, setTab] = useState<'Roles'|'Users'|'Matrix'>('Roles')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Roles &amp; Permissions</h1>
          <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Keycloak RBAC — user roles, module access and MFA status</p>
        </div>
        <button style={{ fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'8px', backgroundColor:'#053664', color:'#ffffff', alignSelf:'flex-start' }}
          className="hover:opacity-90 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label:'Total Users',    value:'87',  icon:'group',         ok:true  },
          { label:'Active Roles',   value:'7',   icon:'shield_person', ok:true  },
          { label:'MFA Enforced',   value:'64%', icon:'security',      ok:true  },
          { label:'Access Reviews', value:'3',   icon:'policy',        ok:false },
        ].map((c) => (
          <div key={c.label}
            style={{ backgroundColor:'#c1dbc3', padding:'24px', borderRadius:'12px', boxShadow:'0px 1px 3px rgba(0,0,0,0.05),0px 10px 15px -3px rgba(0,0,0,0.05)', border:'1px solid #a8c4aa', display:'flex', flexDirection:'column', justifyContent:'space-between', height:'128px' }}>
            <div className="flex justify-between items-start">
              <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.05em', color:'#002141', textTransform:'uppercase' }}>{c.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize:'22px', color:'rgba(0,33,65,0.4)' }}>{c.icon}</span>
            </div>
            <div className="flex items-end justify-between">
              <span style={{ fontSize:'24px', fontWeight:600, color:'#002141' }}>{c.value}</span>
              <span style={{ fontSize:'10px', fontWeight:700, backgroundColor: c.ok ? 'rgba(40,107,37,0.10)' : 'rgba(235,59,20,0.10)', color: c.ok ? '#286b25' : '#eb3b14', padding:'4px 16px', borderRadius:'9999px' }}>{c.ok ? 'Compliant' : 'Review req.'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:'1px solid #c3c6d0' }}>
          {(['Roles','Users','Matrix'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'12px 24px', fontSize:'14px', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#002141' : '#43474f', borderBottom: tab === t ? '2px solid #053664' : '2px solid transparent', background:'none', cursor:'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Roles tab */}
        {tab === 'Roles' && (
          <div style={{ padding:'24px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.id} style={{ border:'1px solid #c3c6d0', borderRadius:'10px', padding:'18px', backgroundColor:'#f8f9ff' }} className="hover:-translate-y-0.5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:36, height:36, borderRadius:'8px', backgroundColor:role.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'20px', color:'#ffffff' }}>shield_person</span>
                    </div>
                    <span style={{ fontSize:'14px', fontWeight:700, color:'#0b1c30' }}>{role.name}</span>
                  </div>
                  <span style={{ fontSize:'12px', fontWeight:700, backgroundColor:'#e5eeff', color:'#002141', padding:'3px 10px', borderRadius:'9999px' }}>{role.users} users</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((p) => (
                    <span key={p} style={{ fontSize:'10px', backgroundColor: p === 'All' ? 'rgba(235,59,20,0.10)' : 'rgba(40,107,37,0.10)', color: p === 'All' ? '#eb3b14' : '#286b25', padding:'2px 8px', borderRadius:'9999px', fontWeight:600 }}>{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users tab */}
        {tab === 'Users' && (
          <table style={{ width:'100%', fontSize:'14px', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'#053664', color:'#ffffff' }}>
                {['User','Email','Role','MFA','Status','Actions'].map((h) => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'12px', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.email} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }} className="hover:bg-[#eff4ff] transition-colors">
                  <td style={{ padding:'12px 16px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width:32, height:32, borderRadius:'9999px', backgroundColor:'#d4e3ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:'11px', fontWeight:700, color:'#002141' }}>{u.name.split(' ').map((n)=>n[0]).join('')}</span>
                      </div>
                      <span style={{ fontSize:'14px', fontWeight:600, color:'#0b1c30' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:'13px', color:'#43474f' }}>{u.email}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:'12px', fontWeight:600, backgroundColor:'#e5eeff', color:'#002141', padding:'3px 10px', borderRadius:'9999px' }}>{u.role}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:'12px', fontWeight:700, color: u.mfa ? '#286b25' : '#eb3b14', display:'flex', alignItems:'center', gap:'4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>{u.mfa ? 'verified_user' : 'security'}</span>
                      {u.mfa ? 'Enabled' : 'Off'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, backgroundColor: u.status === 'Active' ? 'rgba(40,107,37,0.10)' : '#f8f9ff', color: u.status === 'Active' ? '#286b25' : '#43474f', padding:'3px 12px', borderRadius:'9999px' }}>{u.status}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button style={{ color:'#002141', background:'none', border:'none', cursor:'pointer' }} className="hover:text-[#053664]">
                      <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Matrix tab */}
        {tab === 'Matrix' && (
          <div style={{ padding:'16px', overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', fontSize:'12px', minWidth:'700px', width:'100%' }}>
              <thead>
                <tr style={{ backgroundColor:'#053664', color:'#ffffff' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontSize:'12px', fontWeight:700, minWidth:'150px' }}>Role \ Module</th>
                  {modules.map((m) => (
                    <th key={m} style={{ padding:'10px 8px', fontSize:'10px', fontWeight:700, whiteSpace:'nowrap', textAlign:'center' }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role, i) => (
                  <tr key={role.id} style={{ backgroundColor: i % 2 === 0 ? '#f8f9ff' : '#ffffff' }}>
                    <td style={{ padding:'10px 14px', fontWeight:700, color:'#0b1c30', fontSize:'13px' }}>{role.name}</td>
                    {modules.map((m) => {
                      const has = permMatrix[role.name]?.[m] ?? false
                      return (
                        <td key={m} style={{ padding:'10px 8px', textAlign:'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize:'18px', color: has ? '#286b25' : '#c3c6d0' }}>
                            {has ? 'check_circle' : 'cancel'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
