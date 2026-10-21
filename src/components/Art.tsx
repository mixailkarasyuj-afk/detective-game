import type { Look } from '../game/types'

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

export function Portrait({ look, size = 56, className = '' }: { look?: Look; size?: number; className?: string }) {
  const l = look ?? { coat: '#555', skin: '#d9b08c' }
  const dark = '#1d1f24'
  return (
    <svg className={`portrait ${className}`} width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <rect width={60} height={60} rx={8} className="portrait-bg" />
      <path d="M8 60c2-14 10-20 22-20s20 6 22 20z" fill={l.coat} />
      <path d="M24 40l6 8 6-8" fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth={1.5} />
      {l.scarf && <path d="M21 39c5 4 13 4 18 0l1 4c-6 4-14 4-20 0z" fill={l.scarf} />}
      <rect x={27} y={33} width={6} height={6} fill={l.skin} />
      <circle cx={30} cy={27} r={10} fill={l.skin} />
      {l.hair && <path d="M20 26a10 10 0 0 1 20 0c-3-4-7-5-10-5s-7 1-10 5z" fill={l.hair} />}
      {l.bun && l.hair && <circle cx={30} cy={15} r={4.5} fill={l.hair} />}
      {l.beard && <path d="M21 29c0 8 4 12 9 12s9-4 9-12c-2 3-5 4-9 4s-7-1-9-4z" fill={l.hair ?? '#4a3a2c'} />}
      {l.mustache && <path d="M25 32.5c2-2 4-2 5-.5 1-1.5 3-1.5 5 .5-2 .8-3.5.5-5-.4-1.5.9-3 1.2-5 .4z" fill={l.hair ?? '#4a3a2c'} />}
      {l.hat && (
        <>
          <ellipse cx={30} cy={19} rx={16} ry={3.5} fill={dark} />
          <path d="M21 19c0-8 4-11 9-11s9 3 9 11z" fill={dark} />
        </>
      )}
      {l.cap && (
        <>
          <path d="M20 22c0-7 5-10 10-10s10 3 10 10z" fill="#24304a" />
          <path d="M28 22h16l-2 2H28z" fill="#24304a" />
        </>
      )}
      <circle cx={26.5} cy={28} r={1.1} fill={dark} />
      <circle cx={33.5} cy={28} r={1.1} fill={dark} />
      {l.glasses && (
        <g fill="none" stroke={dark} strokeWidth={0.9}>
          <circle cx={26.5} cy={28} r={2.8} />
          <circle cx={33.5} cy={28} r={2.8} />
          <path d="M29.3 28h1.4" />
        </g>
      )}
    </svg>
  )
}

// Значки на карте, нарисованы в квадрате -4..4.
export function PoliceCar() {
  return (
    <g className="police-car">
      <rect x={-4.2} y={-1.2} width={8.4} height={3} rx={1} className="car-body" />
      <path d="M-2.4 -1.2l1-1.8h2.8l1 1.8z" className="car-body" />
      <rect x={-0.9} y={-3.9} width={1.8} height={0.9} rx={0.3} className="car-light" />
      <circle cx={-2.4} cy={1.9} r={0.9} className="car-wheel" />
      <circle cx={2.4} cy={1.9} r={0.9} className="car-wheel" />
    </g>
  )
}

export function Footprints() {
  return (
    <g className="footprints">
      <ellipse cx={-1.4} cy={1.2} rx={0.9} ry={1.5} />
      <ellipse cx={1.4} cy={-1.2} rx={0.9} ry={1.5} />
    </g>
  )
}

export function Compass({ x, y }: { x: number; y: number }) {
  return (
    <g className="compass" transform={`translate(${x} ${y})`}>
      <circle r={5} />
      <path d="M0 -6L1.3 0 0 6-1.3 0z" />
      <path d="M0 -6L1.3 0H-1.3z" className="north" />
      <text y={-7}>С</text>
    </g>
  )
}

// Фон: туман над крышами. Без анимации при prefers-reduced-motion.
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="fog fog-1" />
      <div className="fog fog-2" />
    </div>
  )
}

// Ночная панорама: вор со скрипичным футляром бежит по крышам, внизу за ним гонится патруль,
// по небу шарят прожекторы. Здания генерируются по фиксированной таблице.
const GROUND = 360
const BUILDINGS: [number, number, number, string?][] = [
  // x, ширина, высота, тип крыши
  [0, 110, 120, 'flat'],
  [130, 90, 160, 'gable'],
  [240, 120, 140, 'flat'],
  [380, 200, 120, 'temple'],
  [600, 100, 200, 'gable'],
  [720, 90, 160, 'flat'],
  [830, 120, 210, 'tower'],
  [970, 100, 150, 'gable'],
  [1090, 110, 175, 'flat'],
]

const roofY = (h: number) => GROUND - h

const roofPath = (): string => {
  let d = ''
  BUILDINGS.forEach(([x, w, h], i) => {
    const y = roofY(h)
    d += i === 0 ? `M${x - 40} ${y}L${x + w - 10} ${y}` : `L${x + w - 10} ${y}`
    const next = BUILDINGS[i + 1]
    if (next) {
      const [nx, , nh] = next
      const ny = roofY(nh)
      d += `Q${(x + w + nx) / 2} ${Math.min(y, ny) - 70} ${nx + 12} ${ny}`
    } else d += `L${x + w + 80} ${y}`
  })
  return d
}

function Building({ b, seed }: { b: (typeof BUILDINGS)[number]; seed: number }) {
  const [x, w, h, roof] = b
  const y = roofY(h)
  const rand = (n: number) => ((Math.sin(seed * 97 + n * 13.7) + 1) / 2) % 1
  const cols = Math.max(2, Math.floor(w / 28))
  const rows = Math.max(2, Math.floor((h - 30) / 34))
  const windows = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const lit = rand(r * 7 + c) > 0.45
      windows.push(
        <rect
          key={`${r}-${c}`}
          x={x + 12 + c * ((w - 24) / cols) + 2}
          y={y + 20 + r * 34}
          width={12}
          height={16}
          className={lit ? 'pane is-lit' : 'pane'}
          style={lit ? { animationDelay: `${rand(r + c * 3) * 12}s`, animationDuration: `${8 + rand(c + r) * 10}s` } : undefined}
        />,
      )
    }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="bld" />
      {roof === 'gable' && <path d={`M${x - 6} ${y}L${x + w / 2} ${y - 34}L${x + w + 6} ${y}z`} className="bld" />}
      {roof === 'tower' && (
        <>
          <rect x={x + w / 2 - 16} y={y - 50} width={32} height={50} className="bld" />
          <path d={`M${x + w / 2 - 20} ${y - 50}L${x + w / 2} ${y - 86}L${x + w / 2 + 20} ${y - 50}z`} className="bld" />
          <circle cx={x + w / 2} cy={y - 28} r={10} className="clock" />
          <path d={`M${x + w / 2} ${y - 28}v-7M${x + w / 2} ${y - 28}h5`} className="clock-hands" />
        </>
      )}
      {roof === 'temple' && (
        <>
          <path d={`M${x - 10} ${y}L${x + w / 2} ${y - 46}L${x + w + 10} ${y}z`} className="bld" />
          <text x={x + w / 2} y={y - 12} className="facade-sign">
            ФИЛАРМОНИЯ
          </text>
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={x + 18 + i * 30} y={y + 18} width={10} height={h - 18} className="column" />
          ))}
        </>
      )}
      {roof === 'flat' && <rect x={x + w - 30} y={y - 22} width={12} height={22} className="bld" />}
      {roof !== 'temple' && windows}
    </g>
  )
}

function Thief() {
  return (
    <g className="thief">
      {/* шляпа, плащ с развевающимися полами, футляр */}
      <path d="M-9 -58h18l-3 -4h-12z" />
      <rect x={-6} y={-70} width={12} height={9} rx={2} />
      <circle cx={0} cy={-52} r={6} />
      <path d="M-7 -46h13l6 22 10 8-12-2-3 0-4 2-10-2z" />
      <path className="case" d="M6 -42l26 -8 3 6-26 9z" />
      <g className="legs-a">
        <path d="M-2 -18l-10 12-4 6h6l10-14M3 -18l8 9 9-2 1 4-12 2z" />
      </g>
      <g className="legs-b">
        <path d="M-1 -18l2 12 -4 6h6l4-18M3 -18l-6 10 3 8h4l-1-8z" />
      </g>
    </g>
  )
}

function PatrolCar() {
  return (
    <g className="patrol-car">
      <path className="headbeam" d="M150 -14L420 -50L420 30z" />
      <ellipse cx={70} cy={4} rx={110} ry={10} className="siren-glow" />
      <path className="car-shell" d="M0 -6q0-14 14-16l26-4 18-20h56l22 20 22 4q12 2 12 14v12H0z" />
      <path className="car-glass" d="M62 -42h20v16H48zM88 -42h22l16 16H88z" />
      <rect x={4} y={-12} width={160} height={7} className="car-stripe" />
      <text x={86} y={-14} className="car-word">
        ПОЛИЦИЯ
      </text>
      <rect x={76} y={-54} width={10} height={8} rx={2} className="siren blue" />
      <rect x={88} y={-54} width={10} height={8} rx={2} className="siren red" />
      <circle cx={38} cy={8} r={13} className="car-tyre" />
      <circle cx={136} cy={8} r={13} className="car-tyre" />
      <circle cx={38} cy={8} r={5} className="car-hub" />
      <circle cx={136} cy={8} r={5} className="car-hub" />
      <rect x={160} y={-8} width={8} height={6} rx={1} className="car-lamp" />
    </g>
  )
}

export function TownPanorama() {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const path = roofPath()
  return (
    <svg className="panorama" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1424" />
          <stop offset="0.7" stopColor="#1f2c48" />
          <stop offset="1" stopColor="#33405e" />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#f6e3a8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f6e3a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f3e2b0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#f3e2b0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="headbeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff2c4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2c4" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lampGlow">
          <stop offset="0" stopColor="#ffcf6e" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffcf6e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={1200} height={560} fill="url(#sky)" />
      {[[80, 40], [220, 90], [340, 30], [470, 70], [700, 50], [560, 20], [1000, 110], [1150, 40], [880, 140], [300, 130]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} className="star-dot" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      <circle cx={1010} cy={110} r={110} fill="url(#moonGlow)" />
      <circle cx={1010} cy={110} r={36} className="moon" />
      <circle cx={998} cy={100} r={6} className="moon-crater" />
      <circle cx={1022} cy={124} r={4} className="moon-crater" />
      <g className="cloud cloud-1">
        <path d="M0 0h160q-10-22-40-20-12-26-46-14-30-8-40 16-34 0-34 18z" />
      </g>
      <g className="cloud cloud-2">
        <path d="M0 0h120q-8-18-30-16-10-20-36-10-22-6-30 12-26 0-24 14z" />
      </g>

      <g transform="translate(0 140)">
      <g className="searchlight" style={{ transformOrigin: '180px 380px' }}>
        <path d="M180 380L120 -40H240z" fill="url(#beam)" />
      </g>
      <g className="searchlight is-late" style={{ transformOrigin: '1060px 380px' }}>
        <path d="M1060 380L1000 -40H1120z" fill="url(#beam)" />
      </g>

      <path className="far" d="M0 300q120-60 260-30t280-40 300 30 360-40v200H0z" />
      {BUILDINGS.map((b, i) => (
        <Building key={i} b={b} seed={i + 1} />
      ))}

      {/* кот на крыше */}
      <g transform={`translate(${BUILDINGS[5][0] + 20} ${roofY(BUILDINGS[5][2])})`} className="cat">
        <path d="M0 0q0-14 8-16l2-6 3 5h4l3-5 2 6q6 4 4 16zM26 0q14-2 10-16" />
        <circle cx={10} cy={-14} r={1.4} className="eye" />
        <circle cx={18} cy={-14} r={1.4} className="eye" />
      </g>

      {[300, 760].map((x) => (
        <g key={x}>
          <circle cx={x} cy={318} r={50} fill="url(#lampGlow)" className="lamp-glow" />
          <path d={`M${x} ${GROUND + 12}V318`} className="lamp-post" />
          <path d={`M${x - 8} 318h16l-4-12h-8z`} className="lamp-head" />
        </g>
      ))}
      <rect x={0} y={GROUND} width={1200} height={60} className="street" />
      <path d={`M0 ${GROUND + 30}H1200`} className="street-line" />

      <g className="patrol-run">
        <g transform={`translate(0 ${GROUND + 28})`}>
          <PatrolCar />
        </g>
      </g>

      <g transform={reduced ? `translate(330 ${roofY(BUILDINGS[2][2])})` : undefined}>
        <g transform="scale(1.5)">
          <Thief />
        </g>
        {!reduced && <animateMotion dur="15s" repeatCount="indefinite" path={path} />}
      </g>
      </g>
    </svg>
  )
}
