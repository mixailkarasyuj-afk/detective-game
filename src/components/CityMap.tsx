import type { CityPack } from '../game/types'

interface Props {
  pack: CityPack
  crimeScene: string
  patrols: string[]
  marked: string[] // районы, где команда уже что-то делала в этом раунде
  revealPath?: string[] // маршрут беглеца, показывается после партии
  selectable: boolean
  onSelect: (districtId: string) => void
}

export function CityMap({ pack, crimeScene, patrols, marked, revealPath, selectable, onSelect }: Props) {
  const pos = Object.fromEntries(pack.districts.map((d) => [d.id, d]))
  return (
    <svg className="city-map" viewBox="-8 -6 116 112" role="group" aria-label={`Карта города ${pack.city}`}>
      {pack.roads.map(([a, b]) => (
        <line key={a + b} className="road" x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}
      {revealPath && (
        <polyline className="escape-path" points={revealPath.map((id) => `${pos[id].x},${pos[id].y}`).join(' ')} />
      )}
      {pack.districts.map((d) => {
        const classes = [
          'district',
          d.id === crimeScene && 'is-scene',
          patrols.includes(d.id) && 'is-patrol',
          marked.includes(d.id) && 'is-marked',
          selectable && 'is-selectable',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <g
            key={d.id}
            className={classes}
            transform={`translate(${d.x} ${d.y})`}
            onClick={() => selectable && onSelect(d.id)}
            role={selectable ? 'button' : undefined}
            tabIndex={selectable ? 0 : undefined}
            onKeyDown={(e) => selectable && (e.key === 'Enter' || e.key === ' ') && onSelect(d.id)}
          >
            <circle r={6} />
            {patrols.includes(d.id) && <text className="icon" y={2}>🚓</text>}
            {d.id === crimeScene && !patrols.includes(d.id) && <text className="icon" y={2}>✖</text>}
            <text className="label" y={11}>
              {d.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
