import type { ActionKind, CityPack, Entry, GameState, Question, StoryEvent, Suspect, Witness } from './types'

export const MAX_PATROLS = 3
export const SUSPECTS_PER_CASE = 6
const RUMOR_TRUTH = 0.6
const BASE_ACTIONS = 2

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
const chance = (p = 0) => Math.random() < p
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

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

const isClosed = (s: GameState, a: string, b: string): boolean =>
  s.closedRoads.some(({ road: [x, y], until }) => until >= s.round && ((x === a && y === b) || (x === b && y === a)))

// Соседи, до которых можно дойти: без перекрытых дорог.
export const openNeighbors = (s: GameState, id: string): string[] =>
  neighbors(s.pack, id).filter((n) => !isClosed(s, id, n))

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
const stepFugitive = (s: GameState, from: string): string => {
  const options = [from, ...openNeighbors(s, from)].filter((d) => !s.patrols.includes(d))
  if (options.length === 0) return from
  return weightedPick(
    options.map((d) => {
      const lastSeen = s.searchedAt[d] ?? -10
      let weight = s.round - lastSeen <= 2 ? 0.25 : 1
      if (d === from) weight *= 0.5
      return { item: d, weight }
    }),
  )
}

const makeRumor = (s: GameState): string => {
  const d = chance(RUMOR_TRUTH) ? here(s) : pick(s.pack.districts.map((x) => x.id).filter((id) => id !== here(s)))
  return pick(s.pack.rumors).replace('{d}', districtName(s.pack, d))
}

const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w)\}/g, (m, k: string) => vars[k] ?? m)

// Сюжетное событие: меняет правила на раунд-другой и пишется в газету.
const applyEvent = (s: GameState, ev: StoryEvent): GameState => {
  const next = { ...s }
  const vars: Record<string, string> = {}
  const extra: string[] = []
  switch (ev.kind) {
    case 'closeRoad': {
      const roads = s.pack.roads.filter(([a, b]) => !isClosed(s, a, b))
      const road = pick(roads)
      next.closedRoads = [...s.closedRoads, { road, until: s.round + 1 }]
      vars.a = districtName(s.pack, road[0])
      vars.b = districtName(s.pack, road[1])
      break
    }
    case 'rain':
      next.rainUntil = s.round + 1
      break
    case 'tip': {
      const t = Math.max(1, s.round - 2)
      vars.d = districtName(s.pack, s.path[t])
      extra.push(`Это было ${roundsAgo(s.round - t)}.`)
      break
    }
    case 'bribe': {
      const honest = s.pack.witnesses.filter((w) => !s.bribed.includes(w.district))
      if (honest.length > 0) next.bribed = [...s.bribed, pick(honest).district]
      break
    }
    case 'reinforcement':
      next.actions = BASE_ACTIONS + 1
      break
    case 'blackout': {
      const d = pick(s.pack.districts.filter((x) => x.id !== s.crimeScene)).id
      next.blackout = d
      vars.d = districtName(s.pack, d)
      break
    }
    case 'spooked':
      next.spooked = true
      break
    case 'sighting': {
      const trait = pick(s.pack.traits.filter((t) => t.clue === 'negative'))
      vars.t = trait.values[culprit(s).traits[trait.id]].seen.toLowerCase()
      break
    }
    case 'falseAlarm':
      if (s.patrols.length > 0) {
        const removed = pick(s.patrols)
        next.patrols = s.patrols.filter((p) => p !== removed)
        vars.d = districtName(s.pack, removed)
      } else {
        vars.d = 'управлении'
        extra.push('Хорошо, что патрулей на улицах ещё нет.')
      }
      break
  }
  const text = [fill(ev.text, vars), ...extra].join(' ')
  next.event = { kind: ev.kind, title: ev.title, text }
  next.log = [...next.log, { round: s.round, icon: '⚡', title: ev.title, text }]
  return next
}

const startRound = (s: GameState): GameState => {
  let next: GameState = { ...s, path: [...s.path], actions: BASE_ACTIONS, blackout: undefined, event: undefined }
  let pos = stepFugitive({ ...next, round: s.round - 1 }, s.path[s.round - 1])
  if (s.spooked) {
    pos = stepFugitive({ ...next, round: s.round - 1 }, pos)
    next.spooked = false
  }
  next.path[s.round] = pos
  if (s.round > 1 && next.deck.length > 0) {
    const [ev, ...rest] = next.deck
    next = applyEvent({ ...next, deck: rest }, ev)
  }
  next.rumor = makeRumor(next)
  next.log = [...next.log, { round: s.round, icon: '📰', title: 'Слухи', text: next.rumor }]
  return next
}

export const newGame = (pack: CityPack, players: string[]): GameState => {
  const crime = pick(pack.crimes)
  const scene = crime.scene ?? pick(pack.districts).id
  const suspects = shuffle(pack.suspects).slice(0, SUSPECTS_PER_CASE)
  const culpritId = pick(suspects).id
  // Каждое событие встречается не больше раза за партию.
  const deck = shuffle(pack.events).slice(0, pack.rounds - 1)
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
    deck,
    actions: BASE_ACTIONS,
    closedRoads: [],
    rainUntil: -1,
    bribed: [],
    spooked: false,
    exits: [],
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

const NONE = [
  'Никого подозрительного я тут не видел.',
  'Тихо у нас было. Ни души.',
  'Не видел. А кого ищем-то?',
  'Чужих тут не было, я бы заметил.',
]
const SILENT = [
  '…Свидетель отмахнулся и промолчал.',
  '…Свидетель сделал вид, что не слышит вопроса.',
  '…«Мне неприятности не нужны». Больше ни слова.',
]
const SAW = ['Видел его, точно.', 'Был тут один, запомнил.', 'Как сейчас помню.', 'Да, проходил тут такой.']
const HEARSAY = ['Сама не видела, но говорят так:', 'Мне соседка рассказала:', 'Слухи ходят, что']
const WENT = [
  (way: string, when: string) => `Ушёл в сторону района «${way}», это было ${when}.`,
  (way: string, when: string) => `${capitalize(when)} рванул к району «${way}», только пятки сверкали.`,
  (way: string, when: string) => `Свернул на дорогу к «${way}». Было это ${when}.`,
]
const STILL_HERE = [
  'Он всё ещё где-то здесь, я видел его совсем недавно!',
  'Да вон же, только что за угол завернул. Он тут, в районе!',
  'Ещё не ушёл, голову даю. Крутится где-то рядом.',
]

const quote = (w: Witness, core: string) => {
  const greet = w.voice?.greet && chance(0.7) ? `${pick(w.voice.greet)} ` : ''
  return `«${greet}${core}»`
}

const interrogate = (s: GameState, d: string, q: Question): { text: string; lied: boolean } => {
  const w = witnessIn(s.pack, d)!
  if (chance(w.silence)) return { text: pick(SILENT), lied: false }

  const nowHere = here(s) === d
  const visit = nowHere ? s.round : lastVisit(s, d)
  const saw = visit >= 0
  if (!saw && !w.rumors) return { text: quote(w, pick(w.voice?.none ?? NONE)), lied: false }

  const bribed = s.bribed.includes(d)
  const lie = bribed ? chance(0.8) : chance(w.lie[q])
  if (q !== 'where') {
    const trait = seenTrait(s, q, lie)
    const core = saw ? `${pick(SAW)} ${trait}` : `${pick(HEARSAY)} ${trait.charAt(0).toLowerCase()}${trait.slice(1)}`
    return { text: quote(w, core), lied: lie }
  }

  if (!saw) {
    return { text: quote(w, `Говорят, он подался в район «${districtName(s.pack, pick(s.pack.districts).id)}».`), lied: true }
  }
  if (nowHere && !lie) return { text: quote(w, pick(STILL_HERE)), lied: false }
  const when = w.wrongTime ? roundsAgo(Math.floor(Math.random() * 3) + 1) : roundsAgo(s.round - visit)
  const truthWay = nowHere ? d : s.path[visit + 1]
  const way = lie ? (pick(neighbors(s.pack, d).filter((n) => n !== truthWay)) ?? truthWay) : truthWay
  if (way === d) return { text: quote(w, `Видел его ${when}. Никуда не ушёл, крутился здесь.`), lied: lie }
  return { text: quote(w, pick(WENT)(districtName(s.pack, way), when)), lied: lie || (w.wrongTime ?? false) }
}

const SEARCH = ['Осмотрели', 'Обыскали', 'Прочесали', 'Проверили']
const TRAIL = [
  (ago: string) => `Нашлись следы беглеца: он был здесь ${ago}.`,
  (ago: string) => `Грязь на ступенях и сбитая урна: он проходил тут ${ago}.`,
  (ago: string) => `Дворник вспомнил чужака, а на земле его следы. Был здесь ${ago}.`,
]
const FRESH = [
  'Ещё тёплый окурок и мокрые следы. Беглец прямо сейчас в этом районе!',
  'Хлопнула дверь, кто-то убежал дворами. Он здесь, в этом районе!',
  'Следы совсем свежие. Он где-то рядом, прямо сейчас.',
]
const EMPTY = ['Ничего. Только кот и старые газеты.', 'Пусто, ни следов, ни улик.', 'Ничего полезного, зря потратили время.']

const inspect = (s: GameState, d: string): { text: string; trail: boolean } => {
  if (s.blackout === d) return { text: 'В районе погас свет, в темноте ничего не разглядеть.', trail: false }
  const spot = pick(s.pack.districts.find((x) => x.id === d)?.spots ?? ['район'])
  const parts: string[] = [`${pick(SEARCH)} ${spot}.`]
  const visit = lastVisit(s, d)
  const raining = s.rainUntil >= s.round
  let trail = false
  if (here(s) === d) {
    parts.push(pick(FRESH))
    trail = true
  } else if (visit >= 0 && raining && s.round - visit > 1) {
    parts.push('Ливень смыл все старые следы.')
  } else if (visit >= 0) {
    parts.push(pick(TRAIL)(roundsAgo(s.round - visit)))
    trail = true
  }
  if (s.evidence[d]) parts.push(`Улика: ${s.evidence[d]}`)
  if (parts.length === 1) parts.push(pick(EMPTY))
  return { text: parts.join(' '), trail }
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
    entry = { round: s.round, district: a.district, speaker: w.name, icon: '🗣', title: `${w.name}, ${name} · ${QUESTIONS[q]}`, text }
  } else if (a.kind === 'inspect') {
    const { text, trail } = inspect(s, a.district)
    entry = { round: s.round, district: a.district, trail, icon: '🔍', title: `Осмотр: ${name}`, text }
    if (s.blackout !== a.district) delete next.evidence[a.district]
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

// Арест: нужно назвать преступника и район. Если у беглеца остался открытый выход, он бросается бежать.
export const arrest = (s: GameState, suspectId: string, district: string): GameState => {
  const rightPerson = suspectId === s.culpritId
  const rightPlace = district === here(s)
  if (!rightPerson) return { ...s, status: 'lost', endReason: `Арестовали не того. Настоящий преступник — ${culprit(s).name}.` }
  if (!rightPlace) {
    return {
      ...s,
      status: 'lost',
      endReason: `Это был он, но в районе «${districtName(s.pack, district)}» его не оказалось. Он прятался в районе «${districtName(s.pack, here(s))}».`,
    }
  }
  const exits = openNeighbors(s, district).filter((d) => !s.patrols.includes(d))
  if (exits.length === 0) {
    return { ...s, status: 'won', stars: starsFor(s.round, s.pack.rounds), endReason: 'Все выходы перекрыты, бежать некуда. Преступник арестован!' }
  }
  return { ...s, status: 'chase', exits }
}

// Перехват: команда ставит последний заслон на одну из улиц, беглец бежит по своей.
export const intercept = (s: GameState, district: string): GameState => {
  const escape = weightedPick(s.exits.map((d) => ({ item: d, weight: s.round - (s.searchedAt[d] ?? -10) <= 1 ? 0.5 : 1 })))
  const path = [...s.path]
  if (escape === district) {
    path[s.round] = escape
    return { ...s, path, status: 'won', stars: Math.max(1, starsFor(s.round, s.pack.rounds) - 1), endReason: `Перехват! Его взяли на выходе в район «${districtName(s.pack, escape)}».` }
  }
  path[s.round + 1] = escape
  return {
    ...s,
    path,
    round: s.round,
    status: 'lost',
    endReason: `Он ушёл через район «${districtName(s.pack, escape)}», пока заслон стоял у «${districtName(s.pack, district)}». Надо было перекрыть выходы патрулями.`,
  }
}
