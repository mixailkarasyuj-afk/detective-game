import { useEffect, useState } from 'react'
import {
  MAX_PATROLS,
  QUESTIONS,
  applyAction,
  arrest,
  canPlacePatrol,
  culprit,
  districtName,
  endRound,
  leadPlayer,
  newGame,
  suspectsOf,
  witnessIn,
  type Action,
} from '../game/engine'
import type { CityPack, GameState, Question } from '../game/types'
import { Portrait } from './Art'
import { CityMap } from './CityMap'
import { LINES, say } from '../game/lines'
import { CommissarSays } from './Commissar'

const DISCUSSION_SECONDS = 90

type Mode =
  | null
  | { kind: 'interrogate'; district?: string }
  | { kind: 'inspect' }
  | { kind: 'patrol'; district?: string }
  | { kind: 'arrest'; suspect?: string; district?: string }

const ACTIONS = [
  { kind: 'interrogate', icon: '🗣', title: 'Допрос', hint: 'Задать свидетелю один вопрос' },
  { kind: 'inspect', icon: '🔍', title: 'Осмотр', hint: 'Найти следы или улику' },
  { kind: 'patrol', icon: '🚓', title: 'Патруль', hint: 'Закрыть район для беглеца' },
] as const

interface Props {
  pack: CityPack
  players: string[]
  onExit: () => void
}

export function Game({ pack, players, onExit }: Props) {
  const [game, setGame] = useState<GameState>(() => newGame(pack, players))
  const [done, setDone] = useState(0)
  const [mode, setMode] = useState<Mode>(null)
  const [crossed, setCrossed] = useState<string[]>([])
  const [line, setLine] = useState(() => `${say('intro')} ${game.crime.text}`)

  const finished = game.status !== 'playing'
  const roundEntries = game.log.filter((e) => e.round === game.round)

  const act = (a: Action, comment: keyof typeof LINES) => {
    setGame(applyAction(game, a))
    setDone(done + 1)
    setMode(null)
    setLine(say(comment))
  }

  const nextRound = () => {
    const next = endRound(game)
    setGame(next)
    setDone(0)
    setLine(next.status === 'lost' ? say('lose') : say('roundStart'))
  }

  const confirmArrest = (suspect: string, district: string) => {
    const result = arrest(game, suspect, district)
    setGame(result)
    setMode(null)
    setLine(result.status === 'won' ? say('win') : say('lose'))
  }

  const restart = () => {
    const g = newGame(pack, players)
    setGame(g)
    setDone(0)
    setMode(null)
    setCrossed([])
    setLine(`${say('intro')} ${g.crime.text}`)
  }

  const selectable = (d: string): boolean => {
    if (!mode || finished) return false
    if (mode.kind === 'patrol') {
      if (!mode.district) return !game.patrols.includes(d)
      return game.patrols.includes(d)
    }
    if (mode.kind === 'interrogate') return !mode.district
    return true
  }

  const onMap = (d: string) => {
    if (!mode) return
    if (mode.kind === 'inspect') act({ kind: 'inspect', district: d }, 'inspect')
    else if (mode.kind === 'interrogate') setMode({ ...mode, district: d })
    else if (mode.kind === 'arrest') setMode({ ...mode, district: d })
    else if (!mode.district) {
      if (canPlacePatrol(game)) act({ kind: 'patrol', district: d }, 'patrol')
      else setMode({ ...mode, district: d })
    } else act({ kind: 'patrol', district: mode.district, movePatrolFrom: d }, 'patrol')
  }

  const toggleCross = (id: string) => setCrossed(crossed.includes(id) ? crossed.filter((x) => x !== id) : [...crossed, id])

  return (
    <div className="game">
      <header className="game-bar">
        <button className="link" onClick={onExit}>
          ← К делам
        </button>
        <span className="case-name">
          {pack.city} · {game.crime.title}
        </span>
        <RoundTrack round={game.round} total={pack.rounds} />
        <span className="patrol-count" title="Патрули на карте">
          {Array.from({ length: MAX_PATROLS }, (_, i) => (
            <span key={i} className={i < game.patrols.length ? 'token is-used' : 'token'} />
          ))}
        </span>
      </header>

      <div className="board">
        <div className="map-col">
          <CityMap
            pack={pack}
            crimeScene={game.crimeScene}
            patrols={game.patrols}
            marked={roundEntries.flatMap((e) => (e.district ? [e.district] : []))}
            revealPath={finished ? game.path.slice(0, game.round + 1) : undefined}
            selectable={selectable}
            onSelect={onMap}
          />
        </div>

        <div className="control-col">
          <CommissarSays text={line} />

          {!finished && (
            <section className="turn">
              <div className="turn-head">
                <span>
                  Ведущий следователь: <b>{leadPlayer(game)}</b>
                </span>
                <DiscussionTimer key={game.round} />
              </div>
              <p className="rumor">
                <span className="tag">Слухи</span> {game.rumor}
              </p>

              {done < 2 && !mode && (
                <>
                  <p className="prompt">Действие {done + 1} из 2. Можно выбрать одно и то же дважды.</p>
                  <div className="action-buttons">
                    {ACTIONS.map((a) => (
                      <button key={a.kind} className="action" onClick={() => setMode({ kind: a.kind })}>
                        <span className="action-icon">{a.icon}</span>
                        <span className="action-title">{a.title}</span>
                        <span className="action-hint">{a.hint}</span>
                      </button>
                    ))}
                  </div>
                  {done === 0 && (
                    <button className="arrest-button" onClick={() => setMode({ kind: 'arrest' })}>
                      Объявить арест вместо действий
                    </button>
                  )}
                </>
              )}

              {mode?.kind === 'inspect' && <Hint text="Выберите район для осмотра на карте." onCancel={() => setMode(null)} />}
              {mode?.kind === 'patrol' && (
                <Hint
                  text={
                    !mode.district
                      ? 'Выберите район, куда поставить патруль.'
                      : `Все ${MAX_PATROLS} патруля на карте. Выберите, какой снять и перевести в район «${districtName(pack, mode.district)}».`
                  }
                  onCancel={() => setMode(null)}
                />
              )}
              {mode?.kind === 'interrogate' && !mode.district && (
                <Hint text="Выберите район: в каждом есть свой свидетель." onCancel={() => setMode(null)} />
              )}
              {mode?.kind === 'interrogate' && mode.district && (
                <QuestionPicker
                  pack={pack}
                  district={mode.district}
                  onAsk={(q) => act({ kind: 'interrogate', district: mode.district!, question: q }, 'interrogate')}
                  onCancel={() => setMode(null)}
                />
              )}
              {mode?.kind === 'arrest' && (
                <ArrestPanel
                  game={game}
                  suspect={mode.suspect}
                  district={mode.district}
                  onSuspect={(s) => setMode({ ...mode, suspect: s })}
                  onConfirm={confirmArrest}
                  onCancel={() => setMode(null)}
                />
              )}

              {done >= 2 && (
                <div className="round-end">
                  <p>Ход сделан. Беглец решает, куда двинуться…</p>
                  <button className="primary" onClick={nextRound}>
                    {game.round < pack.rounds ? 'Следующий раунд' : 'Завершить последний раунд'}
                  </button>
                </div>
              )}
            </section>
          )}

          {finished && <Ending game={game} onRestart={restart} onExit={onExit} />}

          <section className="notebook">
            <h3>Блокнот следствия</h3>
            <ol>
              {[...game.log].reverse().map((e, i) => (
                <li key={game.log.length - i} className={e.round === game.round ? 'is-new' : ''}>
                  <span className="clue-meta">
                    Раунд {e.round} · {e.icon} {e.title}
                  </span>
                  {e.text}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <section className="suspects">
        <h3>Подозреваемые</h3>
        <p className="muted">Нажмите на карточку, чтобы вычеркнуть.</p>
        <ul>
          {suspectsOf(game).map((p) => (
            <li key={p.id}>
              <button className={`suspect ${crossed.includes(p.id) ? 'is-crossed' : ''}`} onClick={() => toggleCross(p.id)}>
                <Portrait suspect={p} />
                <span className="suspect-text">
                  <b>{p.name}</b>
                  <span className="role">{p.role}</span>
                  <span className="traits">
                    {pack.traits.map((t) => (
                      <span key={t.id} className="trait">
                        {p.traits[t.id]}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function RoundTrack({ round, total }: { round: number; total: number }) {
  return (
    <span className="round-track" aria-label={`Раунд ${round} из ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i + 1 < round ? 'pip is-past' : i + 1 === round ? 'pip is-now' : 'pip'}>
          {i + 1}
        </span>
      ))}
    </span>
  )
}

function DiscussionTimer() {
  const [left, setLeft] = useState(DISCUSSION_SECONDS)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left])
  const share = left / DISCUSSION_SECONDS
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  return (
    <button
      className={`timer ${left === 0 ? 'is-over' : ''}`}
      onClick={() => (left === 0 ? (setLeft(DISCUSSION_SECONDS), setRunning(true)) : setRunning(!running))}
      title="Таймер обсуждения"
    >
      <svg viewBox="0 0 36 36" width={28} height={28} aria-hidden="true">
        <circle cx={18} cy={18} r={15} className="timer-track" />
        <circle cx={18} cy={18} r={15} className="timer-fill" strokeDasharray={`${share * 94.2} 94.2`} />
      </svg>
      {left === 0 ? 'Время!' : running ? label : `Обсуждение ${label}`}
    </button>
  )
}

function Hint({ text, onCancel }: { text: string; onCancel: () => void }) {
  return (
    <div className="hint">
      <p>{text}</p>
      <button className="link" onClick={onCancel}>
        Отмена
      </button>
    </div>
  )
}

function QuestionPicker({
  pack,
  district,
  onAsk,
  onCancel,
}: {
  pack: CityPack
  district: string
  onAsk: (q: Question) => void
  onCancel: () => void
}) {
  const w = witnessIn(pack, district)!
  return (
    <div className="question-picker">
      <p>
        <b>{w.name}</b>, {districtName(pack, district)}. <span className="character">«{w.character}»</span>
      </p>
      <div className="question-buttons">
        {(Object.keys(QUESTIONS) as Question[]).map((q) => (
          <button key={q} onClick={() => onAsk(q)}>
            {QUESTIONS[q]}
          </button>
        ))}
      </div>
      <button className="link" onClick={onCancel}>
        Отмена
      </button>
    </div>
  )
}

function ArrestPanel({
  game,
  suspect,
  district,
  onSuspect,
  onConfirm,
  onCancel,
}: {
  game: GameState
  suspect?: string
  district?: string
  onSuspect: (id: string) => void
  onConfirm: (suspect: string, district: string) => void
  onCancel: () => void
}) {
  return (
    <div className="arrest-panel">
      <p>
        Попытка одна на всю игру. Выберите подозреваемого и район на карте, где его брать.
      </p>
      <div className="arrest-suspects">
        {suspectsOf(game).map((p) => (
          <button key={p.id} className={suspect === p.id ? 'is-active' : ''} onClick={() => onSuspect(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <p className="muted">Район: {district ? districtName(game.pack, district) : 'не выбран'}</p>
      <div className="dialog-buttons">
        <button className="primary" disabled={!suspect || !district} onClick={() => onConfirm(suspect!, district!)}>
          Арестовать
        </button>
        <button className="link" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  )
}

function Ending({ game, onRestart, onExit }: { game: GameState; onRestart: () => void; onExit: () => void }) {
  const won = game.status === 'won'
  return (
    <section className={`ending ${won ? 'is-win' : 'is-loss'}`}>
      <h2>{won ? 'Дело закрыто' : 'Преступник ушёл'}</h2>
      {won && (
        <p className="stars" aria-label={`${game.stars} из 3 звёзд`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={i <= game.stars ? 'star is-on' : 'star'}>
              ★
            </span>
          ))}
        </p>
      )}
      <p>{game.endReason}</p>
      <p className="muted">
        Преступник: {culprit(game).name}. Маршрут на карте показан красным:{' '}
        {game.path
          .slice(0, game.round + 1)
          .map((id) => districtName(game.pack, id))
          .join(' → ')}
        .
      </p>
      <p className="muted">
        {game.lies.length > 0 ? `Соврали или напутали: ${game.lies.join(', ')}.` : 'Никто из опрошенных не соврал.'}
      </p>
      <div className="dialog-buttons">
        <button className="primary" onClick={onRestart}>
          Новое дело в этом городе
        </button>
        <button onClick={onExit}>Ко всем делам</button>
      </div>
    </section>
  )
}
