import { useEffect, useState, type CSSProperties } from 'react'
import {
  MAX_PATROLS,
  QUESTIONS,
  applyAction,
  arrest,
  canPlacePatrol,
  culprit,
  intercept,
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
import type { Witness } from '../game/types'
import { CityMap } from './CityMap'
import { LINES, say } from '../game/lines'
import { CommissarSays, Says } from './Commissar'

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
  const [line, setLine] = useState<{ text: string; witness?: Witness }>(() => ({ text: `${say('intro')} ${game.crime.text}` }))
  const [intro, setIntro] = useState(true)

  const finished = game.status === 'won' || game.status === 'lost'
  const chasing = game.status === 'chase'
  const roundEntries = game.log.filter((e) => e.round === game.round)

  const act = (a: Action, comment: keyof typeof LINES) => {
    const next = applyAction(game, a)
    setGame(next)
    setDone(done + 1)
    setMode(null)
    const w = a.kind === 'interrogate' ? witnessIn(pack, a.district) : undefined
    setLine(w ? { text: next.log[next.log.length - 1].text, witness: w } : { text: say(comment) })
  }

  const nextRound = () => {
    const next = endRound(game)
    setGame(next)
    setDone(0)
    setLine({ text: next.status === 'lost' ? say('lose') : say('roundStart') })
    setIntro(next.status === 'playing')
  }

  const confirmArrest = (suspect: string, district: string) => {
    const result = arrest(game, suspect, district)
    setGame(result)
    setMode(null)
    setLine({ text: result.status === 'chase' ? say('chase') : result.status === 'won' ? say('win') : say('lose') })
  }

  const block = (d: string) => {
    const result = intercept(game, d)
    setGame(result)
    setLine({ text: result.status === 'won' ? say('win') : say('lose') })
  }

  const restart = () => {
    const g = newGame(pack, players)
    setGame(g)
    setDone(0)
    setMode(null)
    setCrossed([])
    setLine({ text: `${say('intro')} ${g.crime.text}` })
    setIntro(true)
  }

  const selectable = (d: string): boolean => {
    if (chasing) return game.exits.includes(d)
    if (!mode || finished) return false
    if (mode.kind === 'inspect') return d !== game.blackout
    if (mode.kind === 'patrol') {
      if (!mode.district) return !game.patrols.includes(d)
      return game.patrols.includes(d)
    }
    if (mode.kind === 'interrogate') return !mode.district
    return true
  }

  const onMap = (d: string) => {
    if (chasing) return block(d)
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
            trails={game.log.flatMap((e) => (e.trail && e.district ? [e.district] : []))}
            revealPath={finished ? game.path : undefined}
            closedRoads={game.closedRoads.filter((r) => r.until >= game.round).map((r) => r.road)}
            blackout={game.blackout}
            selectable={selectable}
            onSelect={onMap}
          />
        </div>

        <div className="control-col">
          {line.witness ? (
            <Says
              avatar={<Portrait look={line.witness.look} size={72} />}
              name={line.witness.name}
              note={districtName(pack, line.witness.district)}
              text={line.text}
            />
          ) : (
            <CommissarSays text={line.text} />
          )}

          {chasing && (
            <section className="turn chase-panel">
              <h2>Перехват!</h2>
              <p>
                Это он, и он здесь, но у беглеца остались открытые улицы. Он уже рванул к одной из них. Выберите на
                карте, куда бросить последний заслон.
              </p>
              <p className="muted">
                Открытые выходы: {game.exits.map((d) => `«${districtName(pack, d)}»`).join(', ')}. В следующий раз
                перекройте их патрулями заранее.
              </p>
            </section>
          )}

          {!finished && !chasing && (
            <section className="turn">
              <div className="turn-head">
                <span>
                  Ведущий следователь: <b>{leadPlayer(game)}</b>
                </span>
                <DiscussionTimer key={game.round} />
              </div>
              {game.event && (
                <p className="rumor event">
                  <span className="tag">{game.event.title}</span> {game.event.text}
                </p>
              )}
              <p className="rumor">
                <span className="tag">Слухи</span> {game.rumor}
              </p>

              {done < game.actions && !mode && (
                <>
                  <p className="prompt">Действие {done + 1} из {game.actions}. Можно выбрать одно и то же дважды.</p>
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

              {done >= game.actions && (
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
        <h3>Досье подозреваемых</h3>
        <p className="muted">Нажмите на досье, чтобы поставить штамп «Не он».</p>
        <ul>
          {suspectsOf(game).map((p, i) => {
            const isCulprit = finished && p.id === game.culpritId
            const stamp = isCulprit ? (game.status === 'won' ? 'Арестован' : 'Виновен') : crossed.includes(p.id) ? 'Не он' : null
            return (
              <li key={p.id}>
                <button
                  className={`dossier ${crossed.includes(p.id) ? 'is-crossed' : ''} ${isCulprit ? 'is-culprit' : ''}`}
                  style={{ '--tilt': `${((i * 7) % 5) - 2}deg` } as CSSProperties}
                  onClick={() => toggleCross(p.id)}
                  aria-pressed={crossed.includes(p.id)}
                >
                  <span className="clip" aria-hidden="true" />
                  <span className="photo">
                    <Portrait look={p.look} size={64} />
                  </span>
                  <span className="dossier-text">
                    <b>{p.name}</b>
                    <span className="role">{p.role}</span>
                    <span className="traits">
                      {pack.traits.map((t) => (
                        <span key={t.id} className="trait">
                          <span className="trait-label">{t.label}</span> {p.traits[t.id]}
                        </span>
                      ))}
                    </span>
                  </span>
                  {stamp && (
                    <span className="stamp" key={stamp}>
                      {stamp}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {intro && !finished && <RoundIntro game={game} onClose={() => setIntro(false)} />}
    </div>
  )
}

function RoundIntro({ game, onClose }: { game: GameState; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <article className="newspaper" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Раунд ${game.round}`}>
        <header className="masthead">
          <span>Раунд {game.round} из {game.pack.rounds}</span>
          <h2>{game.pack.newspaper}</h2>
          <span>Цена 5 коп.</span>
        </header>
        {game.round === 1 && (
          <p className="kicker">
            Происшествие: {game.crime.title}. Место — {districtName(game.pack, game.crimeScene)}.
          </p>
        )}
        {game.event ? (
          <>
            <h3 className="headline">{game.event.title}</h3>
            <p className="event-text">{game.event.text}</p>
            <p className="byline">
              <b>Слухи.</b> {game.rumor} <i>Редакция за достоверность не ручается.</i>
            </p>
          </>
        ) : (
          <>
            <h3 className="headline">{game.rumor}</h3>
            <p className="byline">Слухи с улиц. Редакция за достоверность не ручается.</p>
          </>
        )}
        <div className="newspaper-foot">
          <span>
            Ведущий следователь: <b>{leadPlayer(game)}</b>
          </span>
          <button className="primary" onClick={onClose} autoFocus>
            К делу
          </button>
        </div>
      </article>
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
      <div className="witness-head">
        <Portrait look={w.look} size={52} />
        <p>
          <b>{w.name}</b>, {districtName(pack, district)}
          <span className="character">{w.character}</span>
        </p>
      </div>
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
        Попытка одна на всю игру. Выберите подозреваемого и район, где его брать. Если из района останутся улицы без патруля, он побежит, и перехватить его будет непросто.
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
  const c = culprit(game)
  return (
    <article className={`newspaper ending ${won ? 'is-win' : 'is-loss'}`}>
      <header className="masthead">
        <span>Экстренный выпуск</span>
        <h2>{game.pack.newspaper}</h2>
        <span>Раунд {game.round}</span>
      </header>
      <h3 className="headline">{won ? `Дело раскрыто! Под арестом: ${c.name}` : 'Преступник ушёл от погони'}</h3>
      {won && (
        <p className="stars" aria-label={`${game.stars} из 3 звёзд`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={i <= game.stars ? 'star is-on' : 'star'}>
              ★
            </span>
          ))}
        </p>
      )}
      <div className="ending-body">
        <Portrait look={c.look} size={72} className="ending-photo" />
        <div>
          <p>{game.endReason}</p>
          <p className="muted">
            Маршрут беглеца:{' '}
            {game.path
              .map((id) => districtName(game.pack, id))
              .join(' → ')}
            .
          </p>
          <p className="muted">
            {game.lies.length > 0 ? `Соврали или напутали: ${game.lies.join(', ')}.` : 'Никто из опрошенных не соврал.'}
          </p>
        </div>
      </div>
      <div className="dialog-buttons">
        <button className="primary" onClick={onRestart}>
          Новое дело в этом городе
        </button>
        <button onClick={onExit}>Ко всем городам</button>
      </div>
    </article>
  )
}
