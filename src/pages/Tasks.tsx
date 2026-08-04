import { useState } from 'react'

type Status = 'Backlog' | 'In Progress' | 'Review' | 'Done'

interface Task {
  id: string
  title: string
  tag: string
  tagColor: string
  assignee: string
  initials: string
  due: string
  priority: 'high' | 'medium' | 'low'
}

const initial: Record<Status, Task[]> = {
  Backlog: [
    { id:'t1', title:'Land parcel boundary audit – Gulu district',   tag:'Survey',    tagColor:'#e5eeff',  assignee:'Peter O.',   initials:'PO', due:'Aug 10', priority:'medium' },
    { id:'t2', title:'Update GIS layer for new subdivisions',          tag:'GIS',       tagColor:'#cce6ce',  assignee:'Alice N.',   initials:'AN', due:'Aug 15', priority:'low'    },
  ],
  'In Progress': [
    { id:'t3', title:'Approve Land Parcel #4529-B transfer deed',      tag:'Approval',  tagColor:'rgba(235,59,20,0.12)', assignee:'David M.', initials:'DM', due:'Today',   priority:'high'   },
    { id:'t4', title:'Q3 Procurement compliance review',               tag:'Finance',   tagColor:'#e5eeff',  assignee:'Jane D.',    initials:'JD', due:'Aug 5',   priority:'medium' },
    { id:'t5', title:'HR Contract #901 – signature pending',           tag:'HR',        tagColor:'#cce6ce',  assignee:'Admin',      initials:'AU', due:'Aug 6',   priority:'high'   },
  ],
  Review: [
    { id:'t6', title:'Stakeholder report – Q2 advocacy outcomes',     tag:'Research',  tagColor:'#cce6ce',  assignee:'Grace A.',   initials:'GA', due:'Aug 8',   priority:'medium' },
    { id:'t7', title:'ICT systems upgrade proposal',                   tag:'ICT',       tagColor:'#e5eeff',  assignee:'Mark T.',    initials:'MT', due:'Aug 9',   priority:'low'    },
  ],
  Done: [
    { id:'t8', title:'Annual land valuation report FY2024',            tag:'Finance',   tagColor:'#e5eeff',  assignee:'David M.',   initials:'DM', due:'Jul 30',  priority:'medium' },
    { id:'t9', title:'Staff onboarding – July intake',                 tag:'HR',        tagColor:'#cce6ce',  assignee:'Jane D.',    initials:'JD', due:'Jul 28',  priority:'low'    },
  ],
}

const colHeader: Record<Status, { bg: string; color: string; dot: string }> = {
  Backlog:      { bg: '#f8f9ff',              color: '#43474f', dot: '#c3c6d0'  },
  'In Progress':{ bg: 'rgba(5,54,100,0.08)',  color: '#053664', dot: '#053664'  },
  Review:       { bg: 'rgba(235,59,20,0.08)', color: '#eb3b14', dot: '#eb3b14'  },
  Done:         { bg: 'rgba(40,107,37,0.08)', color: '#286b25', dot: '#286b25'  },
}

const priorityIcon: Record<string, { icon: string; color: string }> = {
  high:   { icon: 'priority_high', color: '#eb3b14' },
  medium: { icon: 'drag_handle',   color: '#053664' },
  low:    { icon: 'expand_more',   color: '#286b25' },
}

export function Tasks() {
  const [columns, setColumns] = useState(initial)
  const [dragging, setDragging] = useState<{ task: Task; from: Status } | null>(null)

  function onDragStart(task: Task, from: Status) {
    setDragging({ task, from })
  }

  function onDrop(to: Status) {
    if (!dragging || dragging.from === to) { setDragging(null); return }
    setColumns((prev) => {
      const next = { ...prev }
      next[dragging.from] = prev[dragging.from].filter((t) => t.id !== dragging.task.id)
      next[to] = [dragging.task, ...prev[to]]
      return next
    })
    setDragging(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.01em', color: '#002141' }}>Task Board</h1>
          <p style={{ fontSize: '16px', lineHeight: '24px', color: '#43474f', marginTop: '4px' }}>Drag cards between columns to update status</p>
        </div>
        <button style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', backgroundColor: '#053664', color: '#ffffff' }}
          className="hover:opacity-90 transition-opacity flex items-center gap-1 self-start sm:self-auto">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>New Task
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {(Object.keys(columns) as Status[]).map((col) => (
          <div key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col)}
            style={{ backgroundColor: '#f8f9ff', borderRadius: '12px', border: '1px solid #c3c6d0', minHeight: '420px', padding: '16px' }}>

            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: '9999px', backgroundColor: colHeader[col].dot, display: 'inline-block' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: colHeader[col].color }}>{col}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: colHeader[col].bg, color: colHeader[col].color, padding: '1px 8px', borderRadius: '9999px', border: `1px solid ${colHeader[col].dot}` }}>
                  {columns[col].length}
                </span>
              </div>
              <button style={{ color: '#43474f' }} className="hover:text-[#002141] transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {columns[col].map((task) => (
                <div key={task.id}
                  draggable
                  onDragStart={() => onDragStart(task, col)}
                  style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #c3c6d0', cursor: 'grab', boxShadow: '0px 1px 3px rgba(0,0,0,0.05)' }}
                  className="hover:shadow-md hover:-translate-y-0.5 transition-all active:cursor-grabbing">

                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: task.tagColor, color: '#0b1c30', padding: '2px 10px', borderRadius: '9999px' }}>
                      {task.tag}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: priorityIcon[task.priority].color, flexShrink: 0 }}>
                      {priorityIcon[task.priority].icon}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', fontWeight: 600, lineHeight: '20px', color: '#0b1c30', marginBottom: '12px' }}>{task.title}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div style={{ width: 26, height: 26, borderRadius: '9999px', backgroundColor: '#d4e3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#002141' }}>{task.initials}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#43474f' }}>{task.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#43474f' }}>calendar_today</span>
                      <span style={{ fontSize: '11px', color: task.due === 'Today' ? '#eb3b14' : '#43474f', fontWeight: task.due === 'Today' ? 700 : 400 }}>{task.due}</span>
                    </div>
                  </div>
                </div>
              ))}

              {columns[col].length === 0 && (
                <div style={{ border: '2px dashed #c3c6d0', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#43474f' }}>Drop tasks here</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
