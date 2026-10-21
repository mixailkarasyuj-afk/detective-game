import { useMemo } from 'react'
import type { CityPack, District } from '../game/types'
import { witnessIn } from '../game/engine'
import { Compass, DistrictGlyph, Footprints, PoliceCar } from './Art'

interface Props {
  pack: CityPack
  crimeScene: string
  patrols: string[]
  marked: string[] // районы, где команда действовала в этом раунде
  trails: string[] // районы, где нашли следы беглеца
  revealPath?: string[] // маршрут беглеца после партии
  closedRoads?: [string, string][]
  blackout?: string
  selectable: (districtId: string) => boolean
  onSelect: (districtId: string) => void
}

type Decor =
  | { kind: 'house'; x: number; y: number; w: number; h: number; tone: number }
  | { kind: 'tree'; x: number; y: number; r: number }
  | { kind: 'shed'; x: number; y: number; w: number }
  | { kind: 'boat'; x: number; y: number }

// Детерминированный генератор, чтобы карта города всегда выглядела одинаково.
const rng = (seed: string) => {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => ((h = (h * 1103515245 + 12345) >>> 0) % 10000) / 10000
}

const distToSegment = (px: number, py: number, a: District, b: District) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy))
}

// Кварталы вокруг каждого района: дома, а в парке деревья, в порту лодки, в промзоне цеха.
const buildDecor = (pack: CityPack): Decor[] => {
  const pos = Object.fromEntries(pack.districts.map((d) => [d.id, d]))
  const rand = rng(pack.city)
  const free = (x: number, y: number, gap: number) =>
    x > -3 && x < 91 && y > 3 && y < 102 &&
    pack.districts.every((d) => Math.hypot(d.x - x, d.y - y) > 9.5) &&
    pack.roads.every(([a, b]) => distToSegment(x, y, pos[a], pos[b]) > gap)
  const out: Decor[] = []
  for (const d of pack.districts) {
    for (let i = 0; i < 24; i++) {
      const angle = rand() * Math.PI * 2
      const r = 10 + rand() * 9
      const x = d.x + Math.cos(angle) * r
      const y = d.y + Math.sin(angle) * r
      if (d.icon === 'park') {
        if (free(x, y, 2)) out.push({ kind: 'tree', x, y, r: 1.4 + rand() * 1.2 })
      } else if (d.icon === 'factory') {
        if (free(x, y, 3)) out.push({ kind: 'shed', x, y, w: 4 + rand() * 2 })
      } else if ((d.icon === 'port' || d.icon === 'embankment') && i % 3 === 0) {
        if (free(x, y, 2.5)) out.push({ kind: 'boat', x, y })
      } else if (free(x, y, 2.5)) {
        out.push({ kind: 'house', x, y, w: 2.4 + rand() * 1.8, h: 1.8 + rand() * 1.2, tone: Math.floor(rand() * 3) })
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = rand() * 92
    const y = rand() * 100 + 2
    if (free(x, y, 3)) out.push({ kind: 'tree', x, y, r: 1 + rand() })
  }
  return out.filter((o, i) => out.slice(0, i).every((p) => Math.hypot(p.x - o.x, p.y - o.y) > 3.2))
}

function DecorShape({ d }: { d: Decor }) {
  if (d.kind === 'tree')
    return (
      <g className="m-tree" transform={`translate(${d.x} ${d.y})`}>
        <circle cx={0.4} cy={0.5} r={d.r} className="m-shadow" />
        <circle r={d.r} />
      </g>
    )
  if (d.kind === 'boat')
    return <path className="m-boat" transform={`translate(${d.x} ${d.y})`} d="M-2 0h4l-1 1.2h-2zM0 0v-2.4l1.6 1.8z" />
  if (d.kind === 'shed') {
    const s = d.w / 4
    return (
      <path
        className="m-shed"
        transform={`translate(${d.x} ${d.y})`}
        d={`M${-d.w / 2} 1.6V-0.6l${s} -1.2v1.2l${s} -1.2v1.2l${s} -1.2v1.2l${s} -1.2V1.6z`}
      />
    )
  }
  return (
    <g className={`m-house tone-${d.tone}`} transform={`translate(${d.x} ${d.y})`}>
      <rect x={-d.w / 2 + 0.4} y={-d.h / 2 + 0.5} width={d.w} height={d.h} className="m-shadow" />
      <rect x={-d.w / 2} y={-d.h / 2} width={d.w} height={d.h} className="m-wall" />
      <path d={`M${-d.w / 2} ${-d.h / 2}h${d.w}l${-d.w * 0.2} ${-d.h * 0.45}h${-d.w * 0.6}z`} className="m-roof" />
    </g>
  )
}

export function CityMap({ pack, crimeScene, patrols, marked, trails, revealPath, closedRoads = [], blackout, selectable, onSelect }: Props) {
  const pos = Object.fromEntries(pack.districts.map((d) => [d.id, d]))
  const anySelectable = pack.districts.some((d) => selectable(d.id))
  const decor = useMemo(() => buildDecor(pack), [pack])
  return (
    <svg
      className={`city-map ${anySelectable ? 'is-choosing' : ''}`}
      viewBox="-8 -8 116 116"
      role="group"
      aria-label={`Карта: ${pack.city}`}
    >
      <defs>
        <radialGradient id="stain">
          <stop offset="0" stopColor="#c9a86a" stopOpacity="0.2" />
          <stop offset="0.8" stopColor="#c9a86a" stopOpacity="0.08" />
          <stop offset="1" stopColor="#c9a86a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" r="0.75">
          <stop offset="0.6" stopColor="#8a6a3a" stopOpacity="0" />
          <stop offset="1" stopColor="#8a6a3a" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <rect x={-8} y={-8} width={116} height={116} className="map-ground" />
      <circle cx={20} cy={30} r={18} fill="url(#stain)" />
      <circle cx={70} cy={78} r={22} fill="url(#stain)" />

      <path className="river-bank" d="M108 -8H97C89 20 101 40 93 60S97 90 91 108H108z" />
      <path className="river" d="M108 -8H99.5C91.5 20 103.5 40 95.5 60S99.5 90 93.5 108H108z" />
      <path className="river-wave" d="M101 8q1.5 -1 3 0M100 32q1.5 -1 3 0M99 72q1.5 -1 3 0M98 94q1.5 -1 3 0" />

      {decor.map((d, i) => (
        <DecorShape key={i} d={d} />
      ))}

      {pack.roads.map(([a, b]) => (
        <line key={`e${a}${b}`} className="road-edge" x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}
      {pack.roads.map(([a, b]) => (
        <line key={a + b} className="road" x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}
      {closedRoads.map(([a, b]) => {
        const x = (pos[a].x + pos[b].x) / 2
        const y = (pos[a].y + pos[b].y) / 2
        return (
          <g key={`c${a}${b}`} className="roadblock" transform={`translate(${x} ${y})`}>
            <rect x={-4} y={-1.3} width={8} height={2.6} rx={0.6} />
            <path d="M-3 -1.3l1.6 2.6M0 -1.3l1.6 2.6M3 -1.3l1.6 2.6" />
          </g>
        )
      })}
      {revealPath && (
        <polyline
          className="escape-path"
          points={revealPath.map((id) => `${pos[id].x},${pos[id].y}`).join(' ')}
          pathLength={1}
        />
      )}

      <rect x={-8} y={-8} width={116} height={116} fill="url(#vignette)" pointerEvents="none" />
      <rect x={-6.5} y={-6.5} width={113} height={113} className="map-frame" />
      <rect x={-5.5} y={-5.5} width={111} height={111} className="map-frame thin" />
      <Compass x={3} y={97} />
      <g className="cartouche" transform="translate(29 -3)">
        <path d="M-15 -3.2h30l-2 3.2 2 3.2h-30l2-3.2z" />
        <text y={1.2}>{pack.city}</text>
      </g>

      {pack.districts.map((d) => {
        const canPick = selectable(d.id)
        const w = witnessIn(pack, d.id)
        const classes = [
          'district',
          d.id === crimeScene && 'is-scene',
          patrols.includes(d.id) && 'is-patrol',
          marked.includes(d.id) && 'is-marked',
          canPick && 'is-selectable',
          d.id === blackout && 'is-dark',
        ]
          .filter(Boolean)
          .join(' ')
        const labelW = d.name.length * 1.85 + 4
        return (
          <g
            key={d.id}
            className={classes}
            transform={`translate(${d.x} ${d.y})`}
            onClick={() => canPick && onSelect(d.id)}
            role={canPick ? 'button' : undefined}
            tabIndex={canPick ? 0 : undefined}
            aria-label={d.name}
            onKeyDown={(e) => canPick && (e.key === 'Enter' || e.key === ' ') && onSelect(d.id)}
          >
            <title>{w ? `${d.name}. Свидетель: ${w.name} (${w.character.toLowerCase()})` : d.name}</title>
            <circle r={7.6} cy={0.9} className="m-shadow" />
            <circle r={7.6} className="plate" />
            <circle r={6.5} className="plate-ring" />
            <g transform="scale(0.48)">
              <DistrictGlyph icon={d.icon} />
            </g>
            {canPick && <circle r={9.5} className="pulse" />}
            <g className="ribbon" transform="translate(0 10.6)">
              <path d={`M${-labelW / 2} -2.3h${labelW}l-1.1 2.3 1.1 2.3h${-labelW}l1.1 -2.3z`} />
              <text y={1}>{d.name}</text>
            </g>
            {patrols.includes(d.id) && (
              <g className="patrol-badge" transform="translate(6.5 -6.5)">
                <circle r={4.2} />
                <g transform="scale(0.75)">
                  <PoliceCar />
                </g>
              </g>
            )}
            {trails.includes(d.id) && (
              <g className="trail-badge" transform="translate(6.5 4.5)">
                <circle r={3.2} />
                <Footprints />
              </g>
            )}
            {d.id === crimeScene && (
              <g className="scene-badge" transform="translate(-6.5 -6.5)">
                <circle r={3.6} />
                <text y={1.3}>✕</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
