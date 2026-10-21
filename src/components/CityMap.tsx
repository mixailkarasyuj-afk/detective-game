import type { CityPack } from '../game/types'
import { witnessIn } from '../game/engine'
import { Compass, DistrictGlyph, Footprints, PoliceCar } from './Art'

interface Props {
  pack: CityPack
  crimeScene: string
  patrols: string[]
  marked: string[] // районы, где команда действовала в этом раунде
  trails: string[] // районы, где нашли следы беглеца
  revealPath?: string[] // маршрут беглеца после партии
  selectable: (districtId: string) => boolean
  onSelect: (districtId: string) => void
}

// Деревья для украшения карты, детерминированно по названию города.
const decorTrees = (seed: string): [number, number][] => {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const next = () => ((h = (h * 1103515245 + 12345) >>> 0) % 1000) / 1000
  return Array.from({ length: 26 }, () => [next() * 96 + 2, next() * 96 + 2])
}

export function CityMap({ pack, crimeScene, patrols, marked, trails, revealPath, selectable, onSelect }: Props) {
  const pos = Object.fromEntries(pack.districts.map((d) => [d.id, d]))
  const anySelectable = pack.districts.some((d) => selectable(d.id))
  return (
    <svg
      className={`city-map ${anySelectable ? 'is-choosing' : ''}`}
      viewBox="-6 -6 112 112"
      role="group"
      aria-label={`Карта: ${pack.city}`}
    >
      <defs>
        <pattern id="paper" width={4} height={4} patternUnits="userSpaceOnUse">
          <path d="M0 4L4 0" className="hatch" />
        </pattern>
      </defs>
      <rect x={-6} y={-6} width={112} height={112} className="map-ground" />
      <rect x={-6} y={-6} width={112} height={112} fill="url(#paper)" />
      <path className="river" d="M100 -6C92 20 104 40 96 60S100 90 94 106" />
      {decorTrees(pack.city)
        .filter(([x, y]) => pack.districts.every((d) => Math.hypot(d.x - x, d.y - y) > 13))
        .map(([x, y], i) => (
          <g key={i} className="tree" transform={`translate(${x} ${y})`}>
            <circle r={1.6} />
            <circle cx={1.4} cy={0.8} r={1.2} />
          </g>
        ))}
      <Compass x={6} y={98} />
      <g className="cartouche" transform="translate(30 -2)">
        <rect x={-14} y={-3.6} width={28} height={6} rx={1} />
        <text y={1}>{pack.city}</text>
      </g>
      {pack.roads.map(([a, b]) => (
        <line key={a + b} className="road" x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}
      {revealPath && (
        <polyline
          className="escape-path"
          points={revealPath.map((id) => `${pos[id].x},${pos[id].y}`).join(' ')}
          pathLength={1}
        />
      )}
      {pack.districts.map((d) => {
        const canPick = selectable(d.id)
        const w = witnessIn(pack, d.id)
        const classes = [
          'district',
          d.id === crimeScene && 'is-scene',
          patrols.includes(d.id) && 'is-patrol',
          marked.includes(d.id) && 'is-marked',
          canPick && 'is-selectable',
        ]
          .filter(Boolean)
          .join(' ')
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
            <circle r={8.5} className="plate" />
            <g transform="scale(0.55)">
              <DistrictGlyph icon={d.icon} />
            </g>
            {canPick && <circle r={10.5} className="pulse" />}
            {patrols.includes(d.id) && (
              <g className="patrol-badge" transform="translate(7 -7)">
                <circle r={4.2} />
                <g transform="scale(0.75)">
                  <PoliceCar />
                </g>
              </g>
            )}
            {trails.includes(d.id) && (
              <g className="trail-badge" transform="translate(7 7)">
                <circle r={3.6} />
                <Footprints />
              </g>
            )}
            {d.id === crimeScene && (
              <g className="scene-badge" transform="translate(-7 -7)">
                <circle r={3.6} />
                <text y={1.3}>✕</text>
              </g>
            )}
            <text className="label" y={13}>
              {d.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
