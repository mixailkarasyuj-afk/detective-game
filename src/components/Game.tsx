import { useState } from 'react'
import {
  MAX_PATROLS,
  MAX_ROUNDS,
  accuse,
  applyAction,
  canPatrol,
  culprit,
  districtName,
  endRound,
  leadPlayer,
  newGame,
} from '../game/engine'
import type { ActionKind, CityPack, GameState } from '../game/types'
import { CityMap } from './CityMap'

const ACTIONS: { kind: ActionKind; title: string; hint: string }[] = [
  { kind: 'interrogate', title: 'Допросить свидетеля', hint: 'Свидетель расскажет, что видел. Некоторые врут.' },
  { kind: 'inspect', title: 'Осмотреть район', hint: 'Найти следы беглеца или улику на месте преступления.' },
  { kind: 'patrol', title: 'Поставить патруль', hint: 'Если беглец здесь — он задержан. Иначе район закрыт для него.' },
]

const ACTION_ICONS: Record<ActionKind, string> = { interrogate: '🗣', inspect: '🔍', patrol: '🚓' }

interface Props {
  pack: CityPack
  players: string[]
  onExit: () => void
}

export function Game({ pack, players, onExit }: Props) {
  const [game, setGame] = useState<GameState>(() => newGame(pack, players))
  const [used, setUsed] = useState<ActionKind[]>([])
  const [selected, setSelected] = useState<ActionKind | null>(null)
  const [crossed, setCrossed] = useState<string[]>([])

  const roundClues = game.clues.filter((c) => c.round === game.round)
  const finished = game.status === 'won' || game.status === 'lost'

  const choose = (districtId: string) => {
    if (!selected) return
    setGame(applyAction(game, selected, districtId))
    setUsed([...used, selected])
    setSelected(null)
  }

  const nextRound = () => {
    setGame(endRound(game))
    setUsed([])
  }

  const restart = () => {
    setGame(newGame(pack, players))
    setUsed([])
    setSelected(null)
    setCrossed([])
  }

  const toggleCross = (id: string) =>
    setCrossed(crossed.includes(id) ? crossed.filter((x) => x !== id) : [...crossed, id])

  return (
    <div className="game">
      <header className="game-bar">
        <button className="link" onClick={onExit}>
          ← Выйти
        </button>
        <span>
          Раунд <b>{game.round}</b> из {MAX_ROUNDS}
        </span>
        <span>
          Патрули: <b>{MAX_PATROLS - game.patrols.length}</b>
        </span>
        <span className="lead">
          Ведущий следователь: <b>{leadPlayer(game)}</b>
        </span>
      </header>

      <section className="case-card">
        <h2>{game.crime.title}</h2>
        <p>
          {game.crime.text} Место преступления — район «{districtName(pack, game.crimeScene)}». Преступник уже скрылся
          и прячется в городе. Поймайте его за {MAX_ROUNDS} раундов и назовите по имени.
        </p>
      </section>

      <div className="board">
        <div className="map-col">
          <CityMap
            pack={pack}
            crimeScene={game.crimeScene}
            patrols={game.patrols}
            marked={roundClues.map((c) => c.districtId)}
            revealPath={finished ? game.path : undefined}
            selectable={selected !== null}
            onSelect={choose}
          />
          {!finished && game.status === 'playing' && (
            <div className="actions">
              {used.length < 2 ? (
                <>
                  <p className="prompt">
                    {selected
                      ? 'Выберите район на карте.'
                      : `Обсудите и выберите действие (${used.length + 1} из 2). Последнее слово за ведущим.`}
                  </p>
                  <div className="action-buttons">
                    {ACTIONS.map((a) => {
                      const disabled = used.includes(a.kind) || (a.kind === 'patrol' && !canPatrol(game))
                      return (
                        <button
                          key={a.kind}
                          className={`action ${selected === a.kind ? 'is-active' : ''}`}
                          disabled={disabled}
                          onClick={() => setSelected(selected === a.kind ? null : a.kind)}
                        >
                          <span className="action-title">
                            {ACTION_ICONS[a.kind]} {a.title}
                          </span>
                          <span className="action-hint">{a.hint}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="round-end">
                  <p>Действия раунда выполнены. Беглец делает ход…</p>
                  <button className="primary" onClick={nextRound}>
                    {game.round < MAX_ROUNDS ? 'Следующий раунд' : 'Последний шанс упущен…'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="side-col">
          <section className="notebook">
            <h3>Блокнот следствия</h3>
            {game.clues.length === 0 && <p className="muted">Пока пусто. Начните с места преступления.</p>}
            <ol reversed>
              {[...game.clues].reverse().map((c, i) => (
                <li key={game.clues.length - i} className={c.round === game.round ? 'is-new' : ''}>
                  <span className="clue-meta">
                    Р{c.round} · {ACTION_ICONS[c.kind]} {districtName(pack, c.districtId)}
                  </span>
                  {c.text}
                </li>
              ))}
            </ol>
          </section>

          <section className="suspects">
            <h3>Подозреваемые</h3>
            <p className="muted">Нажмите, чтобы вычеркнуть.</p>
            <ul>
              {pack.suspects.map((p) => (
                <li key={p.id}>
                  <button className={`suspect ${crossed.includes(p.id) ? 'is-crossed' : ''}`} onClick={() => toggleCross(p.id)}>
                    <b>{p.name}</b>, {p.role}
                    <span className="traits">{pack.traits.map((t) => p.traits[t.id]).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {game.status === 'caught' && (
        <div className="overlay">
          <div className="dialog">
            <h2>Беглец задержан!</h2>
            <p>Кто это? Назовите преступника. Ошибётесь — он уйдёт от ответственности.</p>
            <div className="accuse-list">
              {pack.suspects.map((p) => (
                <button key={p.id} disabled={crossed.includes(p.id)} onClick={() => setGame(accuse(game, p.id))}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {finished && (
        <div className="overlay is-end">
          <div className={`dialog ${game.status === 'won' ? 'is-win' : 'is-loss'}`}>
            <h2>{game.status === 'won' ? 'Победа!' : 'Преступник ушёл'}</h2>
            <p>{game.endReason}</p>
            <p className="muted">
              Виновный: {culprit(game).name}. Маршрут беглеца:{' '}
              {game.path.map((id) => districtName(pack, id)).join(' → ')}.
            </p>
            <div className="dialog-buttons">
              <button className="primary" onClick={restart}>
                Новое дело
              </button>
              <button onClick={onExit}>В меню</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
