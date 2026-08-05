import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  status: 'draft' | 'approved';
  summary: string;
}

const MOCK_MINUTES: MeetingMinute[] = [
  {
    id: 'min-1',
    title: 'Q3 2026 Strategy Meeting',
    date: '2026-08-01',
    attendees: ['Nassir Mwanje', 'Peter Byamugisha', 'Grace Aceng'],
    status: 'approved',
    summary: 'Discussed Q3 targets, approved budget allocation for new grants, and reviewed HR expansion plans in the Northern region.',
  },
  {
    id: 'min-2',
    title: 'Board of Directors Meeting',
    date: '2026-07-15',
    attendees: ['Nassir Mwanje', 'Peter Byamugisha', 'Board Members'],
    status: 'approved',
    summary: 'Annual review of grant performance, approval of new ArdhiLand initiatives, and strategic partnerships.',
  },
  {
    id: 'min-3',
    title: 'Executive Committee Weekly',
    date: '2026-08-05',
    attendees: ['Peter Byamugisha', 'Grace Aceng', 'Amos Ojok'],
    status: 'draft',
    summary: 'Weekly sync on operational issues, requisition approvals, and departmental updates.',
  },
];

export function MeetingMinutes() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const canCreate = user?.role === 'CD' || user?.role === 'ED' || user?.role === 'COMPANY_ADMIN';

  const handleCreate = () => {
    setShowCreateForm(false);
    showToast({ title: 'Minutes Saved', message: 'Meeting minutes have been saved as draft.', type: 'success' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Meeting Minutes</h2>
          <p className="text-sm text-gray-500">Restricted access — Admins, ED, and CD only</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            + New Minutes
          </button>
        )}
      </div>

      <div className="space-y-3">
        {MOCK_MINUTES.map((minute) => (
          <button
            key={minute.id}
            onClick={() => setSelectedMinute(minute)}
            className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{minute.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{minute.date}</p>
              </div>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                minute.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              )}>
                {minute.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{minute.summary}</p>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-gray-400">group</span>
              <span className="text-xs text-gray-500">{minute.attendees.length} attendees</span>
            </div>
          </button>
        ))}
      </div>

      {selectedMinute && (
        <MinuteDetailModal minute={selectedMinute} onClose={() => setSelectedMinute(null)} />
      )}

      {showCreateForm && (
        <CreateMinutesModal onSave={handleCreate} onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  );
}

function MinuteDetailModal({ minute, onClose }: { minute: MeetingMinute; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <span className="material-symbols-outlined">close</span>
        </button>

        <span className={cn(
          'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize mb-2',
          minute.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        )}>
          {minute.status}
        </span>
        <h3 className="text-xl font-bold text-gray-800">{minute.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{minute.date}</p>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Attendees</h4>
            <div className="flex flex-wrap gap-2">
              {minute.attendees.map((attendee, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                  {attendee}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{minute.summary}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Minutes</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              (Full detailed minutes would appear here. This is a preview view.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateMinutesModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">New Meeting Minutes</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
            <input type="text" placeholder="e.g. Q3 Strategy Meeting" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
            <input type="text" placeholder="Comma-separated names" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minutes Content</label>
            <textarea placeholder="Enter meeting minutes..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[150px]" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm bg-aims-mint text-white rounded-lg hover:opacity-90">Save as Draft</button>
        </div>
      </div>
    </div>
  );
}