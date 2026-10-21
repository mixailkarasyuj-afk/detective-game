import type { CityPack } from '../game/types'
import { witnessIn } from '../game/engine'
import { DistrictGlyph } from './Art'

interface Props {
  pack: CityPack
  crimeScene: string
  patrols: string[]
  marked: string[] // районы, где команда действовала в этом раунде
  revealPath?: string[] // маршрут беглеца после партии
  selectable: (districtId: string) => boolean
  onSelect: (districtId: string) => void
}

export function CityMap({ pack, crimeScene, patrols, marked, revealPath, selectable, onSelect }: Props) {
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
            {patrols.includes(d.id) && (
              <g className="patrol-badge" transform="translate(7 -7)">
                <circle r={3.6} />
                <text y={1.3}>П</text>
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
