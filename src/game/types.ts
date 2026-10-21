// Данные «пакета города»: карта, подозреваемые, свидетели, преступления, слухи.
// Каждый пакет — отдельный JSON-файл в src/packs.

export interface District {
  id: string
  name: string
  x: number // 0..100, координаты на схеме города
  y: number
  icon?: string // рисунок района на карте
  spots?: string[] // что осматривают в районе, в винительном падеже: «кассы и зал ожидания»
}

export type Question = 'who' | 'wear' | 'where'

export interface TraitValue {
  seen: string // как свидетель описывает примету
  clue: string // текст улики при осмотре
}

export interface Trait {
  id: string
  label: string
  // positive — улика называет примету преступника (исключает всех с другой),
  // negative — улика снимает подозрение с одного человека
  clue: 'positive' | 'negative'
  question: Exclude<Question, 'where'> // на какой вопрос свидетеля отвечает эта примета
  values: Record<string, TraitValue>
}

export interface Look {
  coat: string
  skin: string
  hair?: string
  hat?: boolean
  cap?: boolean
  scarf?: string
  glasses?: boolean
  mustache?: boolean
  beard?: boolean
  bun?: boolean // пучок волос
}

export interface Suspect {
  id: string
  name: string
  role: string
  traits: Record<string, string> // traitId → значение
  look?: Look // портрет
}

export interface Witness {
  district: string
  name: string
  character: string // подсказка игрокам, насколько верить
  lie: Partial<Record<Question, number>> // вероятность соврать на вопрос
  silence?: number // вероятность промолчать
  rumors?: boolean // отвечает, даже если сам ничего не видел
  wrongTime?: boolean // путает, когда это было
  look?: Look
  voice?: { greet?: string[]; none?: string[] } // свои присказки свидетеля
}

export type EventKind = 'closeRoad' | 'rain' | 'tip' | 'bribe' | 'reinforcement' | 'blackout' | 'spooked' | 'sighting' | 'falseAlarm'

// Сюжетное событие раунда. В тексте можно использовать {a}, {b} (концы дороги), {d} (район), {w} (свидетель), {t} (примета).
export interface StoryEvent {
  kind: EventKind
  title: string
  text: string
}

export interface Crime {
  title: string
  text: string
  scene?: string // район; если не задан — случайный
}

export interface CityPack {
  id: string
  title: string
  city: string
  rounds: number
  districts: District[]
  roads: [string, string][]
  traits: Trait[]
  suspects: Suspect[]
  witnesses: Witness[]
  crimes: Crime[]
  rumors: string[] // {d} — название района
  newspaper: string // название местной газеты
  events: StoryEvent[]
}

// Состояние партии

export type ActionKind = 'interrogate' | 'inspect' | 'patrol'

export interface Entry {
  round: number
  icon: string
  district?: string
  speaker?: string // имя свидетеля, если это его слова
  trail?: boolean // найдены следы беглеца
  title: string
  text: string
}

export interface GameState {
  pack: CityPack
  players: string[]
  round: number // 1..pack.rounds
  crime: Crime
  crimeScene: string
  suspects: string[] // подозреваемые этого дела
  culpritId: string
  path: string[] // path[r] — где беглец в раунде r (path[0] — место преступления)
  patrols: string[]
  evidence: Record<string, string> // район → ещё не найденная улика
  searched: string[] // районы, где следователи действовали (раунд за раундом, для беглеца)
  searchedAt: Record<string, number>
  lies: string[] // свидетели, которые соврали за партию
  rumor: string
  log: Entry[]
  event?: { kind: EventKind; title: string; text: string } // событие текущего раунда
  deck: StoryEvent[] // ещё не случившиеся события
  actions: number // сколько действий в этом раунде
  closedRoads: { road: [string, string]; until: number }[]
  rainUntil: number
  blackout?: string
  bribed: string[] // районы подкупленных свидетелей
  spooked: boolean // беглец сделает два шага
  exits: string[] // куда беглец может рвануть при аресте
  status: 'playing' | 'chase' | 'won' | 'lost'
  stars: number
  endReason?: string
}
