import type { CityPack } from '../game/types'
import pilot from './pilot.json'

export interface CatalogEntry {
  id: string
  title: string
  tagline: string
  price: number // ₽, 0 — бесплатно
  pack?: CityPack // нет — пакет ещё в работе
}

export const catalog: CatalogEntry[] = [
  {
    id: 'pilot',
    title: 'Пилот: Туманск',
    tagline: 'Тихий городок, где все друг друга знают. 12 районов, 6 подозреваемых, 4 преступления.',
    price: 0,
    pack: pilot as unknown as CityPack,
  },
  {
    id: 'port',
    title: 'Порт Ветров',
    tagline: 'Контрабанда, туман над доками и капитаны, которым есть что скрывать.',
    price: 299,
  },
  {
    id: 'snow',
    title: 'Снежногорск',
    tagline: 'Курорт в горах, отрезанный метелью. Преступник всё ещё среди гостей.',
    price: 299,
  },
]
