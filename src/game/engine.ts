import type { ActionKind, CityPack, Entry, GameState, Question, Suspect, Witness } from './types'

export const MAX_PATROLS = 3
export const SUSPECTS_PER_CASE = 6
const RUMOR_TRUTH = 0.6

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
const chance = (p = 0) => Math.random() < p

const shuffle = <T,>(items: T[]): T[] => {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const weightedPick = <T,>(items: { item: T; weight: number }[]): T => {
  let r = Math.random() * items.reduce((sum, x) => sum + x.weight, 0)
  for (const x of items) if ((r -= x.weight) <= 0) return x.item
  return items[items.length - 1].item
}

export const neighbors = (pack: CityPack, id: string): string[] =>
  pack.roads.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []))

export const districtName = (pack: CityPack, id: string): string =>
  pack.districts.find((d) => d.id === id)?.name ?? id

export const witnessIn = (pack: CityPack, districtId: string): Witness | undefined =>
  pack.witnesses.find((w) => w.district === districtId)

export const suspectsOf = (s: GameState): Suspect[] => s.pack.suspects.filter((p) => s.suspects.includes(p.id))

export const culprit = (s: GameState): Suspect => s.pack.suspects.find((p) => p.id === s.culpritId)!

export const leadPlayer = (s: GameState): string => s.players[(s.round - 1) % s.players.length]

export const roundsAgo = (n: number): string => {
  if (n <= 0) return 'только что'
  if (n === 1) return 'раунд назад'
  return `${n} ${n >= 2 && n <= 4 ? 'раунда' : 'раундов'} назад`
}

const here = (s: GameState): string => s.path[s.round]

// Улики дела: одна называет примету (например, рост), остальные снимают подозрение
// с каждого невиновного. Вместе они однозначно указывают на преступника,
// а их не больше, чем подозреваемых — дело решается за 4–5 осмотров.
const dealEvidence = (pack: CityPack, suspects: Suspect[], culpritId: string, scene: string) => {
  const guilty = suspects.find((p) => p.id === culpritId)!
  const cards: string[] = []
  const positive = pack.traits.filter((t) => t.clue === 'positive')
  const negative = pack.traits.filter((t) => t.clue === 'negative')
  for (const t of positive) cards.push(t.values[guilty.traits[t.id]].clue)
  for (const p of suspects) {
    if (p.id === culpritId) continue
    const t = pick(negative.filter((n) => p.traits[n.id] !== guilty.traits[n.id]))
    cards.push(t.values[p.traits[t.id]].clue)
  }
  const districts = [scene, ...shuffle(pack.districts.map((d) => d.id).filter((id) => id !== scene))]
  return Object.fromEntries(shuffle(cards).map((c, i) => [districts[i], c]))
}

// Беглец уходит от патрулей и от районов, где недавно были следователи, но не всегда.
const moveFugitive = (s: GameState): string => {
  const from = here(s)
  const options = [from, ...neighbors(s.pack, from)].filter((d) => !s.patrols.includes(d))
  if (options.length === 0) return from
  return weightedPick(
    options.map((d) => {
      const lastSeen = s.searchedAt[d] ?? -10
      let weight = s.round - lastSeen <= 1 ? 0.25 : 1
      if (d === from) weight *= 0.5
      return { item: d, weight }
    }),
  )
}

const makeRumor = (s: GameState): string => {
  const d = chance(RUMOR_TRUTH) ? here(s) : pick(s.pack.districts.map((x) => x.id).filter((id) => id !== here(s)))
  return pick(s.pack.rumors).replace('{d}', districtName(s.pack, d))
}

const startRound = (s: GameState): GameState => {
  const next = { ...s, path: [...s.path] }
  next.path[s.round] = moveFugitive({ ...s, round: s.round - 1 })
  next.rumor = makeRumor(next)
  next.log = [...s.log, { round: s.round, icon: '📰', title: 'Слухи', text: next.rumor }]
  return next
}

export const newGame = (pack: CityPack, players: string[]): GameState => {
  const crime = pick(pack.crimes)
  const scene = crime.scene ?? pick(pack.districts).id
  const suspects = shuffle(pack.suspects).slice(0, SUSPECTS_PER_CASE)
  const culpritId = pick(suspects).id
  const state: GameState = {
    pack,
    players,
    round: 1,
    crime,
    crimeScene: scene,
    suspects: pack.suspects.filter((p) => suspects.includes(p)).map((p) => p.id),
    culpritId,
    path: [scene],
    patrols: [],
    evidence: dealEvidence(pack, suspects, culpritId, scene),
    searched: [],
    searchedAt: { [scene]: 0 },
    lies: [],
    rumor: '',
    log: [],
    status: 'playing',
    stars: 0,
  }
  return startRound(state)
}

// Последний раунд (не считая текущего), когда беглец был в районе, или -1.
const lastVisit = (s: GameState, d: string): number => {
  for (let t = s.round - 1; t >= 0; t--) if (s.path[t] === d) return t
  return -1
}

const otherSuspect = (s: GameState): Suspect => pick(suspectsOf(s).filter((p) => p.id !== s.culpritId))

const seenTrait = (s: GameState, q: 'who' | 'wear', lie: boolean): string => {
  const trait = pick(s.pack.traits.filter((t) => t.question === q))
  const person = lie ? otherSuspect(s) : culprit(s)
  return trait.values[person.traits[trait.id]].seen
}

export const QUESTIONS: Record<Question, string> = {
  who: 'Кого вы видели?',
  wear: 'Во что он был одет?',
  where: 'Куда он пошёл?',
}

const interrogate = (s: GameState, d: string, q: Question): { text: string; lied: boolean } => {
  const w = witnessIn(s.pack, d)!
  if (chance(w.silence)) return { text: '…Свидетель отмахнулся и промолчал.', lied: false }

  const nowHere = here(s) === d
  const visit = nowHere ? s.round : lastVisit(s, d)
  const saw = visit >= 0
  if (!saw && !w.rumors) return { text: '«Никого подозрительного я тут не видел.»', lied: false }

  const lie = chance(w.lie[q])
  if (q !== 'where') {
    const intro = saw ? 'Видел' : 'Слышал от людей'
    return { text: `«${intro}: ${seenTrait(s, q, lie).toLowerCase()}»`, lied: lie }
  }

  if (!saw) {
    return { text: `«Говорят, он подался в район «${districtName(s.pack, pick(s.pack.districts).id)}».»`, lied: true }
  }
  const when = w.wrongTime ? roundsAgo(Math.floor(Math.random() * 3) + 1) : roundsAgo(s.round - visit)
  if (nowHere && !lie) return { text: '«Он всё ещё где-то здесь, я видел его совсем недавно!»', lied: false }
  const truthWay = nowHere ? d : s.path[visit + 1]
  const way = lie ? pick(neighbors(s.pack, d).filter((n) => n !== truthWay)) ?? truthWay : truthWay
  const where = way === d ? 'никуда не ушёл, крутился здесь' : `ушёл в сторону района «${districtName(s.pack, way)}»`
  return { text: `«Видел его ${when}, он ${where}.»`, lied: lie || (w.wrongTime ?? false) }
}

const inspect = (s: GameState, d: string): string => {
  const parts: string[] = []
  const visit = lastVisit(s, d)
  if (here(s) === d) parts.push('Свежие следы! Беглец прямо сейчас в этом районе.')
  else if (visit >= 0) parts.push(`Следы беглеца: он был здесь ${roundsAgo(s.round - visit)}.`)
  if (s.evidence[d]) parts.push(`Улика: ${s.evidence[d]}`)
  return parts.length > 0 ? parts.join(' ') : 'Ни следов, ни улик.'
}

export interface Action {
  kind: ActionKind
  district: string
  question?: Question
  movePatrolFrom?: string // переставить патруль из этого района
}

export const canPlacePatrol = (s: GameState): boolean => s.patrols.length < MAX_PATROLS

export const applyAction = (s: GameState, a: Action): GameState => {
  const next: GameState = {
    ...s,
    patrols: [...s.patrols],
    evidence: { ...s.evidence },
    searchedAt: { ...s.searchedAt, [a.district]: s.round },
    lies: [...s.lies],
  }
  const name = districtName(s.pack, a.district)
  let entry: Entry
  if (a.kind === 'interrogate') {
    const w = witnessIn(s.pack, a.district)!
    const q = a.question ?? 'who'
    const { text, lied } = interrogate(s, a.district, q)
    if (lied && !next.lies.includes(w.name)) next.lies.push(w.name)
    entry = { round: s.round, district: a.district, icon: '🗣', title: `${w.name}, ${name} · ${QUESTIONS[q]}`, text }
  } else if (a.kind === 'inspect') {
    entry = { round: s.round, district: a.district, icon: '🔍', title: `Осмотр: ${name}`, text: inspect(s, a.district) }
    delete next.evidence[a.district]
  } else {
    if (a.movePatrolFrom) next.patrols = next.patrols.filter((p) => p !== a.movePatrolFrom)
    next.patrols.push(a.district)
    const from = a.movePatrolFrom ? ` (снят из района «${districtName(s.pack, a.movePatrolFrom)}»)` : ''
    entry = { round: s.round, district: a.district, icon: '🚓', title: `Патруль: ${name}`, text: `Беглец не сможет войти в этот район${from}.` }
  }
  next.log = [...s.log, entry]
  return next
}

export const endRound = (s: GameState): GameState => {
  if (s.status !== 'playing') return s
  if (s.round >= s.pack.rounds) {
    return { ...s, status: 'lost', endReason: 'Время вышло: преступник покинул город.' }
  }
  return startRound({ ...s, round: s.round + 1 })
}

export const starsFor = (round: number, rounds: number): number =>
  round <= Math.ceil(rounds / 3) ? 3 : round <= Math.ceil((rounds * 2) / 3) ? 2 : 1

export const arrest = (s: GameState, suspectId: string, district: string): GameState => {
  const rightPerson = suspectId === s.culpritId
  const rightPlace = district === here(s)
  if (rightPerson && rightPlace) {
    return { ...s, status: 'won', stars: starsFor(s.round, s.pack.rounds), endReason: 'Преступник арестован. Дело закрыто!' }
  }
  const reason = !rightPerson
    ? `Арестовали не того. Настоящий преступник — ${culprit(s).name}.`
    : `Это был он, но в районе «${districtName(s.pack, district)}» его не оказалось. Он прятался в районе «${districtName(s.pack, here(s))}».`
  return { ...s, status: 'lost', endReason: reason }
}

