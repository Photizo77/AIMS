mkdir -p src/components/dashboard && cat > src/components/dashboard/CheckInCard.tsx << 'ENDOFFILE'
// src/components/dashboard/CheckInCard.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

export function CheckInCard() {
  const { showToast } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'choose' | 'fetching' | 'confirm'>('choose');
  const [locationType, setLocationType] = useState<'onsite' | 'remote' | null>(null);
  const [gpsCoords, setGpsCoords] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');

  const handleSelectType = (type: 'onsite' | 'remote') => {
    setLocationType(type);
    if (type === 'remote') {
      setGpsCoords('Remote IP: 197.239.xx.xx (Kampala)');
      setStep('confirm');
    } else {
      setStep('fetching');
      setTimeout(() => {
        setGpsCoords('2.7750° N, 32.2986° E (Gulu Main Campus)');
        setStep('confirm');
      }, 1500);
    }
  };

  const handleFinalCheckIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setCheckInTime(timeStr);
    setCheckedIn(true);
    setShowModal(false);
    setStep('choose');
    setLocationType(null);
    setGpsCoords('');
    showToast({ title: 'Checked In', message: 'Clocked in at ' + timeStr + ' as ' + locationType + '.', type: 'success' });
  };

  const resetModal = () => {
    setShowModal(false);
    setStep('choose');
    setLocationType(null);
    setGpsCoords('');
  };

  const handleCheckOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setCheckedIn(false);
    setCheckInTime('');
    showToast({ title: 'Checked Out', message: 'Clocked out at ' + timeStr + '.', type: 'info' });
  };

  return (
    <>
      <div className="bg-gradient-to-br from-orange-500 to-aims-orange rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-white">fingerprint</span>
            <h3 className="text-base font-bold text-white">Daily Attendance</h3>
          </div>
          <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full text-white">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {checkedIn ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">check_circle</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Checked In</p>
                <p className="text-xs text-white/80">{checkInTime} &bull; {locationType === 'onsite' ? 'On-Site' : 'Remote'}</p>
              </div>
            </div>
            <button onClick={handleCheckOut} className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold text-white transition-colors">
              Check Out
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-white/90 mb-3">You have not checked in today.</p>
            <button onClick={() => setShowModal(true)} className="w-full py-2.5 bg-white text-orange-600 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">login</span>Check In Now
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={resetModal} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <button onClick={resetModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">close</span>
            </button>

            {step === 'choose' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Daily Check-In</h3>
                <p className="text-sm text-slate-500 mb-5">How are you working today?</p>
                <div className="space-y-3">
                  <button onClick={() => handleSelectType('onsite')} className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-aims-green hover:bg-green-50/30 transition-all flex items-center gap-4 px-4 group">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-aims-green transition-colors">
                      <span className="material-symbols-outlined text-2xl text-aims-green group-hover:text-white transition-colors">location_on</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Physical / On-Site</p>
                      <p className="text-xs text-slate-500">Captures GPS coordinates automatically</p>
                    </div>
                  </button>
                  <button onClick={() => handleSelectType('remote')} className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-aims-navy hover:bg-blue-50/30 transition-all flex items-center gap-4 px-4 group">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-aims-navy transition-colors">
                      <span className="material-symbols-outlined text-2xl text-aims-navy group-hover:text-white transition-colors">home</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Remote / WFH</p>
                      <p className="text-xs text-slate-500">Logs IP address instead of GPS</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 'fetching' && (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 border-4 border-aims-green border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-900 text-base">Capturing GPS Coordinates...</p>
                <p className="text-xs text-slate-500 mt-1">Please ensure location services are enabled.</p>
              </div>
            )}

            {step === 'confirm' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Check-In</h3>
                <div className="bg-aims-navy p-4 rounded-xl mb-4">
                  <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Location Verified</p>
                  <p className="text-sm font-mono font-bold text-white">{gpsCoords}</p>
                  <p className="text-xs text-white/70 mt-1">Type: <span className="font-bold capitalize text-white">{locationType}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetModal} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={handleFinalCheckIn} className="flex-1 py-2.5 bg-aims-green text-white rounded-lg text-sm font-bold hover:opacity-90">Confirm &amp; Clock In</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
