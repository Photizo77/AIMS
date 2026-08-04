import { useState, useRef, useEffect } from 'react'

interface Message { id: number; from: string; initials: string; text: string; time: string; mine: boolean }
interface Convo { id: string; name: string; initials: string; preview: string; time: string; unread: number; online: boolean }

const convos: Convo[] = [
  { id:'c1', name:'Grace Atim',       initials:'GA', preview:'Thanks for the updated report!',          time:'09:41',  unread:2, online:true  },
  { id:'c2', name:'Mark Tumwine',     initials:'MT', preview:'The LPO has been submitted for review.',  time:'09:15',  unread:0, online:true  },
  { id:'c3', name:'Research Team',    initials:'RT', preview:'Meeting at 3 PM confirmed.',              time:'08:50',  unread:5, online:false },
  { id:'c4', name:'Jane Doe',         initials:'JD', preview:'Please sign the HR contract today.',      time:'Yesterday',unread:1, online:false },
  { id:'c5', name:'Field Ops Group',  initials:'FO', preview:'Gulu mission departs 6 AM Monday.',       time:'Monday', unread:0, online:false },
]

const initialMessages: Message[] = [
  { id:1, from:'Grace Atim',   initials:'GA', text:'Hi David, have you reviewed the Q2 land rights baseline report?',           time:'09:30', mine:false },
  { id:2, from:'Me',           initials:'DM', text:'Yes, just finished it. Really solid data from the northern districts.',       time:'09:32', mine:true  },
  { id:3, from:'Grace Atim',   initials:'GA', text:'Great! Could you share your comments before the 2 PM meeting with UN-Habitat?',time:'09:35', mine:false },
  { id:4, from:'Me',           initials:'DM', text:"Absolutely. I'll send them over in the next 30 minutes.",                     time:'09:37', mine:true  },
  { id:5, from:'Grace Atim',   initials:'GA', text:'Thanks for the updated report!',                                              time:'09:41', mine:false },
]

export function Chat() {
  const [active, setActive] = useState('c1')
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  function send() {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { id: Date.now(), from:'Me', initials:'DM', text:input.trim(), time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), mine:true }])
    setInput('')
  }

  const current = convos.find((c) => c.id === active)!

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontSize:'32px', fontWeight:600, lineHeight:'40px', letterSpacing:'-0.01em', color:'#002141' }}>Team Chat</h1>
        <p style={{ fontSize:'16px', lineHeight:'24px', color:'#43474f', marginTop:'4px' }}>Internal messaging via Zoho Mail / SMTP integration</p>
      </div>

      <div style={{ backgroundColor:'#ffffff', borderRadius:'12px', border:'1px solid #c3c6d0', overflow:'hidden', height:'calc(100vh - 240px)', minHeight:'500px', display:'flex' }}>

        {/* Sidebar */}
        <div style={{ width:'280px', borderRight:'1px solid #c3c6d0', flexShrink:0, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #c3c6d0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#f8f9ff', border:'1px solid #c3c6d0', borderRadius:'8px', padding:'8px 12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#43474f' }}>search</span>
              <input placeholder="Search chats…" style={{ border:'none', outline:'none', fontSize:'13px', background:'transparent', color:'#0b1c30', width:'100%' }} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {convos.map((c) => (
              <div key={c.id} onClick={() => setActive(c.id)}
                style={{ padding:'12px 16px', cursor:'pointer', backgroundColor: active === c.id ? '#eff4ff' : '#ffffff', borderLeft: active === c.id ? '3px solid #053664' : '3px solid transparent', transition:'background 0.1s' }}
                className="hover:bg-[#eff4ff]">
                <div className="flex items-center gap-3">
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:40, height:40, borderRadius:'9999px', backgroundColor:'#d4e3ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:'14px', fontWeight:700, color:'#002141' }}>{c.initials}</span>
                    </div>
                    {c.online && <span style={{ position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'9999px', backgroundColor:'#286b25', border:'2px solid #ffffff' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#0b1c30' }}>{c.name}</span>
                      <span style={{ fontSize:'11px', color:'#43474f' }}>{c.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span style={{ fontSize:'12px', color:'#43474f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'140px' }}>{c.preview}</span>
                      {c.unread > 0 && <span style={{ width:18, height:18, borderRadius:'9999px', backgroundColor:'#053664', color:'#ffffff', fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{c.unread}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message area */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Chat header */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #c3c6d0', display:'flex', alignItems:'center', justifyContent:'space-between', backgroundColor:'#f8f9ff' }}>
            <div className="flex items-center gap-3">
              <div style={{ width:36, height:36, borderRadius:'9999px', backgroundColor:'#d4e3ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#002141' }}>{current.initials}</span>
              </div>
              <div>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#0b1c30' }}>{current.name}</p>
                <p style={{ fontSize:'11px', color: current.online ? '#286b25' : '#43474f' }}>{current.online ? '● Online' : '○ Offline'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['call','videocam','more_vert'].map((icon) => (
                <button key={icon} style={{ padding:'6px', borderRadius:'8px', color:'#43474f', background:'none', border:'none', cursor:'pointer' }} className="hover:bg-[#e5eeff] transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize:'20px' }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px', backgroundColor:'#fafbff' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display:'flex', flexDirection: msg.mine ? 'row-reverse' : 'row', alignItems:'flex-end', gap:'8px' }}>
                {!msg.mine && (
                  <div style={{ width:30, height:30, borderRadius:'9999px', backgroundColor:'#d4e3ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#002141' }}>{msg.initials}</span>
                  </div>
                )}
                <div>
                  <div style={{ maxWidth:'340px', padding:'10px 14px', borderRadius: msg.mine ? '16px 4px 16px 16px' : '4px 16px 16px 16px', backgroundColor: msg.mine ? '#053664' : '#ffffff', color: msg.mine ? '#ffffff' : '#0b1c30', fontSize:'14px', lineHeight:'20px', boxShadow:'0 1px 2px rgba(0,0,0,0.06)', border: msg.mine ? 'none' : '1px solid #e5eeff' }}>
                    {msg.text}
                  </div>
                  <p style={{ fontSize:'10px', color:'#43474f', marginTop:'3px', textAlign: msg.mine ? 'right' : 'left' }}>{msg.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid #c3c6d0', display:'flex', gap:'10px', alignItems:'center', backgroundColor:'#ffffff' }}>
            <button style={{ color:'#43474f', background:'none', border:'none', cursor:'pointer' }} className="hover:text-[#053664]">
              <span className="material-symbols-outlined" style={{ fontSize:'22px' }}>attach_file</span>
            </button>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a message…"
              style={{ flex:1, padding:'10px 14px', borderRadius:'24px', border:'1px solid #c3c6d0', outline:'none', fontSize:'14px', color:'#0b1c30', backgroundColor:'#f8f9ff' }} />
            <button onClick={send}
              style={{ width:40, height:40, borderRadius:'9999px', backgroundColor:'#053664', color:'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer', flexShrink:0 }}
              className="hover:opacity-90 active:scale-95">
              <span className="material-symbols-outlined" style={{ fontSize:'20px' }}>send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
