import type { ActionKind, CityPack, GameState } from './types'

export const MAX_ROUNDS = 8
export const MAX_PATROLS = 4
const LIARS_PER_CASE = 3

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

const shuffle = <T,>(items: T[]): T[] => {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const neighbors = (pack: CityPack, id: string): string[] =>
  pack.roads.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []))

export const districtName = (pack: CityPack, id: string): string =>
  pack.districts.find((d) => d.id === id)?.name ?? id

export const roundsAgo = (n: number): string => {
  if (n === 1) return 'раунд назад'
  const mod10 = n % 10
  const word = mod10 >= 2 && mod10 <= 4 && (n < 12 || n > 14) ? 'раунда' : 'раундов'
  return `${n} ${word} назад`
}

export const currentPosition = (s: GameState): string => s.path[s.round]

export const leadPlayer = (s: GameState): string => s.players[(s.round - 1) % s.players.length]

const moveFugitive = (s: GameState, from: string): string => {
  const options = neighbors(s.pack, from).filter((d) => !s.patrols.includes(d))
  if (options.length === 0) return from
  const fresh = options.filter((d) => !s.path.includes(d))
  return pick(fresh.length > 0 ? fresh : options)
}

export const newGame = (pack: CityPack, players: string[]): GameState => {
  const crimeScene = pick(pack.districts).id
  const names = shuffle(pack.witnesses)
  const witnessByDistrict = Object.fromEntries(pack.districts.map((d, i) => [d.id, names[i % names.length]]))
  const state: GameState = {
    pack,
    players,
    round: 1,
    crime: pick(pack.crimes),
    crimeScene,
    culpritId: pick(pack.suspects).id,
    path: [crimeScene],
    patrols: [],
    witnessByDistrict,
    // Свидетель на месте преступления не врёт, иначе первая зацепка была бы ловушкой.
    liarDistricts: shuffle(pack.districts.map((d) => d.id).filter((id) => id !== crimeScene)).slice(0, LIARS_PER_CASE),
    clues: [],
    status: 'playing',
  }
  // Пока полиция едет на вызов, беглец успевает уйти на один район.
  state.path.push(moveFugitive(state, crimeScene))
  return state
}

export const culprit = (s: GameState) => s.pack.suspects.find((p) => p.id === s.culpritId)!

const traitPhrase = (s: GameState, lie: boolean): string => {
  const trait = pick(s.pack.traits)
  const truth = culprit(s).traits[trait.id]
  const value = lie ? pick(Object.keys(trait.values).filter((v) => v !== truth)) : truth
  return trait.values[value]
}

// Последний раунд (до текущего), когда беглец был в районе, или -1.
const lastVisit = (s: GameState, districtId: string): number => {
  for (let t = s.round - 1; t >= 0; t--) if (s.path[t] === districtId) return t
  return -1
}

const interrogate = (s: GameState, d: string): string => {
  const lie = s.liarDistricts.includes(d)
  const here = currentPosition(s)
  const visit = lastVisit(s, d)
  const wrongWay = () => districtName(s.pack, pick(neighbors(s.pack, d)))

  if (here === d) {
    return lie
      ? `«Да был тут кто-то, побежал в сторону района «${wrongWay()}».» ${traitPhrase(s, true)}`
      : `«Какой-то тип весь день здесь ошивается, будто прячется.» ${traitPhrase(s, false)}`
  }
  if (visit >= 0) {
    const went = lie ? wrongWay() : districtName(s.pack, s.path[visit + 1])
    return `«Видел подозрительного человека ${roundsAgo(s.round - visit)}. Ушёл в сторону района «${went}».» ${traitPhrase(s, lie)}`
  }
  return `«Сам я никого не видел, но люди говорят…» ${traitPhrase(s, lie)}`
}

const inspect = (s: GameState, d: string): string => {
  const parts: string[] = []
  if (d === s.crimeScene) {
    const found = s.clues.filter((c) => c.kind === 'inspect' && c.districtId === d).length
    const trait = s.pack.traits[found % s.pack.traits.length]
    parts.push(`Улика с места преступления. ${trait.label}: ${culprit(s).traits[trait.id]}.`)
  }
  const visit = lastVisit(s, d)
  if (currentPosition(s) === d) parts.push('Свежие следы! Беглец прямо сейчас где-то в этом районе.')
  else if (visit > 0) parts.push(`Следы беглеца: он был здесь ${roundsAgo(s.round - visit)}.`)
  else if (d !== s.crimeScene) parts.push('Никаких следов.')
  return parts.join(' ')
}

export const canPatrol = (s: GameState): boolean => s.patrols.length < MAX_PATROLS

export const applyAction = (s: GameState, kind: ActionKind, d: string): GameState => {
  const next: GameState = { ...s, clues: [...s.clues], patrols: [...s.patrols] }
  let text: string
  if (kind === 'interrogate') {
    text = `${s.witnessByDistrict[d]}: ${interrogate(s, d)}`
  } else if (kind === 'inspect') {
    text = inspect(s, d)
  } else if (currentPosition(s) === d) {
    next.status = 'caught'
    text = 'Патруль задержал беглеца! Теперь назовите виновного.'
  } else {
    next.patrols.push(d)
    text = 'Патруль занял район. Беглец больше не сможет сюда войти.'
  }
  next.clues.push({ round: s.round, kind, districtId: d, text })
  return next
}

export const endRound = (s: GameState): GameState => {
  if (s.status !== 'playing') return s
  if (s.round >= MAX_ROUNDS) {
    return { ...s, status: 'lost', endReason: 'Время вышло: беглец покинул город.' }
  }
  const next: GameState = { ...s, path: [...s.path] }
  next.path.push(moveFugitive(next, currentPosition(s)))
  next.round = s.round + 1
  return next
}

export const accuse = (s: GameState, suspectId: string): GameState =>
  suspectId === s.culpritId
    ? { ...s, status: 'won', endReason: 'Беглец пойман и опознан. Дело закрыто!' }
    : { ...s, status: 'lost', endReason: `Задержали не того. Настоящий преступник — ${culprit(s).name}.` }
