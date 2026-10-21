// Данные «пакета города»: карта, подозреваемые, преступления, свидетели.
// Каждый пакет — отдельный JSON-файл в src/packs.

export interface District {
  id: string
  name: string
  x: number // 0..100, координаты на схеме города
  y: number
}

export interface Trait {
  id: string
  label: string // «Рост», «Одежда», «Примета»
  // значение → фраза свидетеля, например «высокий» → «Он был высокого роста»
  values: Record<string, string>
}

export interface Suspect {
  id: string
  name: string
  role: string
  traits: Record<string, string> // traitId → значение
}

export interface Crime {
  title: string
  text: string
}

export interface CityPack {
  id: string
  title: string
  city: string
  districts: District[]
  roads: [string, string][]
  traits: Trait[]
  suspects: Suspect[]
  crimes: Crime[]
  witnesses: string[]
}

// Состояние партии

export type ActionKind = 'interrogate' | 'inspect' | 'patrol'

export interface Clue {
  round: number
  kind: ActionKind
  districtId: string
  text: string
}

export interface GameState {
  pack: CityPack
  players: string[]
  round: number // 1..MAX_ROUNDS
  crime: Crime
  crimeScene: string
  culpritId: string
  path: string[] // path[t] — где беглец был в начале раунда t (path[0] — место преступления)
  patrols: string[]
  witnessByDistrict: Record<string, string>
  liarDistricts: string[] // свидетели, которые врут
  clues: Clue[]
  status: 'playing' | 'caught' | 'won' | 'lost'
  endReason?: string
}
