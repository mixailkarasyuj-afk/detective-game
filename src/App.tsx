import { useState, type FormEvent } from 'react'
import { Backdrop } from './components/Art'
import { CommissarSays } from './components/Commissar'
import { Game } from './components/Game'
import { MAX_PATROLS } from './game/engine'
import type { CityPack } from './game/types'
import { BUNDLE_PRICE, catalog, type CatalogEntry } from './packs/catalog'
import { loadUnlocked, redeemCode } from './packs/unlock'

type Screen = { name: 'home' } | { name: 'setup'; pack: CityPack } | { name: 'game'; pack: CityPack; players: string[] }

const MIN_PLAYERS = 3
const MAX_PLAYERS = 8

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [players, setPlayers] = useState<string[]>(['', '', ''])

  return (
    <>
      <Backdrop />
      <div className="page">
        {screen.name === 'game' ? (
          <Game pack={screen.pack} players={screen.players} onExit={() => setScreen({ name: 'home' })} />
        ) : screen.name === 'setup' ? (
          <Setup
            pack={screen.pack}
            players={players}
            onChange={setPlayers}
            onBack={() => setScreen({ name: 'home' })}
            onStart={(names) => setScreen({ name: 'game', pack: screen.pack, players: names })}
          />
        ) : (
          <Home onPlay={(pack) => setScreen({ name: 'setup', pack })} />
        )}
      </div>
    </>
  )
}

function Home({ onPlay }: { onPlay: (pack: CityPack) => void }) {
  const [unlocked, setUnlocked] = useState<string[]>(loadUnlocked)
  const [code, setCode] = useState('')
  const [codeMessage, setCodeMessage] = useState('')

  const submitCode = async (e: FormEvent) => {
    e.preventDefault()
    const packId = await redeemCode(code)
    if (!packId) {
      setCodeMessage('Код не подошёл. Проверьте, нет ли опечатки.')
      return
    }
    setUnlocked([...new Set([...unlocked, packId])])
    setCode('')
    setCodeMessage(`Открыт город «${catalog.find((c) => c.id === packId)?.title}».`)
  }

  return (
    <div className="home">
      <header className="hero">
        <p className="eyebrow">Детективная игра для компании за одним экраном</p>
        <h1>Перехват</h1>
        <p className="lead-text">
          В городе совершено преступление, а вор уже петляет по улицам. Допрашивайте свидетелей, ищите улики,
          расставляйте патрули и объявите арест, пока он не скрылся.
        </p>
        <p className="facts">
          <span>3–8 игроков</span>
          <span>20–40 минут</span>
          <span>играют все вместе</span>
        </p>
        <CommissarSays text="Комиссар Громов, к вашим услугам. Я веду дело, говорю за свидетелей и слежу, чтобы никто не съел мои пирожки. Ваше дело — поймать преступника." />
      </header>

      <section className="how">
        <h2>Как играть</h2>
        <ol className="steps">
          <li>
            <b>Слухи.</b> В начале раунда Комиссар делится новостью с улиц. Иногда она правдива.
          </li>
          <li>
            <b>Обсуждение.</b> 90 секунд на споры. Последнее слово за ведущим следователем, роль переходит по кругу.
          </li>
          <li>
            <b>Два действия.</b> Допрос свидетеля, осмотр района или патруль. Улики не врут, свидетели бывают
            всякие. Патрулей {MAX_PATROLS}, их можно переставлять.
          </li>
          <li>
            <b>Арест.</b> Вместо действий назовите подозреваемого и район. Попытка одна, и чем раньше, тем больше
            звёзд.
          </li>
        </ol>
      </section>

      <section className="shop">
        <h2>Города</h2>
        <div className="cards">
          {catalog.map((entry) => (
            <CityCard
              key={entry.id}
              entry={entry}
              owned={entry.price === 0 || unlocked.includes(entry.id)}
              onPlay={() => entry.pack && onPlay(entry.pack)}
            />
          ))}
        </div>
        <p className="bundle">
          Оба платных города вместе — <b>{BUNDLE_PRICE} ₽</b>. Покупка навсегда, без подписки.
        </p>

        <form className="code-form" onSubmit={submitCode}>
          <label htmlFor="code">Есть код из коробки или после покупки?</label>
          <div className="code-row">
            <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Например, ABCD-1234" />
            <button type="submit" disabled={!code.trim()}>
              Активировать
            </button>
          </div>
          {codeMessage && <p className="muted">{codeMessage}</p>}
        </form>
      </section>
    </div>
  )
}

function CityCard({ entry, owned, onPlay }: { entry: CatalogEntry; owned: boolean; onPlay: () => void }) {
  return (
    <article className={`card scene-${entry.scene}`}>
      <CityScene scene={entry.scene} />
      <div className="card-body">
        <p className="card-kicker">
          {entry.crime} · {entry.districts} районов
        </p>
        <h3>{entry.title}</h3>
        <p>{entry.tagline}</p>
        {entry.twist && <p className="twist">{entry.twist}</p>}
        <div className="card-foot">
          {entry.pack && owned ? (
            <button className="primary" onClick={onPlay}>
              {entry.price === 0 ? 'Играть бесплатно' : 'Играть'}
            </button>
          ) : owned ? (
            <span className="badge">Куплено · скоро откроется</span>
          ) : (
            <>
              <span className="price">{entry.price} ₽</span>
              <button disabled title="Оплата появится позже">
                Купить · скоро
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

// Иллюстрации на карточках городов.
function CityScene({ scene }: { scene: CatalogEntry['scene'] }) {
  return (
    <svg className="city-scene" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={300} height={120} className="sky" />
      {scene === 'village' && (
        <>
          <circle cx={240} cy={30} r={14} className="moon" />
          <path className="hill" d="M0 95q75-30 150-10t150-5v40H0z" />
          <path className="house" d="M40 100V78l14-12 14 12v22zM90 100V70h40v30zM104 70l6-14 6 14z" />
          <path className="house" d="M170 100V60l20-16 20 16v40zM186 100V86h8v14z" />
          <rect x={95} y={78} width={6} height={6} className="window" />
          <rect x={117} y={78} width={6} height={6} className="window" />
          <rect x={180} y={64} width={6} height={6} className="window" />
          <path className="house" d="M230 100V82h30v18z" />
        </>
      )}
      {scene === 'port' && (
        <>
          <circle cx={60} cy={28} r={12} className="moon" />
          <path className="house" d="M0 90V60h30V45h20v45zM180 90V40l10-10v-12h4v60h40V55h30v35z" />
          <path className="crane" d="M120 90V20h4v70M120 22h50M166 22v24" />
          <rect x={160} y={46} width={12} height={10} className="window" />
          <path className="water" d="M0 92h300v28H0z" />
          <path className="wave" d="M0 100q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0" />
          <path className="house" d="M70 92l8-10h40l8 10z" />
          <rect x={0} y={0} width={300} height={120} className="mist" />
        </>
      )}
      {scene === 'snow' && (
        <>
          <path className="mountain" d="M0 100L70 30l40 40 50-55 70 70 30-25 40 40z" />
          <path className="snowcap" d="M70 30l14 14-8 2-6-4-6 4-8-2zM160 15l16 17-9 3-7-5-7 5-9-3z" />
          <path className="cable" d="M20 110L250 20" />
          <rect x={130} y={58} width={12} height={9} className="house" />
          <path className="house" d="M200 110V92l16-12 16 12v18z" />
          <rect x={212} y={96} width={7} height={7} className="window" />
          <path className="ground-snow" d="M0 104q150-12 300 0v16H0z" />
        </>
      )}
    </svg>
  )
}

interface SetupProps {
  pack: CityPack
  players: string[]
  onChange: (players: string[]) => void
  onBack: () => void
  onStart: (players: string[]) => void
}

function Setup({ pack, players, onChange, onBack, onStart }: SetupProps) {
  const names = players.map((p, i) => p.trim() || `Следователь ${i + 1}`)
  const update = (i: number, value: string) => onChange(players.map((p, j) => (j === i ? value : p)))

  return (
    <div className="setup">
      <button className="link" onClick={onBack}>
        ← К городам
      </button>
      <h1>{pack.city}</h1>
      <CommissarSays text="Кто сегодня в смене? Запишите всех по кругу, как сидите. Ведущим будет каждый по очереди." />
      <ol className="players">
        {players.map((p, i) => (
          <li key={i}>
            <input
              id={`player-${i}`}
              value={p}
              placeholder={`Следователь ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
            />
            {players.length > MIN_PLAYERS && (
              <button
                className="link"
                aria-label="Убрать игрока"
                onClick={() => onChange(players.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ol>
      {players.length < MAX_PLAYERS && <button onClick={() => onChange([...players, ''])}>+ Добавить игрока</button>}
      <div className="setup-start">
        <button className="primary" onClick={() => onStart(names)}>
          Начать расследование
        </button>
      </div>
    </div>
  )
}
