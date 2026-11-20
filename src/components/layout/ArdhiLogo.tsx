// src/components/layout/ArdhiLogo.tsx
// Uses the high-resolution institutional lockup shipped with the app
// (public/ardhi-logo-design.png) instead of an external image host, so the mark
// renders crisply with its true brand colours and never depends on a
// third-party URL.
export function ArdhiLogo() {
  return (
    <div className="h-10 w-36 flex items-center overflow-hidden shrink-0">
      <img
        src="/ardhi-logo-design.png"
        alt="ARDHI — Advocacy. Research. Innovation"
        className="h-full w-auto object-contain object-top"
      />
    </div>
  );
}
