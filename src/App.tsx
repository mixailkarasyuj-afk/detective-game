import { useState, type FormEvent } from 'react'
import { Game } from './components/Game'
import { MAX_PATROLS, MAX_ROUNDS } from './game/engine'
import type { CityPack } from './game/types'
import { catalog } from './packs/catalog'
import { loadUnlocked, redeemCode } from './packs/unlock'

type Screen = { name: 'home' } | { name: 'setup'; pack: CityPack } | { name: 'game'; pack: CityPack; players: string[] }

const MIN_PLAYERS = 3
const MAX_PLAYERS = 8

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [players, setPlayers] = useState<string[]>(['', '', ''])

  if (screen.name === 'game') {
    return <Game pack={screen.pack} players={screen.players} onExit={() => setScreen({ name: 'home' })} />
  }
  if (screen.name === 'setup') {
    return (
      <Setup
        pack={screen.pack}
        players={players}
        onChange={setPlayers}
        onBack={() => setScreen({ name: 'home' })}
        onStart={(names) => setScreen({ name: 'game', pack: screen.pack, players: names })}
      />
    )
  }
  return <Home onPlay={(pack) => setScreen({ name: 'setup', pack })} />
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
    setCodeMessage(`Открыт пакет «${catalog.find((c) => c.id === packId)?.title}».`)
  }

  return (
    <div className="home">
      <header className="hero">
        <p className="eyebrow">Детективная пати-игра для одного ноутбука</p>
        <h1>Беглец</h1>
        <p className="lead-text">
          В городе совершено преступление. Вы — команда следователей. Допрашивайте свидетелей, ищите следы,
          перекрывайте районы и поймайте преступника, пока он не покинул город.
        </p>
        <p className="facts">3–8 игроков · 30–40 минут · 16+</p>
      </header>

      <section className="how">
        <h2>Как играть</h2>
        <ol>
          <li>Садитесь вокруг одного ноутбука. Ноутбук играет беглеца и всех свидетелей.</li>
          <li>
            Каждый раунд ведущий следователь меняется. Команда обсуждает, а ведущий выбирает два разных действия из
            трёх: допрос, осмотр или патруль.
          </li>
          <li>После ваших действий беглец тайно переходит в соседний район. В районы с патрулём он не заходит.</li>
          <li>
            Свидетели помогают, но трое из них врут. Сверяйте показания и вычёркивайте подозреваемых.
          </li>
          <li>
            Поставьте патруль туда, где прячется беглец, и назовите его по имени. На всё — {MAX_ROUNDS} раундов и{' '}
            {MAX_PATROLS} патруля.
          </li>
        </ol>
      </section>

      <section className="shop">
        <h2>Дела</h2>
        <div className="cards">
          {catalog.map((entry) => {
            const owned = entry.price === 0 || unlocked.includes(entry.id)
            return (
              <article key={entry.id} className="card">
                <h3>{entry.title}</h3>
                <p>{entry.tagline}</p>
                <div className="card-foot">
                  {entry.pack && owned ? (
                    <button className="primary" onClick={() => onPlay(entry.pack!)}>
                      Играть{entry.price === 0 ? ' бесплатно' : ''}
                    </button>
                  ) : owned ? (
                    <span className="badge">Куплено · скоро в игре</span>
                  ) : (
                    <>
                      <span className="price">{entry.price} ₽</span>
                      <button disabled title="Оплата появится позже">
                        Купить · скоро
                      </button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>

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
        ← Назад
      </button>
      <h1>{pack.title}</h1>
      <p>Впишите игроков по порядку, как сидите. Роль ведущего будет переходить по кругу.</p>
      <ol className="players">
        {players.map((p, i) => (
          <li key={i}>
            <input value={p} placeholder={`Следователь ${i + 1}`} onChange={(e) => update(i, e.target.value)} />
            {players.length > MIN_PLAYERS && (
              <button className="link" aria-label="Убрать игрока" onClick={() => onChange(players.filter((_, j) => j !== i))}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ol>
      {players.length < MAX_PLAYERS && (
        <button onClick={() => onChange([...players, ''])}>+ Добавить игрока</button>
      )}
      <div className="setup-start">
        <button className="primary" onClick={() => onStart(names)}>
          Начать расследование
        </button>
      </div>
    </div>
  )
}
