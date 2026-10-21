import type { CityPack } from '../game/types'
import sonnyYar from './sonny-yar.json'

export interface CatalogEntry {
  id: string
  title: string
  crime: string
  tagline: string
  twist?: string // особая механика города
  districts: number
  price: number // ₽, 0 — бесплатно
  scene: 'village' | 'port' | 'snow' // иллюстрация на карточке
  pack?: CityPack // нет — город ещё в работе
}

export const catalog: CatalogEntry[] = [
  {
    id: 'sonny-yar',
    title: 'Сонный Яр',
    crime: 'Пропавшая скрипка',
    tagline: 'Тихий городок, где все друг друга знают. Ночью из филармонии украли старинную скрипку.',
    districts: 8,
    price: 0,
    scene: 'village',
    pack: sonnyYar as unknown as CityPack,
  },
  {
    id: 'kamensk',
    title: 'Туманный Каменск',
    crime: 'Пропавший груз',
    tagline: 'Портовый город, ночь, контрабанда. Из пакгауза исчез груз, и все в доках делают вид, что спали.',
    twist: 'Паромы уносят беглеца сразу на два района, а туман скрывает следы.',
    districts: 12,
    price: 249,
    scene: 'port',
  },
  {
    id: 'snezhnogorsk',
    title: 'Снежногорск',
    crime: 'Бриллиантовое колье',
    tagline: 'Горнолыжный курорт. У звезды эстрады пропало колье, а дорогу вниз вот-вот заметёт.',
    twist: 'Следы на снегу показывают направление, но метель их стирает и останавливает канатку.',
    districts: 12,
    price: 249,
    scene: 'snow',
  },
]

export const BUNDLE_PRICE = 399
