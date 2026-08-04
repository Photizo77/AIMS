import { useState } from 'react'

interface AnnouncementBannerProps {
  message: string
}

export function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="mb-lg bg-secondary-container/50 border border-secondary-container rounded-xl px-lg py-md flex items-center justify-between">
      <div className="flex items-center gap-md">
        <span className="material-symbols-outlined text-on-secondary-container text-[22px]">campaign</span>
        <p className="text-body-md text-on-secondary-container">
          <strong>Announcement: </strong>{message}
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-on-secondary-container/50 hover:text-on-secondary-container transition-colors ml-md shrink-0"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  )
}
