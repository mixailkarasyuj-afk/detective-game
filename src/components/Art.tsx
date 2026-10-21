import type { Suspect } from '../game/types'

// Рисунки районов: каждый помещается в квадрат -10..10 и рисуется линиями цвета currentColor.
const GLYPHS: Record<string, React.ReactNode> = {
  station: (
    <>
      <path d="M-9 8V-2h18V8" />
      <path d="M-5 8V2a5 5 0 0 1 10 0v6" />
      <path d="M-10 -2 0 -8 10 -2" />
      <circle cx={0} cy={-3.5} r={1.6} />
    </>
  ),
  market: (
    <>
      <path d="M-9 -3h18l-2 -5H-7z" />
      <path d="M-6 -3v-5M-2 -3v-5M2 -3v-5M6 -3v-5" />
      <path d="M-8 -3V8h16V-3" />
      <circle cx={-3} cy={3} r={1.8} />
      <circle cx={2} cy={4} r={1.4} />
    </>
  ),
  port: (
    <>
      <path d="M0 -8v15" />
      <circle cx={0} cy={-6.5} r={1.6} />
      <path d="M-4 -3h8" />
      <path d="M-8 2a8 7 0 0 0 16 0" />
      <path d="M-8 2l-1.5 1.5M8 2l1.5 1.5" />
    </>
  ),
  theater: (
    <>
      <path d="M-10 -3 0 -9 10 -3z" />
      <path d="M-8 -1v8M-3 -1v8M3 -1v8M8 -1v8" />
      <path d="M-10 8h20" />
    </>
  ),
  park: (
    <>
      <circle cx={-4} cy={-2} r={4.5} />
      <circle cx={4} cy={-4} r={3.5} />
      <path d="M-4 2.5V8M4 -0.5V8M-9 8h18" />
    </>
  ),
  embankment: (
    <>
      <path d="M-6 8V-6M-6 -6h4" />
      <circle cx={-2} cy={-4.5} r={1.4} />
      <path d="M-10 3q2.5 -2 5 0t5 0 5 0 5 0" />
      <path d="M-10 7q2.5 -2 5 0t5 0 5 0 5 0" />
    </>
  ),
  dorm: (
    <>
      <path d="M-6 8V-9h12V8" />
      <path d="M-3 -6h2M1 -6h2M-3 -2h2M1 -2h2M-3 2h2M1 2h2" />
      <path d="M-1 8V5h2v3" />
    </>
  ),
  factory: (
    <>
      <path d="M-9 8V-1l5 -3v3l5 -3v3l5 -3V8z" />
      <path d="M5 -3v-6h3v9" />
      <path d="M-6 4h2M-1 4h2" />
    </>
  ),
}

export function DistrictGlyph({ icon }: { icon?: string }) {
  return <g className="glyph">{GLYPHS[icon ?? ''] ?? <circle r={6} />}</g>
}

export function Portrait({ suspect, size = 56 }: { suspect: Suspect; size?: number }) {
  const look = suspect.look ?? { coat: '#555', skin: '#d9b08c' }
  return (
    <svg className="portrait" width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <rect width={60} height={60} rx={10} className="portrait-bg" />
      <path d="M8 60c2-14 10-20 22-20s20 6 22 20z" fill={look.coat} />
      <path d="M24 40l6 8 6-8" fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth={1.5} />
      <circle cx={30} cy={27} r={10} fill={look.skin} />
      {look.hair && <path d="M20 26a10 10 0 0 1 20 0c-3-4-7-5-10-5s-7 1-10 5z" fill={look.hair} />}
      {look.hat && (
        <>
          <ellipse cx={30} cy={19} rx={16} ry={3.5} fill="#1d1f24" />
          <path d="M21 19c0-8 4-11 9-11s9 3 9 11z" fill="#1d1f24" />
        </>
      )}
      {look.cap && (
        <>
          <path d="M20 22c0-7 5-10 10-10s10 3 10 10z" fill="#1d2a22" />
          <path d="M28 22h16l-2 2H28z" fill="#1d2a22" />
        </>
      )}
      <circle cx={26.5} cy={28} r={1.1} fill="#1d1f24" />
      <circle cx={33.5} cy={28} r={1.1} fill="#1d1f24" />
    </svg>
  )
}

// Фон: туман над крышами. Только CSS, без анимации при prefers-reduced-motion.
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="skyline" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200V120h60V90h40v30h50V70h30V40h10v30h30v50h70V100h40V60l20-20 20 20v60h60V80h50v40h40V50h20v70h80V90h40V70h30v50h60V100h50V60h40v60h70V80h30v40h50V90h40v110z" />
      </svg>
      <div className="fog fog-1" />
      <div className="fog fog-2" />
    </div>
  )
}
