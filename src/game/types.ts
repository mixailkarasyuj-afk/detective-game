// Данные «пакета города»: карта, подозреваемые, свидетели, преступления, слухи.
// Каждый пакет — отдельный JSON-файл в src/packs.

export interface District {
  id: string
  name: string
  x: number // 0..100, координаты на схеме города
  y: number
  icon?: string // рисунок района на карте
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

export interface Suspect {
  id: string
  name: string
  role: string
  traits: Record<string, string> // traitId → значение
  look?: { coat: string; skin: string; hair?: string; hat?: boolean; cap?: boolean } // портрет
}

export interface Witness {
  district: string
  name: string
  character: string // подсказка игрокам, насколько верить
  lie: Partial<Record<Question, number>> // вероятность соврать на вопрос
  silence?: number // вероятность промолчать
  rumors?: boolean // отвечает, даже если сам ничего не видел
  wrongTime?: boolean // путает, когда это было
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
}

// Состояние партии

export type ActionKind = 'interrogate' | 'inspect' | 'patrol'

export interface Entry {
  round: number
  icon: string
  district?: string
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
  status: 'playing' | 'won' | 'lost'
  stars: number
  endReason?: string
}
