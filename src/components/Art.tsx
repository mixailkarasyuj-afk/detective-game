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

// Ночная панорама городка на главной: окна загораются и гаснут, по улице крадётся вор, за ним едет патруль.
const WINDOWS: [number, number][] = [
  [92, 214], [112, 214], [92, 238], [176, 196], [196, 196], [176, 222], [300, 230], [318, 230],
  [610, 214], [632, 214], [654, 214], [610, 240], [654, 240], [760, 200], [780, 200], [760, 226],
  [930, 220], [950, 220], [930, 246], [1040, 206], [1060, 206], [1060, 232], [1140, 228],
]

export function TownPanorama() {
  return (
    <svg className="panorama" viewBox="0 0 1200 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#f6e3a8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f6e3a8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampGlow">
          <stop offset="0" stopColor="#ffcf6e" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffcf6e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[[80, 40], [220, 80], [340, 30], [470, 70], [700, 50], [830, 20], [1110, 60], [560, 20], [1000, 90]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} className="star-dot" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
      <circle cx={960} cy={80} r={90} fill="url(#moonGlow)" />
      <circle cx={960} cy={80} r={30} className="moon" />
      <path className="far" d="M0 250q150-70 300-40t300-30 300 20 300-30v170H0z" />
      {/* дома */}
      <g className="near">
        <path d="M60 300V200l40-34 40 34v100z" />
        <path d="M150 300V182h70v118zM160 182l25-30 25 30z" />
        <rect x={204} y={140} width={8} height={24} />
        <path d="M270 300V214h70v86z" />
        {/* филармония */}
        <path d="M420 300V220h170v80z" />
        <path d="M405 222l100-50 100 50z" />
        <path d="M435 300v-70h10v70zM465 300v-70h10v70zM495 300v-70h10v70zM525 300v-70h10v70zM555 300v-70h10v70z" className="columns" />
        <path d="M590 300V196h90v104z" />
        <path d="M730 300V184h80v116zM730 184l40-26 40 26z" />
        <path d="M860 300V250h40v50z" />
        <path d="M900 300V204h80v96z" />
        <path d="M1010 300V188h80v112zM1030 188v-26h10v26z" />
        <path d="M1110 300V212h90v88z" />
      </g>
      {WINDOWS.map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={12}
          height={14}
          className="pane"
          style={{ animationDelay: `${(i * 1.7) % 9}s`, animationDuration: `${7 + (i % 5) * 2}s` }}
        />
      ))}
      {/* фонари */}
      {[250, 690, 1000].map((x) => (
        <g key={x}>
          <circle cx={x} cy={252} r={34} fill="url(#lampGlow)" className="lamp-glow" />
          <path d={`M${x} 312V252`} className="lamp-post" />
          <rect x={x - 4} y={244} width={8} height={9} className="lamp-head" />
        </g>
      ))}
      <rect x={0} y={300} width={1200} height={40} className="street" />
      {/* вор со скрипичным футляром и патрульная машина */}
      <g className="runner">
        <g transform="translate(0 270)">
          <circle cx={10} cy={4} r={5} />
          <path d="M6 10h8l2 16-3 14h-3l1-12-3 12H5l2-16z" />
          <path d="M14 13l12 6-2 3-11-5z" className="case" />
        </g>
      </g>
      <g className="chaser">
        <g transform="translate(0 286)">
          <rect x={0} y={6} width={58} height={14} rx={4} className="car-body" />
          <path d="M12 6l6-8h20l6 8z" className="car-body" />
          <rect x={24} y={-6} width={10} height={4} rx={1} className="car-light" />
          <circle cx={13} cy={21} r={5} className="car-wheel" />
          <circle cx={45} cy={21} r={5} className="car-wheel" />
        </g>
      </g>
    </svg>
  )
}
